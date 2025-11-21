<#
PowerShell helper to install the backend/frontend as services using NSSM.
Usage (run as Administrator):
  .\nssm_install.ps1 -NssmPath 'C:\tools\nssm\nssm.exe' -ProjectRoot 'C:\Users\acer\Desktop\NRMARINEGARMENTS' -AdminKey '12345'
#>

param(
  [Parameter(Mandatory=$true)] [string]$NssmPath,
  [Parameter(Mandatory=$true)] [string]$ProjectRoot,
  [string]$AdminKey = '12345'
)

if (-not (Test-Path $NssmPath)) { Write-Error "nssm.exe not found at $NssmPath"; exit 1 }

$node = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path $node)) {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) { $node = $nodeCmd.Source }
}
if (-not (Test-Path $node)) { Write-Error 'node.exe not found; ensure Node.js is installed and on PATH'; exit 1 }

Write-Host "Using node: $node"

Write-Host 'Installing NRM-Backend service via NSSM...'
& $NssmPath install NRM-Backend $node "$ProjectRoot\server\server.js"
& $NssmPath set NRM-Backend AppDirectory "$ProjectRoot\server"
& $NssmPath set NRM-Backend AppEnvironmentExtra "ADMIN_KEY=$AdminKey"
& $NssmPath set NRM-Backend Start SERVICE_AUTO_START
& $NssmPath start NRM-Backend

Write-Host 'Installing NRM-Frontend service via NSSM...'
& $NssmPath install NRM-Frontend $node "$ProjectRoot\serve_frontend.js"
& $NssmPath set NRM-Frontend AppDirectory "$ProjectRoot"
& $NssmPath set NRM-Frontend Start SERVICE_AUTO_START
& $NssmPath start NRM-Frontend

Write-Host 'NSSM install attempted. Check Services (services.msc) or run `nssm status NRM-Backend`.'
