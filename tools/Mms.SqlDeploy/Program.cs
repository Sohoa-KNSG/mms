using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

if (args.Length != 2)
{
    Console.Error.WriteLine("Usage: Mms.SqlDeploy <connection-env-name> <script-path>");
    return 2;
}

var connectionString = Environment.GetEnvironmentVariable(args[0]);
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine($"Missing environment variable: {args[0]}");
    return 2;
}

var scriptPath = Path.GetFullPath(args[1]);
await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();
Console.WriteLine($"Connected: {connection.DataSource}/{connection.Database}");

await ExecuteFileAsync(scriptPath, connection);
Console.WriteLine("Deployment completed.");
return 0;

static async Task ExecuteFileAsync(string path, SqlConnection connection)
{
    Console.WriteLine($"Script: {path}");
    var directory = Path.GetDirectoryName(path)!;
    var executableLines = new List<string>();
    foreach (var line in await File.ReadAllLinesAsync(path))
    {
        var trimmed = line.Trim();
        if (trimmed.StartsWith(":on error", StringComparison.OrdinalIgnoreCase))
            continue;
        if (trimmed.StartsWith(":r ", StringComparison.OrdinalIgnoreCase))
        {
            if (executableLines.Count > 0)
            {
                await ExecuteTextAsync(string.Join(Environment.NewLine, executableLines), connection);
                executableLines.Clear();
            }
            var include = trimmed[3..].Trim().Trim('"');
            await ExecuteFileAsync(Path.GetFullPath(Path.Combine(directory, include)), connection);
            continue;
        }
        executableLines.Add(line);
    }
    if (executableLines.Count > 0)
        await ExecuteTextAsync(string.Join(Environment.NewLine, executableLines), connection);
}

static async Task ExecuteTextAsync(string sql, SqlConnection connection)
{
    var batches = Regex.Split(sql, @"^\s*GO\s*(?:--.*)?$", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    foreach (var batch in batches.Where(static value => !string.IsNullOrWhiteSpace(value)))
    {
        await using var command = connection.CreateCommand();
        command.CommandTimeout = 120;
        command.CommandText = batch;
        await command.ExecuteNonQueryAsync();
    }
}
