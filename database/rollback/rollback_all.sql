-- Rollback: Desfazer todas as migrations
-- ATENÇÃO: Isso irá APAGAR dados! Use apenas em desenvolvimento.
-- Data: 2026-03-26

USE igreja_crista;

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Remover tabelas na ordem inversa
DROP TABLE IF EXISTS user_ministries;
DROP TABLE IF EXISTS ministries;

-- Restaurar estrutura antiga da tabela users
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_role;
ALTER TABLE users DROP COLUMN IF EXISTS role_id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('super_admin', 'admin', 'colaborador') NOT NULL DEFAULT 'colaborador' AFTER password;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ministries JSON NULL AFTER role;

-- Remover tabela roles
DROP TABLE IF EXISTS roles;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Nota: Este rollback não restaura os dados antigos!
-- É apenas para reverter a estrutura das tabelas.
