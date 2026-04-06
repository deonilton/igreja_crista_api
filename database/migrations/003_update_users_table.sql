-- Migration: 003_update_users_table.sql
-- Descrição: Atualiza tabela users para usar role_id e remove campo ministries JSON
-- Data: 2026-03-26

USE igreja_crista;

-- 1. Adicionar coluna role_id (temporariamente NULL para migração)
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER password;

-- 2. Adicionar foreign key para roles
ALTER TABLE users ADD CONSTRAINT fk_users_role 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;

-- 3. Migrar dados existentes de role (string) para role_id
UPDATE users u
INNER JOIN roles r ON u.role = r.name
SET u.role_id = r.id;

-- 4. Tornar role_id obrigatório após migração
ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL;

-- 5. Remover coluna role antiga (string)
ALTER TABLE users DROP COLUMN role;

-- 6. Remover coluna ministries (JSON) - será substituída por tabela de relacionamento
ALTER TABLE users DROP COLUMN ministries;

-- 7. Adicionar índice
ALTER TABLE users ADD INDEX idx_role_id (role_id);

-- Comentário na coluna
ALTER TABLE users 
  MODIFY COLUMN role_id INT NOT NULL COMMENT 'ID da role/perfil do usuário';
