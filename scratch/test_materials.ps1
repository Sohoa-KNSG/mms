$headers = @{
    Authorization = "Bearer dev-token-admin"
}
$mats = Invoke-RestMethod -Uri "http://localhost:5080/api/v1/inventory-operations/cycle-count-materials" -Headers $headers
Write-Host "Count materials from tbl_dm_vattu:" $mats.Length
$mats | Select-Object -First 5 | Format-Table MaterialId, BravoId, MaterialName, Unit, SystemQuantity
