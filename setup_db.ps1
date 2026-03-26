# Cluster DB setup script
# 1. Starts Docker containers (PostgreSQL, API, Client)
# 2. Waits for DB ready
# 3. Creates tables and seeds demo data

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=== Cluster: DB Setup ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/4] Starting Docker Compose..." -ForegroundColor Yellow
Set-Location $ProjectRoot
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "docker-compose failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Waiting for PostgreSQL (up to 60 sec)..." -ForegroundColor Yellow
$maxAttempts = 12
$attempt = 0
do {
    $attempt++
    docker exec cluster_db pg_isready -U cluster_user -d clusterdb 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  DB ready." -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "DB did not start in time." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Applying DB migrations (Alembic)..." -ForegroundColor Yellow
docker-compose exec server python -m alembic upgrade head

Write-Host ""
Write-Host "[4/5] Seeding demo data..." -ForegroundColor Yellow
docker exec cluster_api bash -c "cd /app && PYTHONPATH=/app python scripts/seed_demo_places.py"

Write-Host ""
Write-Host "[5/5] Initializing special offers..." -ForegroundColor Yellow
docker exec cluster_api bash -c "cd /app && PYTHONPATH=/app python scripts/init_special_offers.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Seed failed. Check: docker logs cluster_api" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  API:    http://localhost:8000" -ForegroundColor Gray
Write-Host "  Client: http://localhost:5173" -ForegroundColor Gray
Write-Host "  Docs:   http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
