using Microsoft.Data.SqlClient;

namespace Mms.Api.Infrastructure.Sql;

public interface ISqlConnectionFactory
{
    Task<SqlConnection> OpenAsync(CancellationToken cancellationToken);
}

