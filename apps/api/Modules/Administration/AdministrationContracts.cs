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

public sealed record UserItem(
    string UserId,
    string FullName,
    int? EmployeeCode,
    string? Password,
    string RoleCode,
    string RoleName,
    string? JobTitle,
    string? DepartmentCode,
    string? BravoDepartmentCode,
    string? DepartmentName,
    int IsActive);

public sealed record SaveUserRequest(
    string UserId,
    string FullName,
    string? Password,
    string RoleCode,
    string? JobTitle,
    string? DepartmentName,
    int IsActive);

public sealed record SaveUserResult(
    bool IsSuccess,
    string Message);

public sealed record AppRoleSummary(
    string RoleCode,
    string RoleName,
    string? Description,
    bool IsActive,
    int UserCount);

public sealed record AppPermissionItem(
    string PermissionCode,
    string ModuleGroup,
    string PermissionName,
    string? Description,
    int DisplayOrder);

public sealed record AppRoleMatrixResponse(
    IReadOnlyList<AppRoleSummary> Roles,
    IReadOnlyList<AppPermissionItem> Permissions,
    IReadOnlyDictionary<string, List<string>> Matrix);

public sealed record SaveAppRolePermissionsRequest(
    string RoleCode,
    IReadOnlyList<string> PermissionCodes);

public sealed record SaveAppRolePermissionsResult(
    bool IsSuccess,
    string Message);


