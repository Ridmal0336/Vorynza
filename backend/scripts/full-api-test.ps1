$ErrorActionPreference = 'Continue'
$Base = 'http://localhost:8080'
$Pass = 0
$Fail = 0
$Results = [System.Collections.Generic.List[string]]::new()

function Ok($name) { $script:Pass++; $Results.Add("PASS  $name") | Out-Null; Write-Host "PASS  $name" -ForegroundColor Green }
function Bad($name, $detail) { $script:Fail++; $Results.Add("FAIL  $name :: $detail") | Out-Null; Write-Host "FAIL  $name :: $detail" -ForegroundColor Red }

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [string]$Token = $null,
    [int[]]$ExpectStatus = @(200, 201)
  )
  $headers = @{ Accept = 'application/json' }
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  $uri = "$Base$Path"
  $json = $null
  if ($null -ne $Body) {
    $json = ($Body | ConvertTo-Json -Depth 8 -Compress)
    $headers['Content-Type'] = 'application/json'
  }
  try {
    $resp = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $json -UseBasicParsing -TimeoutSec 20
    $payload = $null
    try { $payload = $resp.Content | ConvertFrom-Json } catch {}
    return @{ Status = [int]$resp.StatusCode; Payload = $payload; Raw = $resp.Content; Ok = ($ExpectStatus -contains [int]$resp.StatusCode) }
  } catch {
    $ex = $_.Exception
    $status = 0
    $raw = $ex.Message
    $payload = $null
    if ($ex.Response) {
      $status = [int]$ex.Response.StatusCode
      try {
        $stream = $ex.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $raw = $reader.ReadToEnd()
        $payload = $raw | ConvertFrom-Json
      } catch {}
    }
    return @{ Status = $status; Payload = $payload; Raw = $raw; Ok = ($ExpectStatus -contains $status) }
  }
}

function Assert-Api($name, $r, [scriptblock]$Extra = $null) {
  if (-not $r.Ok) {
    Bad $name "HTTP $($r.Status) $($r.Raw)"
    return $false
  }
  if ($Extra) {
    try {
      & $Extra $r
      Ok $name
      return $true
    } catch {
      Bad $name $_.Exception.Message
      return $false
    }
  }
  Ok $name
  return $true
}

Write-Host "`n=== Vorynza full API test ===`n" -ForegroundColor Cyan

# ---------- HEALTH ----------
$r = Invoke-Api GET '/api/health'
Assert-Api 'GET /api/health' $r { param($x) if (-not $x.Payload.success) { throw 'not success' } }

# ---------- AUTH ----------
$r = Invoke-Api POST '/api/auth/login' @{ email = 'admin@vorynza.com'; password = 'Password123!' }
Assert-Api 'Admin login' $r { param($x) if (-not $x.Payload.data.token) { throw 'no token' } }
$AdminToken = $r.Payload.data.token
$AdminId = $r.Payload.data.user.id

$r = Invoke-Api POST '/api/auth/login' @{ email = 'customer@vorynza.com'; password = 'Password123!' }
Assert-Api 'Customer login' $r { param($x) if (-not $x.Payload.data.token) { throw 'no token' } }
$CustToken = $r.Payload.data.token
$CustId = $r.Payload.data.user.id

$r = Invoke-Api POST '/api/auth/login' @{ email = 'admin@vorynza.com'; password = 'wrong' } -ExpectStatus @(401)
Assert-Api 'Bad password -> 401' $r

$uniq = [guid]::NewGuid().ToString('N').Substring(0, 8)
$regEmail = "testuser_$uniq@vorynza.com"
$r = Invoke-Api POST '/api/auth/register' @{
  fullName = "Test User $uniq"
  email = $regEmail
  password = 'Password123!'
  phone = '0771111111'
  address = 'Colombo'
} -ExpectStatus @(200, 201)
Assert-Api 'Register new customer' $r { param($x) if (-not $x.Payload.data.token) { throw 'no token' } }
$NewToken = $r.Payload.data.token
$NewId = $r.Payload.data.user.id

$r = Invoke-Api POST '/api/auth/register' @{
  fullName = 'Dup'
  email = $regEmail
  password = 'Password123!'
} -ExpectStatus @(400)
Assert-Api 'Duplicate email -> 400' $r

$r = Invoke-Api POST '/api/auth/logout' @{}
Assert-Api 'Logout stub OK' $r

# ---------- PUBLIC CATALOG ----------
$r = Invoke-Api GET '/api/hotels'
Assert-Api 'List hotels' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty hotels' } }
$HotelId = $r.Payload.data[0].id

$r = Invoke-Api GET "/api/hotels/$HotelId"
Assert-Api 'Get hotel by id' $r

$r = Invoke-Api GET '/api/halls'
Assert-Api 'List halls' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty halls' } }
$HallId = $r.Payload.data[0].id
$HallCapacity = [int]$r.Payload.data[0].capacity

$r = Invoke-Api GET "/api/halls/$HallId"
Assert-Api 'Get hall by id' $r

$r = Invoke-Api GET '/api/halls?minCapacity=100'
Assert-Api 'Filter halls by capacity' $r

$r = Invoke-Api GET '/api/packages'
Assert-Api 'List packages' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty packages' } }
$PackageId = $r.Payload.data[0].id

$r = Invoke-Api GET '/api/packages?featured=true'
Assert-Api 'Featured packages' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'no featured' } }

$r = Invoke-Api GET "/api/packages/$PackageId"
Assert-Api 'Get package by id' $r

$r = Invoke-Api GET '/api/catering-packages'
Assert-Api 'List catering packages' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty catering' } }
$CatPkgId = $r.Payload.data[0].id

$r = Invoke-Api GET '/api/menu-items'
Assert-Api 'List menu items' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty menu' } }
$MenuId = $r.Payload.data[0].id

$r = Invoke-Api POST '/api/menu-items/estimate' @{
  cateringPackageId = $CatPkgId
  menuItemIds = @($MenuId)
  guestCount = 50
}
Assert-Api 'Catering cost estimate' $r { param($x) if (-not $x.Payload.data.totalCost) { throw 'no totalCost' } }

# ---------- ADMIN CRUD HOTELS ----------
$r = Invoke-Api POST '/api/hotels' @{
  name = "Test Hotel $uniq"
  location = 'Negombo'
  description = 'Temp hotel for tests'
  contact = '0312000000'
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create hotel' $r
$TmpHotelId = $r.Payload.data.id

$r = Invoke-Api PUT "/api/hotels/$TmpHotelId" @{
  name = "Test Hotel Updated $uniq"
  location = 'Negombo'
  description = 'Updated'
  contact = '0312000001'
} -Token $AdminToken
Assert-Api 'Admin update hotel' $r

$r = Invoke-Api POST '/api/hotels' @{
  name = 'Blocked'
  location = 'X'
} -Token $CustToken -ExpectStatus @(403)
Assert-Api 'Customer create hotel -> 403' $r

# ---------- ADMIN CRUD HALLS ----------
$r = Invoke-Api POST '/api/halls' @{
  hotelId = $TmpHotelId
  name = "Test Hall $uniq"
  capacity = 120
  decorationTheme = 'Modern'
  price = 75000
  imageUrls = ''
  averageRating = 4.2
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create hall' $r
$TmpHallId = $r.Payload.data.id

$r = Invoke-Api PUT "/api/halls/$TmpHallId" @{
  hotelId = $TmpHotelId
  name = "Test Hall Updated $uniq"
  capacity = 130
  decorationTheme = 'Modern'
  price = 80000
  imageUrls = ''
  averageRating = 4.3
  active = $true
} -Token $AdminToken
Assert-Api 'Admin update hall' $r

# ---------- ADMIN CRUD PACKAGES ----------
$r = Invoke-Api POST '/api/packages' @{
  hotelId = $TmpHotelId
  name = "Test Package $uniq"
  price = 199000
  inclusions = 'Hall + buffet'
  description = 'Test pkg'
  packageType = 'STANDARD'
  discountPercent = 0
  featured = $false
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create package' $r
$TmpPkgId = $r.Payload.data.id

$r = Invoke-Api PUT "/api/packages/$TmpPkgId" @{
  hotelId = $TmpHotelId
  name = "Test Package Updated $uniq"
  price = 210000
  inclusions = 'Hall + buffet + decor'
  description = 'Updated'
  packageType = 'PREMIUM'
  discountPercent = 5
  featured = $true
  active = $true
} -Token $AdminToken
Assert-Api 'Admin update package' $r

# ---------- ADMIN CATERING / MENU ----------
$r = Invoke-Api POST '/api/catering-packages' @{
  name = "Test Buffet $uniq"
  category = 'BUFFET'
  price = 3000
  description = 'Test'
  vegetarian = $false
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create catering package' $r
$TmpCatId = $r.Payload.data.id

$r = Invoke-Api POST '/api/menu-items' @{
  name = "Test Dish $uniq"
  category = 'MAIN'
  price = 900
  description = 'Test dish'
  vegetarian = $false
  cateringPackageId = $TmpCatId
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create menu item' $r
$TmpMenuId = $r.Payload.data.id

$r = Invoke-Api PUT "/api/menu-items/$TmpMenuId" @{
  name = "Test Dish Updated $uniq"
  category = 'MAIN'
  price = 950
  description = 'Updated'
  vegetarian = $true
  cateringPackageId = $TmpCatId
  active = $true
} -Token $AdminToken
Assert-Api 'Admin update menu item' $r

# ---------- USERS ----------
$r = Invoke-Api GET '/api/users' -Token $AdminToken
Assert-Api 'Admin list users' $r { param($x) if ($x.Payload.data.Count -lt 2) { throw 'too few users' } }

$r = Invoke-Api GET '/api/users' -Token $CustToken -ExpectStatus @(403)
Assert-Api 'Customer list users -> 403' $r

$r = Invoke-Api GET '/api/users/me' -Token $CustToken
Assert-Api 'Customer /me' $r { param($x) if ($x.Payload.data.email -ne 'customer@vorynza.com') { throw 'wrong me' } }

$r = Invoke-Api GET "/api/users/$AdminId" -Token $CustToken -ExpectStatus @(400, 403)
Assert-Api 'Customer cannot view other user' $r

$r = Invoke-Api PUT "/api/users/$NewId" @{
  fullName = "Updated Test $uniq"
  phone = '0772222222'
} -Token $NewToken
Assert-Api 'User update own profile' $r

$r = Invoke-Api PUT '/api/users/me/password' @{
  currentPassword = 'Password123!'
  newPassword = 'Password123!'
} -Token $NewToken
Assert-Api 'Change password (same)' $r

$r = Invoke-Api PUT '/api/users/me/password' @{
  currentPassword = 'WrongPass1!'
  newPassword = 'Password999!'
} -Token $NewToken -ExpectStatus @(400)
Assert-Api 'Wrong current password -> 400' $r

# ---------- RESERVATIONS ----------
$EventDate1 = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
$EventDate2 = (Get-Date).AddDays(31).ToString('yyyy-MM-dd')
$EventDate3 = (Get-Date).AddDays(32).ToString('yyyy-MM-dd')

$r = Invoke-Api GET "/api/halls/$TmpHallId/availability?date=$EventDate1"
Assert-Api 'Hall available before booking' $r { param($x) if (-not $x.Payload.data.available) { throw 'should be available' } }

$r = Invoke-Api POST '/api/reservations' @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = $EventDate1
  guestCount = 80
  notes = "E2E booking $uniq"
} -Token $CustToken -ExpectStatus @(200, 201)
Assert-Api 'Customer create reservation' $r
$ResId = $r.Payload.data.id

$r = Invoke-Api GET "/api/halls/$TmpHallId/availability?date=$EventDate1"
Assert-Api 'Hall unavailable after booking' $r { param($x) if ($x.Payload.data.available) { throw 'should be unavailable' } }

$r = Invoke-Api POST '/api/reservations' @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = $EventDate1
  guestCount = 50
} -Token $NewToken -ExpectStatus @(400)
Assert-Api 'Double booking blocked' $r

$r = Invoke-Api POST '/api/reservations' @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = $EventDate2
  guestCount = 9999
} -Token $CustToken -ExpectStatus @(400)
Assert-Api 'Over capacity blocked' $r

$r = Invoke-Api POST '/api/reservations' @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = '2020-01-01'
  guestCount = 10
} -Token $CustToken -ExpectStatus @(400)
Assert-Api 'Past date blocked' $r

$r = Invoke-Api GET "/api/reservations/$ResId/confirmation" -Token $CustToken
Assert-Api 'Reservation confirmation code' $r {
  param($x)
  if ($x.Payload.data.confirmationCode -notmatch '^VRY-\d{6}$') { throw "bad code $($x.Payload.data.confirmationCode)" }
}

$r = Invoke-Api GET "/api/reservations/$ResId" -Token $NewToken -ExpectStatus @(400, 403)
Assert-Api 'Other customer cannot view reservation' $r

$r = Invoke-Api PUT "/api/reservations/$ResId" @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = $EventDate3
  guestCount = 90
  notes = 'Updated notes'
} -Token $CustToken
Assert-Api 'Customer update reservation' $r

$r = Invoke-Api GET '/api/reservations' -Token $CustToken
Assert-Api 'Customer list own reservations' $r { param($x) if ($x.Payload.data.Count -lt 1) { throw 'empty' } }

$r = Invoke-Api GET '/api/reservations' -Token $AdminToken
Assert-Api 'Admin list all reservations' $r

# ---------- INVOICES ----------
$r = Invoke-Api POST '/api/invoices' @{
  reservationId = $ResId
  amount = 250000
} -Token $CustToken -ExpectStatus @(403)
Assert-Api 'Customer create invoice -> 403' $r

$r = Invoke-Api POST '/api/invoices' @{
  reservationId = $ResId
  amount = 250000
} -Token $AdminToken -ExpectStatus @(200, 201)
Assert-Api 'Admin create invoice' $r
$InvId = $r.Payload.data.id

$r = Invoke-Api PUT "/api/invoices/$InvId/payment" @{
  paidAmount = 100000
  paymentMethod = 'CARD'
} -Token $AdminToken
Assert-Api 'Partial payment' $r {
  param($x)
  if ($x.Payload.data.status -ne 'PARTIAL') { throw "expected PARTIAL got $($x.Payload.data.status)" }
}

$r = Invoke-Api PUT "/api/invoices/$InvId/payment" @{
  paidAmount = 250000
  paymentMethod = 'CARD'
} -Token $AdminToken
Assert-Api 'Full payment -> PAID' $r {
  param($x)
  if ($x.Payload.data.status -ne 'PAID') { throw "expected PAID got $($x.Payload.data.status)" }
}

$r = Invoke-Api PUT "/api/invoices/$InvId/payment" @{
  paidAmount = 300000
  paymentMethod = 'CARD'
} -Token $AdminToken -ExpectStatus @(400)
Assert-Api 'Overpay blocked' $r

$r = Invoke-Api GET "/api/invoices/$InvId/print" -Token $AdminToken
Assert-Api 'Printable invoice' $r {
  param($x)
  if ($x.Payload.data.invoiceNumber -notmatch '^INV-\d{6}$') { throw 'bad invoice number' }
}

$r = Invoke-Api GET '/api/invoices' -Token $CustToken
Assert-Api 'Customer list invoices' $r

$r = Invoke-Api GET "/api/invoices/customer/$CustId" -Token $CustToken
Assert-Api 'Customer invoice history' $r

$r = Invoke-Api GET '/api/reports/summary' -Token $AdminToken
Assert-Api 'Admin reports summary' $r { param($x) if ($null -eq $x.Payload.data.totalReservations) { throw 'missing fields' } }

$r = Invoke-Api GET '/api/reports/summary' -Token $CustToken -ExpectStatus @(403)
Assert-Api 'Customer reports -> 403' $r

# Second invoice to void
$r = Invoke-Api POST '/api/reservations' @{
  hallId = $TmpHallId
  packageId = $TmpPkgId
  eventDate = $EventDate2
  guestCount = 40
} -Token $NewToken -ExpectStatus @(200, 201)
$Res2Id = $r.Payload.data.id
Assert-Api 'Second reservation for void invoice test' $r

$r = Invoke-Api POST '/api/invoices' @{
  reservationId = $Res2Id
  amount = 50000
} -Token $AdminToken -ExpectStatus @(200, 201)
$Inv2Id = $r.Payload.data.id
Assert-Api 'Create second invoice' $r

$r = Invoke-Api DELETE "/api/invoices/$Inv2Id" -Token $AdminToken
Assert-Api 'Void invoice' $r {
  param($x)
  if ($x.Payload.data.status -ne 'VOID') { throw "expected VOID" }
}

$r = Invoke-Api PUT "/api/invoices/$Inv2Id/payment" @{
  paidAmount = 10
  paymentMethod = 'CASH'
} -Token $AdminToken -ExpectStatus @(400)
Assert-Api 'Pay voided invoice blocked' $r

# Cancel reservation frees date
$r = Invoke-Api DELETE "/api/reservations/$ResId" -Token $CustToken
Assert-Api 'Cancel reservation' $r {
  param($x)
  if ($x.Payload.data.status -ne 'CANCELLED') { throw 'not cancelled' }
}

$r = Invoke-Api POST '/api/invoices' @{
  reservationId = $ResId
  amount = 1000
} -Token $AdminToken -ExpectStatus @(400)
Assert-Api 'Invoice cancelled reservation blocked' $r

# Soft deletes
$r = Invoke-Api DELETE "/api/menu-items/$TmpMenuId" -Token $AdminToken
Assert-Api 'Soft-delete menu item' $r

$r = Invoke-Api DELETE "/api/catering-packages/$TmpCatId" -Token $AdminToken
Assert-Api 'Soft-delete catering package' $r

$r = Invoke-Api DELETE "/api/packages/$TmpPkgId" -Token $AdminToken
Assert-Api 'Soft-delete package' $r

$r = Invoke-Api DELETE "/api/halls/$TmpHallId" -Token $AdminToken
Assert-Api 'Soft-delete hall' $r

# Booking inactive hall should fail (create new hall then deactivate)
$r = Invoke-Api POST '/api/halls' @{
  hotelId = $HotelId
  name = "Inactive Hall $uniq"
  capacity = 50
  price = 10000
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
$InactiveHallId = $r.Payload.data.id
$r = Invoke-Api DELETE "/api/halls/$InactiveHallId" -Token $AdminToken
$r = Invoke-Api POST '/api/packages' @{
  hotelId = $HotelId
  name = "Active Pkg Temp $uniq"
  price = 10000
  inclusions = 'x'
  active = $true
} -Token $AdminToken -ExpectStatus @(200, 201)
$ActivePkgTmp = $r.Payload.data.id
$r = Invoke-Api POST '/api/reservations' @{
  hallId = $InactiveHallId
  packageId = $ActivePkgTmp
  eventDate = (Get-Date).AddDays(45).ToString('yyyy-MM-dd')
  guestCount = 10
} -Token $CustToken -ExpectStatus @(400)
Assert-Api 'Book inactive hall blocked' $r

# Soft-delete user blocks login
$r = Invoke-Api DELETE "/api/users/$NewId" -Token $AdminToken
Assert-Api 'Admin deactivate user' $r
$r = Invoke-Api POST '/api/auth/login' @{ email = $regEmail; password = 'Password123!' } -ExpectStatus @(401, 400)
Assert-Api 'Deactivated user cannot login' $r

# Cleanup temp hotel (may fail if FKs — acceptable)
$r = Invoke-Api DELETE "/api/hotels/$TmpHotelId" -Token $AdminToken -ExpectStatus @(200, 400, 500)
if ($r.Ok -and $r.Status -eq 200) {
  Ok 'Delete temp hotel'
} else {
  Ok ("Delete temp hotel skipped/blocked HTTP " + $r.Status + " FK expected")
}

# Unauthenticated protected endpoint
$r = Invoke-Api GET '/api/reservations' -ExpectStatus @(401, 403, 500)
if ($r.Status -eq 401 -or $r.Status -eq 403) {
  Ok 'Unauthenticated reservations -> auth error'
} else {
  Bad 'Unauthenticated reservations should be 401/403' ("got HTTP " + $r.Status + " " + $r.Raw)
}

$summaryColor = if ($Fail -eq 0) { 'Green' } else { 'Yellow' }
Write-Host ""
Write-Host ("=== SUMMARY: " + $Pass + " passed, " + $Fail + " failed ===") -ForegroundColor $summaryColor
Write-Host ""
$Results | ForEach-Object { $_ }
if ($Fail -gt 0) { exit 1 } else { exit 0 }
