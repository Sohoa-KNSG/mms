using System.Security.Claims;

namespace Mms.Api.Modules.Access;

public static class AccessEndpoints
{
    public static IEndpointRouteBuilder MapAccessEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1")
            .RequireAuthorization()
            .WithTags("Access");

        group.MapGet("/session", async (
            ClaimsPrincipal principal,
            AccessGateway gateway,
            CancellationToken cancellationToken) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.Identity?.Name;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Results.Unauthorized();
            }

            var session = await gateway.GetSessionAsync(userId, cancellationToken);
            return session is null
                ? Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Tài khoản MMS không hoạt động")
                : Results.Ok(session);
        })
        .WithName("AUTH-01_GetSession");

        group.MapGet("/navigation", async (
            ClaimsPrincipal principal,
            AccessGateway gateway,
            CancellationToken cancellationToken) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.Identity?.Name;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Results.Unauthorized();
            }

            return Results.Ok(await gateway.GetNavigationAsync(userId, cancellationToken));
        })
        .WithName("AUTH-02_GetNavigation");

        return endpoints;
    }
}

