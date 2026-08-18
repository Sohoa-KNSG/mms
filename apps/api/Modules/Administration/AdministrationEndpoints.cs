using System.Security.Claims;

namespace Mms.Api.Modules.Administration;

public static class AdministrationEndpoints
{
    public static IEndpointRouteBuilder MapAdministrationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/administration")
            .RequireAuthorization()
            .WithTags("Administration");

        // UC-28: Quản trị ma trận phân quyền vai trò (App Role Matrix)
        group.MapGet("/app-roles", async (
            AdministrationGateway gateway,
            string? roleCode,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetAppRoleMatrixAsync(Normalize(roleCode), cancellationToken)))
            .WithName("ADM-01_GetAppRoleMatrix");

        group.MapPut("/app-roles/{roleCode}", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string roleCode,
            SaveAppRolePermissionsRequest request,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.SaveAppRolePermissionsAsync(
                GetUserId(principal), request with { RoleCode = roleCode }, cancellationToken)))
            .WithName("ADM-01_SaveAppRolePermissions");

        // UC-28: Quản trị danh sách người dùng & gán vai trò
        group.MapGet("/users", async (
            AdministrationGateway gateway,
            string? search,
            string? roleCode,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetUsersAsync(Normalize(search), Normalize(roleCode), cancellationToken)))
            .WithName("ADM-01_GetUsers");

        group.MapPost("/users", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            SaveUserRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.RoleCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["user"] = ["Mã tài khoản, họ tên và vai trò không được để trống."],
                });
            }
            return Results.Ok(await gateway.SaveUserAsync(GetUserId(principal), request, cancellationToken));
        }).WithName("ADM-01_CreateUser");

        group.MapPut("/users/{userId}", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string userId,
            SaveUserRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.RoleCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["user"] = ["Họ tên và vai trò không được để trống."],
                });
            }
            return Results.Ok(await gateway.SaveUserAsync(GetUserId(principal), request with { UserId = userId }, cancellationToken));
        }).WithName("ADM-01_UpdateUser");

        group.MapGet("/roles", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string? roleCode,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetRoleMatrixAsync(
                GetUserId(principal), Normalize(roleCode), cancellationToken)))
            .WithName("ADM-01_GetRoleMatrix");

        group.MapPut("/roles/{roleCode}", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string roleCode,
            SaveRoleRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(roleCode) || roleCode.Length > 50
                || string.IsNullOrWhiteSpace(request.RoleName) || request.RoleName.Length > 50
                || request.Permissions.Count > 500)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["role"] = ["Mã/tên vai trò không hợp lệ hoặc danh sách quyền vượt quá 500 màn hình."],
                });
            }

            if (request.Permissions.Any(permission =>
                string.IsNullOrWhiteSpace(permission.ScreenCode) || permission.ScreenCode.Length > 50))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["permissions"] = ["Mỗi quyền phải có mã màn hình hợp lệ."],
                });
            }

            return Results.Ok(await gateway.SaveRoleAsync(
                GetUserId(principal), roleCode.Trim(), request, cancellationToken));
        }).WithName("ADM-01_SaveRolePermissions");

        group.MapGet("/catalogs/{catalogCode}", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string catalogCode,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetCatalogAsync(
                GetUserId(principal), catalogCode, cancellationToken)))
            .WithName("ADM-02_GetConfigurationCatalog");

        group.MapPut("/catalogs/{catalogCode}/{keyCode}", async (
            ClaimsPrincipal principal,
            AdministrationGateway gateway,
            string catalogCode,
            string keyCode,
            SaveConfigurationRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(catalogCode) || catalogCode.Length > 40
                || string.IsNullOrWhiteSpace(keyCode) || keyCode.Length > 50
                || string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["catalog"] = ["Mã danh mục, mã bản ghi hoặc tên không hợp lệ."],
                });
            }

            return Results.Ok(await gateway.SaveCatalogItemAsync(
                GetUserId(principal), catalogCode.Trim(), keyCode.Trim(), request, cancellationToken));
        }).WithName("ADM-02_SaveConfiguration");

        return endpoints;
    }

    private static string GetUserId(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name
        ?? throw new UnauthorizedAccessException("Không có user identity.");

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

