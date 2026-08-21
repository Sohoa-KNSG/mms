using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Mms.Api.Modules.Access;

public static class AccessEndpoints
{
    public static IEndpointRouteBuilder MapAccessEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1")
            .RequireAuthorization()
            .WithTags("Access");

        group.MapPost("/auth/login", async (LoginRequest request, HttpContext context, AccessGateway gateway, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrEmpty(request.Password) || request.UserName.Length > 50 || request.Password.Length > 255)
                return Results.Problem(statusCode: 401, title: "Đăng nhập không thành công", detail: "Tên đăng nhập hoặc mật khẩu không đúng.");
            var session = await gateway.AuthenticateLegacyAsync(request.UserName.Trim(), request.Password, cancellationToken);
            if (session is null)
                return Results.Problem(statusCode: 401, title: "Đăng nhập không thành công", detail: "Tên đăng nhập hoặc mật khẩu không đúng.");
            var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, session.UserId), new Claim(ClaimTypes.Name, session.DisplayName), new Claim(ClaimTypes.Role, session.RoleCode) }, CookieAuthenticationDefaults.AuthenticationScheme);
            await context.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30),
                    AllowRefresh = true
                });
            return Results.Ok(session);
        }).AllowAnonymous().WithName("AUTH-01_Login");

        group.MapPost("/auth/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        }).WithName("AUTH-01_Logout");

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
