$headers = @{
    Authorization = "Bearer dev-token-admin"
}

# 1. Test get app roles matrix
$roles = Invoke-RestMethod -Uri "http://localhost:5080/api/v1/administration/app-roles" -Headers $headers
Write-Host "=== App Roles Count ===" $roles.roles.Length
Write-Host "=== App Permissions Count ===" $roles.permissions.Length
Write-Host "=== Matrix keys ===" ($roles.matrix.psobject.properties.name -join ", ")

# 2. Test get users
$users = Invoke-RestMethod -Uri "http://localhost:5080/api/v1/administration/users" -Headers $headers
Write-Host "=== Total Users from tbl_dm_user ===" $users.Length
$users | Select-Object -First 5 | Format-Table UserId, FullName, RoleCode, RoleName, DepartmentName
