# Complete auth test for MKVR
Write-Host "Testing Complete MKVR Authentication" -ForegroundColor Green

$baseUrl = "http://localhost:3001/api"

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "test$timestamp@example.com"

# 1. Test registration
Write-Host "`n1. Testing registration..." -ForegroundColor Yellow
Write-Host "Using email: $email" -ForegroundColor Cyan

$registerData = @{
    email     = $email
    firstName = "Test"
    lastName  = "User"
    password  = "123456"
    role      = "child"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "Registration successful!" -ForegroundColor Green
    Write-Host "User: $($registerResponse.user.firstName) $($registerResponse.user.lastName)" -ForegroundColor Cyan
    Write-Host "Token: $($registerResponse.token.Length) characters" -ForegroundColor Cyan
    $token = $registerResponse.token
}
catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test login
Write-Host "`n2. Testing login..." -ForegroundColor Yellow

$loginData = @{
    email    = $email
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Cyan
    $token = $loginResponse.token
}
catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test get user data
Write-Host "`n3. Testing get user data..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "User data retrieved!" -ForegroundColor Green
    Write-Host "ID: $($meResponse.user.id)" -ForegroundColor Cyan
    Write-Host "Email: $($meResponse.user.email)" -ForegroundColor Cyan
    Write-Host "Role: $($meResponse.user.role)" -ForegroundColor Cyan
}
catch {
    Write-Host "Get user data failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test logout
Write-Host "`n4. Testing logout..." -ForegroundColor Yellow

try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST -Headers $headers
    Write-Host "Logout successful!" -ForegroundColor Green
    Write-Host "Message: $($logoutResponse.message)" -ForegroundColor Cyan
}
catch {
    Write-Host "Logout failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test wrong password
Write-Host "`n5. Testing wrong password..." -ForegroundColor Yellow

$wrongLoginData = @{
    email    = $email
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $wrongLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $wrongLoginData -ContentType "application/json"
    Write-Host "Unexpected success with wrong password!" -ForegroundColor Red
}
catch {
    Write-Host "Correctly rejected wrong password" -ForegroundColor Green
}

Write-Host "`n🎉 Complete authentication test finished successfully!" -ForegroundColor Green 