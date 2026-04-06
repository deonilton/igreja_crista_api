# Database - Igreja Cristã API

Esta pasta contém todas as migrations e scripts SQL do projeto.

## Estrutura

```
database/
├── migrations/          # Migrations ordenadas numericamente
│   ├── 001_create_roles_table.sql
│   ├── 002_create_ministries_table.sql
│   ├── 003_update_users_table.sql
│   └── 004_create_user_ministries_table.sql
├── seeds/              # Dados iniciais (opcional)
└── README.md           # Este arquivo
```

## Como executar as migrations

### Opção 1: Executar todas de uma vez
```bash
# No MySQL Workbench ou terminal MySQL
mysql -u root -p igreja_crista < database/migrations/001_create_roles_table.sql
mysql -u root -p igreja_crista < database/migrations/002_create_ministries_table.sql
mysql -u root -p igreja_crista < database/migrations/003_update_users_table.sql
mysql -u root -p igreja_crista < database/migrations/004_create_user_ministries_table.sql
```

### Opção 2: Executar manualmente
Abra cada arquivo `.sql` no MySQL Workbench e execute na ordem numérica.

## Ordem de execução (IMPORTANTE!)

As migrations devem ser executadas **na ordem numérica**:

1. `001_create_roles_table.sql` - Cria tabela de roles
2. `002_create_ministries_table.sql` - Cria tabela de ministérios
3. `003_update_users_table.sql` - Atualiza tabela users
4. `004_create_user_ministries_table.sql` - Cria relacionamento user-ministries

## Nova estrutura de tabelas

### `roles`
Armazena os perfis de acesso do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| name | VARCHAR(50) | Identificador (super_admin, admin, colaborador) |
| display_name | VARCHAR(100) | Nome para exibição |
| description | TEXT | Descrição da role |
| is_super_admin | BOOLEAN | Se é super admin |

### `ministries`
Armazena os ministérios disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| name | VARCHAR(50) | Identificador (pequenas_familias, etc) |
| display_name | VARCHAR(100) | Nome para exibição |
| description | TEXT | Descrição do ministério |
| icon | VARCHAR(50) | Nome do ícone |
| is_active | BOOLEAN | Se está ativo |

### `users` (atualizada)
Tabela de usuários com referência a role.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| name | VARCHAR(255) | Nome do usuário |
| email | VARCHAR(255) | Email (único) |
| password | VARCHAR(255) | Senha hash |
| role_id | INT | FK para roles |

### `user_ministries`
Relacionamento N:N entre users e ministries.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| user_id | INT | FK para users |
| ministry_id | INT | FK para ministries |

## Vantagens da nova estrutura

✅ **Normalização:** Dados não duplicados
✅ **Flexibilidade:** Fácil adicionar novos ministérios/roles
✅ **Performance:** Índices otimizados
✅ **Manutenção:** Queries mais simples e claras
✅ **Auditoria:** Melhor controle de mudanças
✅ **Escalabilidade:** Preparado para crescimento

## Exemplos de uso

### Verificar roles de um usuário
```sql
SELECT u.name, r.display_name as role
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE u.id = 1;
```

### Listar ministérios de um usuário
```sql
SELECT u.name, m.display_name as ministry
FROM users u
INNER JOIN user_ministries um ON u.id = um.user_id
INNER JOIN ministries m ON um.ministry_id = m.id
WHERE u.id = 1;
```

### Verificar se usuário tem acesso a um ministério
```sql
SELECT EXISTS(
  SELECT 1 FROM user_ministries um
  INNER JOIN ministries m ON um.ministry_id = m.id
  WHERE um.user_id = 1 AND m.name = 'louvor'
) as has_access;
```
