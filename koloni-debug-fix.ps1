# Koloni Debug Fix Script
# This script resolves common development issues with the Koloni project

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Koloni Development Environment Fix Tool    " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any process using port 3001 (MCP server)
Write-Host "[1/6] Checking for processes on port 3001..." -ForegroundColor Yellow
try {
    $port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($port3001) {
        $processId = $port3001.OwningProcess
        Write-Host "  Found process $processId using port 3001. Terminating..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Host "  Process terminated successfully." -ForegroundColor Green
    } else {
        Write-Host "  No process found on port 3001." -ForegroundColor Green
    }
} catch {
    Write-Host "  No process found on port 3001 or unable to check." -ForegroundColor Green
}

# Step 2: Remove node_modules directory
Write-Host ""
Write-Host "[2/6] Removing node_modules directory..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  node_modules removed successfully." -ForegroundColor Green
} else {
    Write-Host "  node_modules directory not found." -ForegroundColor Green
}

# Step 3: Remove package-lock.json
Write-Host ""
Write-Host "[3/6] Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
    Write-Host "  package-lock.json removed successfully." -ForegroundColor Green
} else {
    Write-Host "  package-lock.json not found." -ForegroundColor Green
}

# Step 4: Clean npm cache
Write-Host ""
Write-Host "[4/6] Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "  npm cache cleaned successfully." -ForegroundColor Green
} else {
    Write-Host "  Warning: npm cache clean encountered an issue." -ForegroundColor Red
}

# Step 5: Optional - Downgrade npm (uncomment if needed)
# Write-Host ""
# Write-Host "[5/7] Downgrading npm to version 8..." -ForegroundColor Yellow
# npm install -g npm@8
# if ($LASTEXITCODE -eq 0) {
#     Write-Host "  npm downgraded successfully." -ForegroundColor Green
# } else {
#     Write-Host "  Warning: npm downgrade encountered an issue." -ForegroundColor Red
# }

# Step 5: Reinstall dependencies with legacy peer deps
Write-Host ""
Write-Host "[5/6] Reinstalling dependencies with legacy peer deps..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "  Error: Failed to install dependencies." -ForegroundColor Red
    Write-Host "  Please check the error messages above and fix any issues." -ForegroundColor Red
    Read-Host -Prompt "Press Enter to exit"
    exit 1
}

# Step 6: Start development servers
Write-Host ""
Write-Host "[6/6] Starting development environment..." -ForegroundColor Yellow

# Read package.json once for both MCP and dev server checks
$packageJsonPath = "package.json"
$packageJson = $null
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
}

# Check for and start MCP server (if present)
$mcpServerExists = $false
if (Test-Path "mcp-server.js") {
    $mcpServerExists = $true
    Write-Host "  Found mcp-server.js. Starting MCP server..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "mcp-server.js" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "  MCP server started in background." -ForegroundColor Green
} elseif ($null -ne $packageJson -and $packageJson.scripts.PSObject.Properties.Name -contains "mcp") {
    $mcpServerExists = $true
    Write-Host "  Found MCP script in package.json. Starting MCP server..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run mcp" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "  MCP server started in background." -ForegroundColor Green
}

if (-not $mcpServerExists) {
    Write-Host "  No MCP server configuration found. Skipping..." -ForegroundColor Gray
}

# Step 8: Start the development server
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Starting dev server...      " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check for different dev server configurations
if ($null -ne $packageJson) {
    
    # Check for common dev scripts
    if ($packageJson.scripts.PSObject.Properties.Name -contains "dev") {
        Write-Host "Starting with 'npm run dev'..." -ForegroundColor Green
        npm run dev
    } elseif ($packageJson.scripts.PSObject.Properties.Name -contains "start") {
        Write-Host "Starting with 'npm start'..." -ForegroundColor Green
        npm start
    } elseif ($packageJson.scripts.PSObject.Properties.Name -contains "serve") {
        Write-Host "Starting with 'npm run serve'..." -ForegroundColor Green
        npm run serve
    } else {
        Write-Host "No dev server script found in package.json." -ForegroundColor Yellow
        Write-Host "You can manually start your development server." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available scripts:" -ForegroundColor Cyan
        $packageJson.scripts.PSObject.Properties | ForEach-Object {
            Write-Host "  npm run $($_.Name)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "No package.json found. Cannot start dev server automatically." -ForegroundColor Red
}

Write-Host ""
Write-Host "If you encounter any issues, please check the logs above." -ForegroundColor Cyan
Write-Host ""
