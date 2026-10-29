param(
    [Parameter(Mandatory)] [string] $RepoRoot,
    [Parameter(Mandatory)] [string] $BuildDir,
    [Parameter(Mandatory)] [string] $SiteRoot,
    [string] $ServiceName = 'PT-Api',
    [int] $ApiPort = 3001
)

$ErrorActionPreference = 'Stop'

function Get-ApiService { Get-Service -DisplayName $ServiceName -ErrorAction SilentlyContinue }

function Stop-ApiProcesses {
    # Also stops the hand-started node process left over from before this was a service.
    Get-NetTCPConnection -LocalPort $ApiPort -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Stopping process $($_.OwningProcess) listening on :$ApiPort"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

$backendSrc = Join-Path $RepoRoot 'backend'
$backendDest = Join-Path $SiteRoot 'backend'
$buildDest = Join-Path $SiteRoot 'frontend\build'

if (-not (Test-Path (Join-Path $BuildDir 'index.html'))) { throw "Frontend build not found in $BuildDir" }

$svc = Get-ApiService
if ($svc -and $svc.Status -ne 'Stopped') {
    Write-Host "Stopping service $ServiceName..."
    Stop-Service -Name $svc.Name -Force
    $svc.WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
}
Stop-ApiProcesses

# Backend source. Never touch the server-only .env, user uploads (public\uploads), installed modules or the service wrapper.
robocopy $backendSrc $backendDest /E /NFL /NDL /NJH /NJS /NP /XD node_modules (Join-Path $backendSrc 'public\uploads') (Join-Path $backendDest 'public\uploads') daemon coverage tests /XF .env
if ($LASTEXITCODE -ge 8) { throw "robocopy failed copying backend (exit code $LASTEXITCODE)" }
New-Item -ItemType Directory -Force (Join-Path $backendDest 'public\uploads') | Out-Null

Push-Location $backendDest
try {
    npm install --omit=dev --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed in backend" }
} finally { Pop-Location }

# Frontend: keep the previous build for rollback and mirror the new one.
$prev = Join-Path $SiteRoot 'frontend\build.prev'
if (Test-Path $buildDest) {
    if (Test-Path $prev) { Remove-Item -Recurse -Force $prev }
    Copy-Item -Recurse $buildDest $prev
}
robocopy $BuildDir $buildDest /MIR /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) { throw "robocopy failed copying frontend build (exit code $LASTEXITCODE)" }

# CMS images (blog-images, homepage) are uploaded at runtime into the served images folder and are not in git;
# carry them over from the live public folder and from the previous build so they are never lost.
$imageSources = @((Join-Path $SiteRoot 'frontend\public\images'), (Join-Path $prev 'images'))
foreach ($src in $imageSources) {
    if (Test-Path $src) {
        robocopy $src (Join-Path $buildDest 'images') /E /XO /NFL /NDL /NJH /NJS /NP
        if ($LASTEXITCODE -ge 8) { throw "robocopy failed restoring images from $src (exit code $LASTEXITCODE)" }
    }
}

$svc = Get-ApiService
if (-not $svc) {
    Write-Host "Service $ServiceName does not exist - installing (first deploy)."
    Push-Location $backendDest
    try {
        node scripts\win-service.js install --name $ServiceName --port $ApiPort
        if ($LASTEXITCODE -ne 0) { throw "Service install failed" }
    } finally { Pop-Location }
    Start-Sleep -Seconds 5
    $svc = Get-ApiService
    if (-not $svc) { throw "Service $ServiceName was not created" }
}
if ($svc.Status -ne 'Running') {
    Write-Host "Starting service $ServiceName..."
    Start-Service -Name $svc.Name
}
$svc.WaitForStatus('Running', [TimeSpan]::FromSeconds(60))

$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$ApiPort/api/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $ok) { throw "API did not become healthy on port $ApiPort after starting $ServiceName" }
Write-Host "Deploy complete: API healthy on :$ApiPort, frontend build in $buildDest"

# robocopy leaves exit codes 0-7 (success) in $LASTEXITCODE; don't let that fail the step.
$global:LASTEXITCODE = 0
