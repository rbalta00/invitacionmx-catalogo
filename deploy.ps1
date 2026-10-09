<#
Publica cambios de este repo: git commit + push a GitHub + deploy a Vercel,
en un solo paso.

Uso:
  .\deploy.ps1 "mensaje del cambio"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Mensaje
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git add -A
$hayCambios = git status --porcelain
if ($hayCambios) {
    git commit -m $Mensaje
    git push
} else {
    Write-Host "No hay cambios nuevos para comitear (sigo con el deploy a Vercel)." -ForegroundColor Yellow
}

vercel --prod
Write-Host "Listo: guardado, subido y publicado." -ForegroundColor Green
