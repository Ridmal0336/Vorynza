# Run this in PowerShell to diagnose SQL Server (does not need admin for most checks)

Write-Host "=== SQL-related Windows services ===" -ForegroundColor Cyan
Get-Service -Name "*SQL*" -ErrorAction SilentlyContinue |
  Select-Object Status, Name, DisplayName |
  Format-Table -AutoSize

Write-Host "`n=== Installed SQL instances (registry) ===" -ForegroundColor Cyan
$reg = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL"
if (Test-Path $reg) {
  Get-ItemProperty $reg | Format-List
} else {
  Write-Host "No SQL Server instances found in registry. SQL Server may not be installed." -ForegroundColor Yellow
}

Write-Host "`n=== Is port 1433 open? ===" -ForegroundColor Cyan
$tnc = Test-NetConnection -ComputerName localhost -Port 1433 -WarningAction SilentlyContinue
if ($tnc.TcpTestSucceeded) {
  Write-Host "YES — something is listening on 1433" -ForegroundColor Green
} else {
  Write-Host "NO — nothing on 1433 (Connection refused). Enable TCP/IP or use named instance URL." -ForegroundColor Red
}

Write-Host "`n=== What to do next ===" -ForegroundColor Cyan
Write-Host "1) If a SQL Server service is Stopped: Start it (services.msc)."
Write-Host "2) If only SQLEXPRESS exists: use localhost\\SQLEXPRESS in application.properties."
Write-Host "3) If LocalDB only: use (localdb)\\MSSQLLocalDB in application.properties."
Write-Host "4) Enable TCP/IP in SQL Server Configuration Manager, then restart the service."
Write-Host "5) Create DB VorynzaDB with database/01_create_database.sql in SSMS."
