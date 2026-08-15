namespace Mms.Api.Modules.Access;

public sealed record UserSession(
    string UserId,
    string DisplayName,
    string RoleCode,
    string? RoleName,
    string? DepartmentCode,
    string? BravoDepartmentCode,
    string? BravoDepartmentName);

public sealed record NavigationItem(string ScreenCode, string Label, string? AccessMode);
public sealed record LoginRequest(string UserName, string Password);
