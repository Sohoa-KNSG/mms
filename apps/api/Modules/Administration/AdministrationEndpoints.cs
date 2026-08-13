using System.Security.Claims;

namespace Mms.Api.Modules.Administration;

public static class AdministrationEndpoints
{
    public static IEndpointRouteBuilder MapAdministrationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/administration")
            .RequireAuthorization()
            .WithTags("Administration");

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

