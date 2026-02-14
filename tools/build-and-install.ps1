# Build OpenClaw from this repository and install to this Windows machine.
# Run from the repository root: .\tools\build-and-install.ps1

$ErrorActionPreference = "Stop"

# Detect repo root from script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path "$ScriptDir\..").Path
$InstallDir = "$env:USERPROFILE\.local\bin"

# Repo path is hardcoded for Windows (adjust if repo is in a different location)
$RepoPathForWrapper = $RepoRoot

Write-Host "==> Building OpenClaw..."
Set-Location $RepoRoot

# On Windows, skip a2ui bundle (requires bash). Build steps:
# 1. tsdown (main bundler)
# 2. build:plugin-sdk:dts (TypeScript definitions)
# 3. write-plugin-sdk-entry-dts.ts
# 4. canvas-a2ui-copy.ts
# 5. copy-hook-metadata.ts
# 6. write-build-info.ts
# 7. write-cli-compat.ts
pnpm exec tsdown
pnpm build:plugin-sdk:dts
node --import tsx scripts/write-plugin-sdk-entry-dts.ts
node --import tsx scripts/canvas-a2ui-copy.ts
node --import tsx scripts/copy-hook-metadata.ts
node --import tsx scripts/write-build-info.ts
node --import tsx scripts/write-cli-compat.ts

Write-Host "==> Cleaning up existing installation..."
if (Test-Path "$InstallDir\openclaw") { Remove-Item "$InstallDir\openclaw" -Force }
if (Test-Path "$InstallDir\openclaw.cmd") { Remove-Item "$InstallDir\openclaw.cmd" -Force }
if (Test-Path "$InstallDir\openclaw.ps1") { Remove-Item "$InstallDir\openclaw.ps1" -Force }
if (Test-Path "$InstallDir\openclaw-dist") { Remove-Item "$InstallDir\openclaw-dist" -Recurse -Force }

Write-Host "==> Installing to $InstallDir..."
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# Copy dist folder (renamed to openclaw-dist)
Copy-Item -Path "dist" -Destination "$InstallDir\openclaw-dist" -Recurse

# Create wrapper script that:
# 1. Changes to repo root (where node_modules lives)
# 2. Runs openclaw.mjs from there
$wrapperContent = @"
@echo off
cd /d "$RepoPathForWrapper"
node "$RepoPathForWrapper\openclaw.mjs" %*
"@

Set-Content -Path "$InstallDir\openclaw.cmd" -Value $wrapperContent -NoNewline

# Warn about PATH
$pathEntry = "$InstallDir"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$pathEntry*") {
    Write-Host "Warning: $InstallDir is not in your PATH. Add to PowerShell profile:" -ForegroundColor Yellow
    Write-Host '  [Environment]::SetEnvironmentVariable("Path", "$env:Path;' + "$pathEntry" + '", "User")' -ForegroundColor Yellow
    Write-Host "Or add to your PATH manually, then restart your terminal." -ForegroundColor Yellow
}

Write-Host "==> Verifying installation..."
& "$InstallDir\openclaw.cmd" --version

Write-Host "Done."
