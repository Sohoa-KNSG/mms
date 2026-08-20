using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Mms.Api.Infrastructure.Json;

public static class VietnamTimeHelper
{
    public static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();
    public static readonly TimeSpan UtcOffset = TimeSpan.FromHours(7);

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }
            catch
            {
                return TimeZoneInfo.CreateCustomTimeZone("UTC+7", TimeSpan.FromHours(7), "UTC+07:00 (Vietnam)", "UTC+07:00 (Vietnam)");
            }
        }
    }

    public static DateTime ToVietnamTime(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Utc)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(dt, VietnamTimeZone);
        }
        return dt;
    }

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
}

public sealed class Utc7DateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var stringValue = reader.GetString();
        if (string.IsNullOrWhiteSpace(stringValue))
        {
            return default;
        }

        if (DateTimeOffset.TryParse(stringValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dto))
        {
            return TimeZoneInfo.ConvertTime(dto, VietnamTimeHelper.VietnamTimeZone).DateTime;
        }

        if (DateTime.TryParse(stringValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            return dt;
        }

        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var vnTime = VietnamTimeHelper.ToVietnamTime(value);
        var isoWithOffset = vnTime.ToString("yyyy-MM-ddTHH:mm:ss.fff", CultureInfo.InvariantCulture) + "+07:00";
        writer.WriteStringValue(isoWithOffset);
    }
}

public sealed class Utc7NullableDateTimeJsonConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var stringValue = reader.GetString();
        if (string.IsNullOrWhiteSpace(stringValue))
        {
            return null;
        }

        if (DateTimeOffset.TryParse(stringValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dto))
        {
            return TimeZoneInfo.ConvertTime(dto, VietnamTimeHelper.VietnamTimeZone).DateTime;
        }

        if (DateTime.TryParse(stringValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            return dt;
        }

        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        var vnTime = VietnamTimeHelper.ToVietnamTime(value.Value);
        var isoWithOffset = vnTime.ToString("yyyy-MM-ddTHH:mm:ss.fff", CultureInfo.InvariantCulture) + "+07:00";
        writer.WriteStringValue(isoWithOffset);
    }
}
