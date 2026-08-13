namespace Mms.Api.Modules.Administration;

public sealed record RoleSummary(string RoleCode, string? RoleName, DateTime? ChangedAt);
public sealed record ScreenPermission(
    string ScreenCode,
    string? ScreenLabel,
    string? AccessMode,
    bool IsGranted);
public sealed record RoleMatrix(
    IReadOnlyList<RoleSummary> Roles,
    IReadOnlyList<ScreenPermission> Screens);

public sealed record PermissionInput(string ScreenCode, string? ScreenLabel, string? AccessMode);
public sealed record SaveRoleRequest(
    string RoleName,
    DateTime? ExpectedChangedAt,
    IReadOnlyList<PermissionInput> Permissions);
public sealed record SaveRoleResult(
    string RoleCode,
    string RoleName,
    DateTime ChangedAt,
    int PermissionCount);

public sealed record ConfigurationItem(
    string KeyCode,
    string? Name,
    string? Description,
    string? LogicValue,
    string? DisplayValue,
    DateTime? ChangedAt);
public sealed record SaveConfigurationRequest(
    string Name,
    string? Description,
    string? LogicValue,
    string? DisplayValue,
    DateTime? ExpectedChangedAt);
public sealed record SaveConfigurationResult(
    string CatalogCode,
    string KeyCode,
    string Name,
    string? Description,
    string? LogicValue,
    string? DisplayValue,
    DateTime ChangedAt);

