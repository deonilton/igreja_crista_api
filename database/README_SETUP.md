# Setup do Banco de Dados - Ministry Leaders

## 🚨 Problema Atual

O erro `Table 'igreja_crista.ministry_leaders' doesn't exist` indica que as tabelas necessárias não foram criadas no banco de dados.

## 📋 Soluções Disponíveis

### Opção 1: MySQL Workbench (Recomendado)

1. **Abra o MySQL Workbench**
2. **Conecte-se ao servidor MySQL** (geralmente localhost com usuário root)
3. **Selecione o banco `igreja_crista`**
4. **Abra uma nova aba SQL**
5. **Execute o script completo:**
   ```sql
   -- Copie e cole todo o conteúdo do arquivo:
   -- database/setup_ministry_leaders.sql
   ```
6. **Clique em Execute** (⚡️)

### Opção 2: Linha de Comando MySQL

Se você tem MySQL instalado e no PATH:

```bash
# Navegar para a pasta do projeto
cd d:\igreja_crista_api

# Executar o script completo
mysql -u root -p igreja_crista < database/setup_ministry_leaders.sql

# Ou executar arquivo por arquivo:
mysql -u root -p igreja_crista < database/migrations/000_create_members_table.sql
mysql -u root -p igreja_crista < database/migrations/010_create_ministry_leaders_table.sql
```

### Opção 3: phpMyAdmin (se disponível)

1. **Acesse o phpMyAdmin** (geralmente http://localhost/phpmyadmin)
2. **Selecione o banco `igreja_crista`**
3. **Clique em "SQL"**
4. **Copie e cole o conteúdo** de `database/setup_ministry_leaders.sql`
5. **Clique em "Executar"**

### Opção 4: XAMPP/WAMP

Se você usa XAMPP ou WAMP:

1. **Inicie o painel de controle**
2. **Inicie os serviços Apache e MySQL**
3. **Abra o phpMyAdmin** pelo painel
4. **Siga os passos da Opção 3**

## 🔍 Verificação

Após executar o script, verifique se as tabelas foram criadas:

```sql
-- Verificar tabelas
SHOW TABLES LIKE 'ministry_leaders';
SHOW TABLES LIKE 'members';

-- Verificar estrutura
DESCRIBE ministry_leaders;
DESCRIBE members;

-- Verificar dados
SELECT COUNT(*) as total_ministries FROM ministries;
SELECT COUNT(*) as total_members FROM members;
```

## 🚀 Teste da API

Após o setup, reinicie a API e teste:

```bash
# Reiniciar servidor
yarn start:dev

# Testar endpoint (em outro terminal)
curl http://localhost:3001/api/ministries/leaders
```

## 📝 Conteúdo do Script Setup

O script `setup_ministry_leaders.sql` cria:

1. ✅ **Tabela `members`** - Se não existir
2. ✅ **Tabela `ministries`** - Com dados básicos
3. ✅ **Tabela `ministry_leaders`** - Relacionamento
4. ✅ **Dados de teste** - 5 membros e 6 ministérios
5. ✅ **Índices e constraints** - Para performance
6. ✅ **Verificação** - Confirma criação das tabelas

## 🛠️ Troubleshooting

### Erro: "Access denied for user 'root'@'localhost'"
- Verifique a senha do MySQL no arquivo `.env`
- Tente sem senha se for instalação padrão

### Erro: "Unknown database 'igreja_crista'"
- Crie o banco primeiro: `CREATE DATABASE igreja_crista;`
- Ou use o MySQL Workbench para criar

### Erro: "Table already exists"
- O script usa `IF NOT EXISTS` para evitar conflitos
- Se necessário, drop as tabelas e recrie

### MySQL não encontrado no PATH
- Use o MySQL Workbench (Opção 1)
- Adicione MySQL ao PATH do Windows
- Use phpMyAdmin (Opção 3)

## 📞 Ajuda Adicional

Se precisar de ajuda:

1. **Verifique o console** da API para erros específicos
2. **Confirme a conexão** com o banco de dados
3. **Verifique as credenciais** no arquivo `.env`
4. **Teste a conexão básica** com o banco primeiro

---

## ✅ Checklist de Setup

- [ ] MySQL está rodando
- [ ] Banco `igreja_crista` existe
- [ ] Script `setup_ministry_leaders.sql` executado
- [ ] Tabelas criadas (members, ministries, ministry_leaders)
- [ ] API reiniciada
- [ ] Endpoint `/api/ministries/leaders` funcionando

Quando todos os itens estiverem marcados, o sistema estará funcionando! 🚀
