using System.Data;
using System.Text;
using Microsoft.Data.SqlClient;

if (args.Length != 2)
{
    Console.Error.WriteLine("Usage: Mms.SqlCatalog <connection-env-name> <output-directory>");
    return 2;
}

var connectionString = Environment.GetEnvironmentVariable(args[0]);
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine($"Missing environment variable: {args[0]}");
    return 2;
}

var outputDirectory = Path.GetFullPath(args[1]);
Directory.CreateDirectory(outputDirectory);

await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

var procedures = await LoadProceduresAsync(connection);
var parameters = await LoadParametersAsync(connection);
var dependencies = await LoadDependenciesAsync(connection);

foreach (var procedure in procedures)
{
    procedure.Parameters.AddRange(parameters.Where(x => x.ObjectId == procedure.ObjectId));
    procedure.Dependencies.AddRange(dependencies.Where(x => x.ObjectId == procedure.ObjectId));
}

var generatedAt = DateTimeOffset.Now;
var groups = procedures.GroupBy(Classify).OrderBy(x => x.Key.Order).ToList();
await File.WriteAllTextAsync(Path.Combine(outputDirectory, "README.md"), BuildIndex(groups, connection, generatedAt), new UTF8Encoding(false));
foreach (var group in groups)
{
    await File.WriteAllTextAsync(
        Path.Combine(outputDirectory, group.Key.FileName),
        BuildGroupDocument(group.Key, group.OrderBy(x => x.Schema).ThenBy(x => x.Name).ToList(), connection, generatedAt),
        new UTF8Encoding(false));
}

Console.WriteLine($"Database: {connection.DataSource}/{connection.Database}");
Console.WriteLine($"Stored procedures documented: {procedures.Count}");
foreach (var group in groups) Console.WriteLine($"{group.Key.Title}: {group.Count()}");
Console.WriteLine($"Output: {outputDirectory}");
return 0;

static async Task<List<ProcedureInfo>> LoadProceduresAsync(SqlConnection connection)
{
    const string sql = """
        SELECT p.object_id, s.name AS schema_name, p.name, p.create_date, p.modify_date,
               p.is_ms_shipped, OBJECTPROPERTYEX(p.object_id, 'IsEncrypted') AS is_encrypted
        FROM sys.procedures p
        JOIN sys.schemas s ON s.schema_id = p.schema_id
        ORDER BY s.name, p.name;
        """;
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();
    var result = new List<ProcedureInfo>();
    while (await reader.ReadAsync())
    {
        result.Add(new ProcedureInfo(
            reader.GetInt32(0), reader.GetString(1), reader.GetString(2),
            reader.GetDateTime(3), reader.GetDateTime(4), reader.GetBoolean(5),
            !reader.IsDBNull(6) && Convert.ToInt32(reader.GetValue(6)) == 1));
    }
    return result;
}

static async Task<List<ParameterInfo>> LoadParametersAsync(SqlConnection connection)
{
    const string sql = """
        SELECT p.object_id, p.parameter_id, p.name,
               CASE WHEN t.is_user_defined = 1 THEN QUOTENAME(SCHEMA_NAME(t.schema_id)) + '.' + QUOTENAME(t.name) ELSE t.name END AS type_name,
               p.max_length, p.precision, p.scale, p.is_output, p.has_default_value,
               CONVERT(nvarchar(4000), p.default_value) AS default_value
        FROM sys.parameters p
        JOIN sys.types t ON t.user_type_id = p.user_type_id
        WHERE p.parameter_id > 0
        ORDER BY p.object_id, p.parameter_id;
        """;
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();
    var result = new List<ParameterInfo>();
    while (await reader.ReadAsync())
    {
        result.Add(new ParameterInfo(
            reader.GetInt32(0), reader.GetInt32(1), reader.GetString(2), reader.GetString(3),
            reader.GetInt16(4), reader.GetByte(5), reader.GetByte(6), reader.GetBoolean(7), reader.GetBoolean(8),
            reader.IsDBNull(9) ? null : reader.GetString(9)));
    }
    return result;
}

static async Task<List<DependencyInfo>> LoadDependenciesAsync(SqlConnection connection)
{
    const string sql = """
        SELECT d.referencing_id,
               COALESCE(QUOTENAME(OBJECT_SCHEMA_NAME(d.referenced_id)) + '.' + QUOTENAME(OBJECT_NAME(d.referenced_id)),
                        COALESCE(QUOTENAME(d.referenced_schema_name) + '.', '') + QUOTENAME(d.referenced_entity_name)) AS entity_name,
               COALESCE(o.type_desc, 'UNRESOLVED_OR_EXTERNAL') AS type_desc
        FROM sys.sql_expression_dependencies d
        LEFT JOIN sys.objects o ON o.object_id = d.referenced_id
        WHERE d.referencing_id IN (SELECT object_id FROM sys.procedures)
          AND d.referenced_entity_name IS NOT NULL
        ORDER BY d.referencing_id, entity_name;
        """;
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();
    var result = new List<DependencyInfo>();
    while (await reader.ReadAsync())
    {
        result.Add(new DependencyInfo(reader.GetInt32(0), reader.GetString(1), reader.GetString(2)));
    }
    return result.Distinct().ToList();
}

static Category Classify(ProcedureInfo procedure)
{
    if (procedure.Schema.Equals("api", StringComparison.OrdinalIgnoreCase)) return Categories.Api;
    if (procedure.Name.StartsWith("sp_MS", StringComparison.OrdinalIgnoreCase)) return Categories.Replication;
    if (Categories.DiagramNames.Contains(procedure.Name)) return Categories.Diagram;
    return Categories.Legacy;
}

static string BuildIndex(IEnumerable<IGrouping<Category, ProcedureInfo>> groups, SqlConnection connection, DateTimeOffset generatedAt)
{
    var all = groups.SelectMany(x => x).ToList();
    var builder = new StringBuilder();
    builder.AppendLine("# Danh mục stored procedure – MMS").AppendLine();
    builder.AppendLine($"- Database: `{connection.Database}`");
    builder.AppendLine($"- Máy chủ: `{connection.DataSource}`");
    builder.AppendLine($"- Thời điểm chụp metadata: `{generatedAt:yyyy-MM-dd HH:mm:ss zzz}`");
    builder.AppendLine($"- Tổng số stored procedure: **{all.Count}**").AppendLine();
    builder.AppendLine("## Phân loại").AppendLine();
    builder.AppendLine("| Nhóm | Số lượng | Tài liệu |").AppendLine("|---|---:|---|");
    foreach (var group in groups)
        builder.AppendLine($"| {group.Key.Title} | {group.Count()} | [{group.Key.FileName}]({group.Key.FileName}) |");
    builder.AppendLine().AppendLine("## Quy ước").AppendLine();
    builder.AppendLine("- `api`: contract versioned cho React/.NET API.");
    builder.AppendLine("- `Legacy nghiệp vụ`: procedure tùy chỉnh trong schema khác `api`.");
    builder.AppendLine("- `Replication`: procedure `sp_MS*` do SQL Server replication quản lý; không chỉnh sửa thủ công.");
    builder.AppendLine("- `Database diagram`: procedure hỗ trợ sơ đồ database; không phải logic nghiệp vụ.");
    builder.AppendLine("- Dependencies được lấy từ `sys.sql_expression_dependencies`; SQL động và linked server có thể không được phân giải đầy đủ.");
    builder.AppendLine("- Tài liệu không chứa connection string, mật khẩu hoặc dữ liệu nghiệp vụ.");
    return builder.ToString();
}

static string BuildGroupDocument(Category category, IReadOnlyList<ProcedureInfo> procedures, SqlConnection connection, DateTimeOffset generatedAt)
{
    var builder = new StringBuilder();
    builder.AppendLine($"# {category.Title}").AppendLine();
    builder.AppendLine($"Database `{connection.Database}` · snapshot `{generatedAt:yyyy-MM-dd HH:mm:ss zzz}` · **{procedures.Count} procedure**").AppendLine();
    builder.AppendLine("## Mục lục").AppendLine();
    foreach (var procedure in procedures)
        builder.AppendLine($"- [`{procedure.Schema}.{procedure.Name}`](#{Anchor(procedure.Schema + "-" + procedure.Name)})");
    foreach (var procedure in procedures)
    {
        builder.AppendLine().AppendLine($"## `{procedure.Schema}.{procedure.Name}`").AppendLine();
        builder.AppendLine($"- Phân loại: {category.Title}");
        builder.AppendLine($"- Hành vi suy đoán từ tên: {InferBehavior(procedure.Name)}");
        builder.AppendLine($"- Tạo: `{procedure.CreatedAt:yyyy-MM-dd HH:mm:ss}`");
        builder.AppendLine($"- Sửa gần nhất: `{procedure.ModifiedAt:yyyy-MM-dd HH:mm:ss}`");
        builder.AppendLine($"- Mã hóa định nghĩa: `{(procedure.IsEncrypted ? "Có" : "Không")}`");
        builder.AppendLine().AppendLine("### Tham số").AppendLine();
        if (procedure.Parameters.Count == 0) builder.AppendLine("Không có tham số.");
        else
        {
            builder.AppendLine("| # | Tên | Kiểu | Output | Giá trị mặc định |").AppendLine("|---:|---|---|---|---|");
            foreach (var parameter in procedure.Parameters)
                builder.AppendLine($"| {parameter.Ordinal} | `{parameter.Name}` | `{FormatType(parameter)}` | {(parameter.IsOutput ? "Có" : "Không")} | `{Escape(parameter.HasDefault ? parameter.DefaultValue ?? "NULL" : "—")}` |");
        }
        builder.AppendLine().AppendLine("### Đối tượng phụ thuộc").AppendLine();
        if (procedure.Dependencies.Count == 0) builder.AppendLine("Không phân giải được dependency tĩnh hoặc procedure không tham chiếu object khác.");
        else
        {
            builder.AppendLine("| Đối tượng | Loại |").AppendLine("|---|---|");
            foreach (var dependency in procedure.Dependencies)
                builder.AppendLine($"| `{Escape(dependency.EntityName)}` | {dependency.TypeDescription.Replace('_', ' ')} |");
        }
    }
    return builder.ToString();
}

static string InferBehavior(string name)
{
    if (name.StartsWith("sp_MS", StringComparison.OrdinalIgnoreCase)) return "SQL Server replication nội bộ";
    if (name.Contains("Get", StringComparison.OrdinalIgnoreCase) || name.Contains("List", StringComparison.OrdinalIgnoreCase)) return "Truy vấn dữ liệu";
    if (name.Contains("Create", StringComparison.OrdinalIgnoreCase) || name.Contains("Insert", StringComparison.OrdinalIgnoreCase)) return "Tạo dữ liệu";
    if (name.Contains("Save", StringComparison.OrdinalIgnoreCase) || name.Contains("Update", StringComparison.OrdinalIgnoreCase)) return "Ghi hoặc cập nhật dữ liệu";
    if (name.Contains("Delete", StringComparison.OrdinalIgnoreCase) || name.Contains("Cancel", StringComparison.OrdinalIgnoreCase)) return "Hủy hoặc xóa logic";
    if (name.Contains("Approve", StringComparison.OrdinalIgnoreCase) || name.Contains("Decide", StringComparison.OrdinalIgnoreCase) || name.Contains("Confirm", StringComparison.OrdinalIgnoreCase)) return "Quyết định trạng thái nghiệp vụ";
    if (name.Contains("Process", StringComparison.OrdinalIgnoreCase) || name.Contains("Complete", StringComparison.OrdinalIgnoreCase)) return "Xử lý giao dịch nghiệp vụ";
    return "Cần đối chiếu định nghĩa SQL/use case";
}

static string FormatType(ParameterInfo parameter)
{
    if (parameter.TypeName.StartsWith("[", StringComparison.Ordinal)) return parameter.TypeName;
    return parameter.TypeName.ToLowerInvariant() switch
    {
        "nvarchar" or "nchar" => $"{parameter.TypeName}({(parameter.MaxLength == -1 ? "max" : parameter.MaxLength / 2)})",
        "varchar" or "char" or "varbinary" or "binary" => $"{parameter.TypeName}({(parameter.MaxLength == -1 ? "max" : parameter.MaxLength)})",
        "decimal" or "numeric" => $"{parameter.TypeName}({parameter.Precision},{parameter.Scale})",
        _ => parameter.TypeName,
    };
}

static string Anchor(string value) => value.ToLowerInvariant().Replace('.', '-').Replace('_', '-');
static string Escape(string value) => value.Replace("|", "\\|").Replace("`", "'");

sealed class ProcedureInfo(int objectId, string schema, string name, DateTime createdAt, DateTime modifiedAt, bool isMsShipped, bool isEncrypted)
{
    public int ObjectId { get; } = objectId;
    public string Schema { get; } = schema;
    public string Name { get; } = name;
    public DateTime CreatedAt { get; } = createdAt;
    public DateTime ModifiedAt { get; } = modifiedAt;
    public bool IsMsShipped { get; } = isMsShipped;
    public bool IsEncrypted { get; } = isEncrypted;
    public List<ParameterInfo> Parameters { get; } = [];
    public List<DependencyInfo> Dependencies { get; } = [];
}

sealed record ParameterInfo(int ObjectId, int Ordinal, string Name, string TypeName, short MaxLength, byte Precision, byte Scale, bool IsOutput, bool HasDefault, string? DefaultValue);
sealed record DependencyInfo(int ObjectId, string EntityName, string TypeDescription);
sealed record Category(int Order, string Title, string FileName);

static class Categories
{
    public static readonly Category Api = new(1, "API contract", "API_CONTRACTS.md");
    public static readonly Category Legacy = new(2, "Legacy nghiệp vụ", "LEGACY_BUSINESS.md");
    public static readonly Category Replication = new(3, "Replication", "REPLICATION.md");
    public static readonly Category Diagram = new(4, "Database diagram", "DATABASE_DIAGRAM.md");
    public static readonly HashSet<string> DiagramNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "sp_alterdiagram", "sp_creatediagram", "sp_dropdiagram", "sp_helpdiagramdefinition",
        "sp_helpdiagrams", "sp_renamediagram", "sp_upgraddiagrams"
    };
}
