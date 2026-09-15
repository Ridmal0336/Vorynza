# Refresh SQLEXPRESS TCP port into application.properties (run if app cannot connect after SQL restart)
$props = "D:\SLIIT\projectr\Ithin_web\backend\src\main\resources\application.properties"
$proc = Get-Process sqlservr -ErrorAction SilentlyContinue
if (-not $proc) {
  Write-Host "sqlservr is not running. Start 'SQL Server (SQLEXPRESS)' in services.msc" -ForegroundColor Red
  exit 1
}
$port = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -in $proc.Id } |
  Select-Object -ExpandProperty LocalPort -Unique |
  Select-Object -First 1
if (-not $port) {
  Write-Host "Could not detect SQLEXPRESS listen port." -ForegroundColor Red
  exit 1
}
Write-Host "Detected SQLEXPRESS port: $port" -ForegroundColor Green
$content = Get-Content $props -Raw
$content = [regex]::Replace($content, 'jdbc:sqlserver://localhost:\d+', "jdbc:sqlserver://localhost:$port")
Set-Content -Path $props -Value $content -NoNewline
Write-Host "Updated application.properties datasource URL to localhost:$port"
Write-Host "Restart VorynzaApplication in IntelliJ."
