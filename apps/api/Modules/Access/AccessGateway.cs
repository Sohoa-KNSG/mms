using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Access;

public sealed class AccessGateway(
    ISqlConnectionFactory connectionFactory,
    IOptions<SqlOptions> options)
{
    public async Task<UserSession?> GetSessionAsync(string userId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_SEC_AUTH01_GetUserContext_v1");
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new UserSession(
            reader.GetRequiredString("UserId"),
            reader.GetRequiredString("DisplayName"),
            reader.GetRequiredString("RoleCode"),
            reader.GetNullableString("RoleName"),
            reader.GetNullableString("DepartmentCode"),
            reader.GetNullableString("BravoDepartmentCode"),
            reader.GetNullableString("BravoDepartmentName"));
    }

    public async Task<IReadOnlyList<NavigationItem>> GetNavigationAsync(string userId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_SEC_AUTH02_GetNavigation_v1");
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<NavigationItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new NavigationItem(
                reader.GetRequiredString("ScreenCode"),
                reader.GetRequiredString("Label"),
                reader.GetNullableString("AccessMode")));
        }

        return result;
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure)
    {
        return new SqlCommand(procedure, connection)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = options.Value.CommandTimeoutSeconds,
        };
    }
}

