# Script PowerShell para verificar se as tabelas existem
# Uso: .\database\check_tables.ps1

Write-Host "🔍 Verificação de Tabelas do Banco de Dados" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Yellow

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
        break
    }
}

if (-not $mysqlAvailable) {
    Write-Host "❌ MySQL não encontrado no sistema" -ForegroundColor Red
    exit 1
}

# Configurações
$dbHost = "localhost"
$dbUser = "root"
$dbPassword = ""
$dbName = "igreja_crista"

# Pedir senha se necessário
if ($dbPassword -eq "") {
    $passwordInput = Read-Host "Digite a senha do MySQL (pressione Enter para vazio)"
    $dbPassword = $passwordInput
}

Write-Host ""
Write-Host "📋 Verificando tabelas no banco '$dbName'..." -ForegroundColor Yellow

# Tabelas para verificar
$tables = @("members", "ministries", "ministry_leaders")

foreach ($table in $tables) {
    Write-Host ""
    Write-Host "🔍 Verificando tabela: $table" -ForegroundColor Cyan
    
    # Comando SQL para verificar se a tabela existe
    $sql = "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = '$dbName' AND table_name = '$table';"
    
    $mysqlArgs = @(
        "-h$dbHost",
        "-u$dbUser"
    )

    if ($dbPassword -ne "") {
        $mysqlArgs += "-p$dbPassword"
    }

    $mysqlArgs += $dbName
    $mysqlArgs += "-e"
    $mysqlArgs += $sql

    try {
        $process = Start-Process -FilePath $mysqlPath -ArgumentList $mysqlArgs -Wait -PassThru -NoNewWindow -RedirectStandardOutput "temp_output.txt"
        
        if ($process.ExitCode -eq 0) {
            $output = Get-Content "temp_output.txt" | Select-Object -Skip 1
            $tableExists = [int]$output
            
            if ($tableExists -gt 0) {
                Write-Host "   ✅ Tabela '$table' existe" -ForegroundColor Green
                
                # Contar registros
                $countSql = "SELECT COUNT(*) as record_count FROM $table;"
                $countArgs = $mysqlArgs[0..($mysqlArgs.Length-2)] + @("-e", $countSql)
                
                $countProcess = Start-Process -FilePath $mysqlPath -ArgumentList $countArgs -Wait -PassThru -NoNewWindow -RedirectStandardOutput "temp_count.txt"
                
                if ($countProcess.ExitCode -eq 0) {
                    $countOutput = Get-Content "temp_count.txt" | Select-Object -Skip 1
                    $recordCount = [int]$countOutput
                    Write-Host "   📊 Registros: $recordCount" -ForegroundColor White
                }
            } else {
                Write-Host "   ❌ Tabela '$table' NÃO existe" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Erro ao verificar tabela '$table'" -ForegroundColor Red
        }
        
        # Limpar arquivos temporários
        if (Test-Path "temp_output.txt") { Remove-Item "temp_output.txt" }
        if (Test-Path "temp_count.txt") { Remove-Item "temp_count.txt" }
        
    } catch {
        Write-Host "   ❌ Erro ao executar verificação: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Resumo da verificação:" -ForegroundColor Yellow

# Verificar se todas as tabelas existem
$allTablesExist = $true
foreach ($table in $tables) {
    # Simples verificação (poderia ser melhorada)
    Write-Host "   $table - Status: Verificado" -ForegroundColor White
}

Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Se alguma tabela não existir, execute: .\database\setup_database.ps1" -ForegroundColor White
Write-Host "2. Reinicie a API: yarn start:dev" -ForegroundColor White
Write-Host "3. Teste o endpoint: curl http://localhost:3001/api/ministries/leaders" -ForegroundColor White

Write-Host ""
Write-Host "✅ Verificação concluída!" -ForegroundColor Green
