$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
if (!(Test-Path '.local/processes.json')) { Write-Host 'Nenhum processo local registrado.'; exit }
$processes = Get-Content '.local/processes.json' -Raw | ConvertFrom-Json
foreach ($name in @('frontend', 'backend', 'mysql')) {
    $processId = $processes.$name
    if (!$processId) { continue }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
    if (!$process -or $process.CommandLine -notlike "*$projectRoot*") { continue }
    if ($name -eq 'mysql') {
        $runtime = Get-Content '.local/runtime.json' -Raw | ConvertFrom-Json
        & $runtime.mysqladmin "--defaults-file=$projectRoot/.local/mysql-client.ini" shutdown
        if ($LASTEXITCODE -ne 0) { throw 'MySQL nao encerrou normalmente; consulte .local/mysql-error.log.' }
    } else { Stop-Process -Id $processId }
}
Write-Host 'AgendaPro parado. Os dados locais foram preservados.'
