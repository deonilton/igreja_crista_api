# Script PowerShell para setup do banco de dados
# Uso: .\database\setup_database.ps1

Write-Host "🚀 Setup do Banco de Dados - Ministry Leaders" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Yellow

# Verificar se o MySQL está disponível
$mysqlAvailable = $false
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.28\bin\mysql.exe",
    "mysql"  # Tentar no PATH
)

foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlAvailable = $true
        $mysqlPath = $path
        Write-Host "✅ MySQL encontrado em: $path" -ForegroundColor Green
        break
    }
}

if (-not $mysqlAvailable) {
    Write-Host "❌ MySQL não encontrado. Por favor, use o MySQL Workbench ou phpMyAdmin." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativas:" -ForegroundColor Yellow
    Write-Host "1. Use o MySQL Workbench para executar: database/setup_ministry_leaders.sql" -ForegroundColor White
    Write-Host "2. Use phpMyAdmin (geralmente http://localhost/phpmyadmin)" -ForegroundColor White
    Write-Host "3. Instale o MySQL e adicione ao PATH do Windows" -ForegroundColor White
    exit 1
}

# Configurações
$dbHost = "localhost"
$dbUser = "root"
$dbPassword = ""
$dbName = "igreja_crista"
$setupScript = "database\setup_ministry_leaders.sql"

# Verificar se o arquivo de setup existe
if (-not (Test-Path $setupScript)) {
    Write-Host "❌ Arquivo de setup não encontrado: $setupScript" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Host: $dbHost" -ForegroundColor White
Write-Host "   Usuário: $dbUser" -ForegroundColor White
Write-Host "   Banco: $dbName" -ForegroundColor White
Write-Host "   Script: $setupScript" -ForegroundColor White

# Pedir senha se necessário
if ($dbPassword -eq "") {
    $passwordInput = Read-Host "Digite a senha do MySQL (pressione Enter para vazio)"
    $dbPassword = $passwordInput
}

Write-Host ""
Write-Host "🔧 Executando setup do banco de dados..." -ForegroundColor Yellow

# Construir comando MySQL
$mysqlArgs = @(
    "-h$dbHost",
    "-u$dbUser"
)

if ($dbPassword -ne "") {
    $mysqlArgs += "-p$dbPassword"
}

$mysqlArgs += $dbName
$mysqlArgs += "<"
$mysqlArgs += $setupScript

# Executar comando
try {
    $process = Start-Process -FilePath $mysqlPath -ArgumentList $mysqlArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Setup executado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Tabelas criadas:" -ForegroundColor Yellow
        Write-Host "   - members" -ForegroundColor White
        Write-Host "   - ministries" -ForegroundColor White
        Write-Host "   - ministry_leaders" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Para testar, execute:" -ForegroundColor Yellow
        Write-Host "   yarn start:dev" -ForegroundColor White
        Write-Host "   curl http://localhost:3001/api/ministries/leaders" -ForegroundColor White
    } else {
        Write-Host "❌ Erro na execução do setup (código: $($process.ExitCode))" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possíveis causas:" -ForegroundColor Yellow
        Write-Host "1. Senha incorreta do MySQL" -ForegroundColor White
        Write-Host "2. Banco 'igreja_crista' não existe" -ForegroundColor White
        Write-Host "3. MySQL não está rodando" -ForegroundColor White
        Write-Host ""
        Write-Host "Soluções:" -ForegroundColor Yellow
        Write-Host "1. Verifique se o MySQL está rodando" -ForegroundColor White
        Write-Host "2. Crie o banco: CREATE DATABASE igreja_crista;" -ForegroundColor White
        Write-Host "3. Use o MySQL Workbench para executar o script manualmente" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao executar o comando MySQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup concluído! O sistema está pronto para uso." -ForegroundColor Green
