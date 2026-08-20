using Microsoft.Data.SqlClient;

namespace Mms.Api.Infrastructure.Sql;

public static class SqlReaderExtensions
{
    public static string GetRequiredString(this SqlDataReader reader, string name) =>
        reader.GetString(reader.GetOrdinal(name));

    public static string? GetNullableString(this SqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    public static int GetRequiredInt32(this SqlDataReader reader, string name) =>
        reader.GetInt32(reader.GetOrdinal(name));

    public static int? GetNullableInt32(this SqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetInt32(ordinal);
    }

    public static long GetRequiredInt64(this SqlDataReader reader, string name) =>
        reader.GetInt64(reader.GetOrdinal(name));

    public static decimal GetRequiredDecimal(this SqlDataReader reader, string name) =>
        reader.GetDecimal(reader.GetOrdinal(name));

    public static decimal? GetNullableDecimal(this SqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetDecimal(ordinal);
    }

    public static DateTime? GetNullableDateTime(this SqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    public static int GetInt32OrDefault(this SqlDataReader reader, string name, int defaultValue = 0)
    {
        try
        {
            var ordinal = reader.GetOrdinal(name);
            return reader.IsDBNull(ordinal) ? defaultValue : Convert.ToInt32(reader.GetValue(ordinal));
        }
        catch
        {
            return defaultValue;
        }
    }

    public static decimal GetDecimalOrDefault(this SqlDataReader reader, string name, decimal defaultValue = 0)
    {
        try
        {
            var ordinal = reader.GetOrdinal(name);
            return reader.IsDBNull(ordinal) ? defaultValue : Convert.ToDecimal(reader.GetValue(ordinal));
        }
        catch
        {
            return defaultValue;
        }
    }
}

