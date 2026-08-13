using Microsoft.Data.SqlClient;

namespace Mms.Api.Infrastructure.Errors;

public sealed class SqlExceptionMiddleware(RequestDelegate next, ILogger<SqlExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (SqlException exception) when (TryMapStatus(exception.Number, out var status))
        {
            logger.LogWarning(
                exception,
                "SQL business result {SqlNumber}. TraceId={TraceId}",
                exception.Number,
                context.TraceIdentifier);

            await Results.Problem(
                statusCode: status,
                title: MapTitle(status),
                detail: exception.Message,
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = context.TraceIdentifier,
                    ["resultCode"] = MapResultCode(exception.Number),
                }).ExecuteAsync(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled API error. TraceId={TraceId}", context.TraceIdentifier);
            await Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Lỗi hệ thống",
                detail: "Không thể hoàn tất yêu cầu. Vui lòng cung cấp mã truy vết cho bộ phận hỗ trợ.",
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = context.TraceIdentifier,
                }).ExecuteAsync(context);
        }
    }

    private static bool TryMapStatus(int sqlNumber, out int status)
    {
        status = sqlNumber switch
        {
            51001 => StatusCodes.Status403Forbidden,
            51002 => StatusCodes.Status400BadRequest,
            51004 => StatusCodes.Status404NotFound,
            51009 => StatusCodes.Status409Conflict,
            51022 => StatusCodes.Status422UnprocessableEntity,
            _ => 0,
        };
        return status != 0;
    }

    private static string MapTitle(int status) => status switch
    {
        StatusCodes.Status400BadRequest => "Dữ liệu đầu vào không hợp lệ",
        StatusCodes.Status403Forbidden => "Không có quyền",
        StatusCodes.Status404NotFound => "Không tìm thấy dữ liệu",
        StatusCodes.Status409Conflict => "Xung đột dữ liệu",
        StatusCodes.Status422UnprocessableEntity => "Vi phạm quy tắc nghiệp vụ",
        _ => "Yêu cầu thất bại",
    };

    private static string MapResultCode(int sqlNumber) => sqlNumber switch
    {
        51001 => "MMS_FORBIDDEN",
        51002 => "MMS_INVALID_INPUT",
        51004 => "MMS_NOT_FOUND",
        51009 => "MMS_CONFLICT",
        51022 => "MMS_BUSINESS_RULE_VIOLATION",
        _ => "MMS_ERROR",
    };
}
