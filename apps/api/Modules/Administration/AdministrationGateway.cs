using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Administration;

public sealed class AdministrationGateway(
    ISqlConnectionFactory connectionFactory,
    IOptions<SqlOptions> options)
{
    public async Task<RoleMatrix> GetRoleMatrixAsync(
        string userId,
        string? roleCode,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_SEC_ADM01_GetRoleMatrix_v1");
        AddUser(command, userId);
        command.Parameters.Add("@RoleCode", SqlDbType.NVarChar, 50).Value = DbValue(roleCode);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var roles = new List<RoleSummary>();
        while (await reader.ReadAsync(cancellationToken))
        {
            roles.Add(new RoleSummary(
                reader.GetRequiredString("RoleCode"),
                reader.GetNullableString("RoleName"),
                reader.GetNullableDateTime("ChangedAt")));
        }

        var screens = new List<ScreenPermission>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                screens.Add(new ScreenPermission(
                    reader.GetRequiredString("ScreenCode"),
                    reader.GetNullableString("ScreenLabel"),
                    reader.GetNullableString("AccessMode"),
                    reader.GetBoolean(reader.GetOrdinal("IsGranted"))));
            }
        }

        return new RoleMatrix(roles, screens);
    }

    public async Task<SaveRoleResult> SaveRoleAsync(
        string userId,
        string roleCode,
        SaveRoleRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_SEC_ADM01_SaveRolePermissions_v1");
        AddUser(command, userId);
        command.Parameters.Add("@RoleCode", SqlDbType.NVarChar, 50).Value = roleCode;
        command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value = request.RoleName;
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime2).Value = DbValue(request.ExpectedChangedAt);
        command.Parameters.Add(new SqlParameter("@Permissions", SqlDbType.Structured)
        {
            TypeName = "api.RolePermissionItem_v1",
            Value = CreatePermissionTable(request.Permissions),
        });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP ADM-01 không trả kết quả lưu vai trò.");
        }

        return new SaveRoleResult(
            reader.GetRequiredString("RoleCode"),
            reader.GetRequiredString("RoleName"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")),
            reader.GetRequiredInt32("PermissionCount"));
    }

    public async Task<IReadOnlyList<ConfigurationItem>> GetCatalogAsync(
        string userId,
        string catalogCode,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_ADM02_GetConfigurationCatalog_v1");
        AddUser(command, userId);
        command.Parameters.Add("@CatalogCode", SqlDbType.NVarChar, 40).Value = catalogCode;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<ConfigurationItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new ConfigurationItem(
                reader.GetRequiredString("KeyCode"),
                reader.GetNullableString("Name"),
                reader.GetNullableString("Description"),
                reader.GetNullableString("LogicValue"),
                reader.GetNullableString("DisplayValue"),
                reader.GetNullableDateTime("ChangedAt")));
        }

        return items;
    }

    public async Task<SaveConfigurationResult> SaveCatalogItemAsync(
        string userId,
        string catalogCode,
        string keyCode,
        SaveConfigurationRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_ADM02_SaveConfiguration_v1");
        AddUser(command, userId);
        command.Parameters.Add("@CatalogCode", SqlDbType.NVarChar, 40).Value = catalogCode;
        command.Parameters.Add("@KeyCode", SqlDbType.NVarChar, 50).Value = keyCode;
        command.Parameters.Add("@Name", SqlDbType.NVarChar, 100).Value = request.Name;
        command.Parameters.Add("@Description", SqlDbType.NVarChar, 255).Value = DbValue(request.Description);
        command.Parameters.Add("@LogicValue", SqlDbType.NVarChar, 50).Value = DbValue(request.LogicValue);
        command.Parameters.Add("@DisplayValue", SqlDbType.NVarChar, 100).Value = DbValue(request.DisplayValue);
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime2).Value = DbValue(request.ExpectedChangedAt);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP ADM-02 không trả kết quả lưu danh mục.");
        }

        return new SaveConfigurationResult(
            reader.GetRequiredString("CatalogCode"),
            reader.GetRequiredString("KeyCode"),
            reader.GetRequiredString("Name"),
            reader.GetNullableString("Description"),
            reader.GetNullableString("LogicValue"),
            reader.GetNullableString("DisplayValue"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<IReadOnlyList<UserItem>> GetUsersAsync(
        string? search,
        string? roleCode,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_admin_get_users");
        command.Parameters.AddWithValue("@search", (object?)search?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@role_code", (object?)roleCode?.Trim() ?? DBNull.Value);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var users = new List<UserItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            users.Add(new UserItem(
                reader.GetRequiredString("UserId"),
                reader.GetRequiredString("FullName"),
                reader.IsDBNull(reader.GetOrdinal("EmployeeCode")) ? null : reader.GetInt32(reader.GetOrdinal("EmployeeCode")),
                reader.GetNullableString("Password"),
                reader.GetRequiredString("RoleCode"),
                reader.GetRequiredString("RoleName"),
                reader.GetNullableString("JobTitle"),
                reader.GetNullableString("DepartmentCode"),
                reader.GetNullableString("BravoDepartmentCode"),
                reader.GetNullableString("DepartmentName"),
                reader.GetInt32(reader.GetOrdinal("IsActive"))
            ));
        }
        return users;
    }

    public async Task<SaveUserResult> SaveUserAsync(
        string userId,
        SaveUserRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_admin_save_user");
        command.Parameters.AddWithValue("@user_n", request.UserId.Trim());
        command.Parameters.AddWithValue("@ho_ten_nv", request.FullName.Trim());
        command.Parameters.AddWithValue("@password", (object?)request.Password?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@ma_role", request.RoleCode.Trim());
        command.Parameters.AddWithValue("@chuc_danh", (object?)request.JobTitle?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@ten_bravo_bophan", (object?)request.DepartmentName?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@status_active", request.IsActive);
        command.Parameters.AddWithValue("@updated_by", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new SaveUserResult(
                reader.GetInt32(reader.GetOrdinal("IsSuccess")) == 1,
                reader.GetRequiredString("Message")
            );
        }
        return new SaveUserResult(true, "Cập nhật tài khoản thành công.");
    }

    public async Task<AppRoleMatrixResponse> GetAppRoleMatrixAsync(
        string? roleCode,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_admin_get_role_matrix");
        command.Parameters.AddWithValue("@role_code", (object?)roleCode?.Trim() ?? DBNull.Value);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        
        // 1. Roles
        var roles = new List<AppRoleSummary>();
        while (await reader.ReadAsync(cancellationToken))
        {
            roles.Add(new AppRoleSummary(
                reader.GetRequiredString("RoleCode"),
                reader.GetRequiredString("RoleName"),
                reader.GetNullableString("Description"),
                reader.GetBoolean(reader.GetOrdinal("IsActive")),
                reader.GetInt32(reader.GetOrdinal("UserCount"))
            ));
        }

        // 2. Permissions
        var permissions = new List<AppPermissionItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                permissions.Add(new AppPermissionItem(
                    reader.GetRequiredString("PermissionCode"),
                    reader.GetRequiredString("ModuleGroup"),
                    reader.GetRequiredString("PermissionName"),
                    reader.GetNullableString("Description"),
                    reader.GetInt32(reader.GetOrdinal("DisplayOrder"))
                ));
            }
        }

        // 3. Matrix
        var matrix = new Dictionary<string, List<string>>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                var rCode = reader.GetRequiredString("RoleCode");
                var pCode = reader.GetRequiredString("PermissionCode");
                if (!matrix.ContainsKey(rCode))
                {
                    matrix[rCode] = new List<string>();
                }
                matrix[rCode].Add(pCode);
            }
        }

        return new AppRoleMatrixResponse(roles, permissions, matrix);
    }

    public async Task<SaveAppRolePermissionsResult> SaveAppRolePermissionsAsync(
        string userId,
        SaveAppRolePermissionsRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_admin_save_role_permissions");
        command.Parameters.AddWithValue("@role_code", request.RoleCode.Trim());
        command.Parameters.AddWithValue("@permission_codes", string.Join(",", request.PermissionCodes));
        command.Parameters.AddWithValue("@updated_by", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new SaveAppRolePermissionsResult(
                reader.GetInt32(reader.GetOrdinal("IsSuccess")) == 1,
                reader.GetRequiredString("Message")
            );
        }
        return new SaveAppRolePermissionsResult(true, "Cập nhật quyền vai trò thành công.");
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection)
    {
        CommandType = CommandType.StoredProcedure,
        CommandTimeout = options.Value.CommandTimeoutSeconds,
    };

    private static void AddUser(SqlCommand command, string userId) =>
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;

    private static object DbValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    private static object DbValue(DateTime? value) => value.HasValue ? value.Value : DBNull.Value;

    private static DataTable CreatePermissionTable(IReadOnlyList<PermissionInput> permissions)
    {
        var table = new DataTable();
        table.Columns.Add("ScreenCode", typeof(string));
        table.Columns.Add("ScreenLabel", typeof(string));
        table.Columns.Add("AccessMode", typeof(string));
        foreach (var permission in permissions)
        {
            table.Rows.Add(
                permission.ScreenCode,
                DbValue(permission.ScreenLabel),
                DbValue(permission.AccessMode));
        }
        return table;
    }
}

