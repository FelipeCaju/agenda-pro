param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
if (!(Test-Path '.local/prepared')) { throw 'Ambiente local nao preparado. Consulte docs/TESTE_LOCAL.md.' }
$runtime = Get-Content '.local/runtime.json' -Raw | ConvertFrom-Json
$backendEnv = Get-Content 'backend/.env' -Raw
if ($backendEnv -notmatch '(?m)^DB_HOST=127\.0\.0\.1\r?$' -or $backendEnv -notmatch '(?m)^DB_PORT=3307\r?$') {
    throw 'O backend nao esta configurado para o banco local esperado. Inicializacao cancelada.'
}
$processes = @{}
if (Test-Path '.local/processes.json') {
    (Get-Content '.local/processes.json' -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $processes[$_.Name] = $_.Value }
}
function Start-LocalProcess($name, $file, $arguments, $workingDir) {
    $existing = if ($processes.ContainsKey($name)) { Get-CimInstance Win32_Process -Filter "ProcessId = $($processes[$name])" } else { $null }
    if ($existing -and $existing.CommandLine -like "*$projectRoot*") { return }
    $process = Start-Process -FilePath $file -ArgumentList $arguments -WorkingDirectory $workingDir -WindowStyle Hidden -PassThru -RedirectStandardOutput "$projectRoot/.local/$name.out.log" -RedirectStandardError "$projectRoot/.local/$name.err.log"
    $processes[$name] = $process.Id
    $processes | ConvertTo-Json | Set-Content '.local/processes.json'
}
function Wait-Http($url) {
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        try { $null = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; return } catch { Start-Sleep -Milliseconds 500 }
    }
    throw "Servico nao respondeu: $url. Consulte os logs em .local."
}
Start-LocalProcess 'mysql' $runtime.mysql ('"--defaults-file=' + $projectRoot + '/.local/mysql.ini"') $projectRoot
$dbReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    & $runtime.mysqladmin "--defaults-file=$projectRoot/.local/mysql-client.ini" ping --silent 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
    Start-Sleep -Milliseconds 500
}
if (!$dbReady) { throw 'MySQL nao iniciou. Consulte .local/mysql-error.log.' }
Start-LocalProcess 'backend' $runtime.node ('"' + $projectRoot + '/backend/src/server.js"') "$projectRoot/backend"
Wait-Http 'http://127.0.0.1:3333/api/health'
Start-LocalProcess 'frontend' $runtime.node ('"' + $projectRoot + '/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port 5173 --strictPort') "$projectRoot/frontend"
Wait-Http 'http://127.0.0.1:5173'
Write-Host 'AgendaPro pronto: http://localhost:5173'
Write-Host 'Login: contato@agendapro.app / Agenda123!'
if (!$NoBrowser) { Start-Process 'http://localhost:5173' }
