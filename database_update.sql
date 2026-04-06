-- Atualizar tabela users para suportar sistema de permissões por ministério

-- 1. Adicionar campo ministries (JSON array de ministérios permitidos)
ALTER TABLE users ADD COLUMN ministries JSON NULL AFTER role;

-- 2. Modificar campo role para incluir novas roles
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'colaborador') NOT NULL DEFAULT 'colaborador';

-- 3. Atualizar usuários existentes com role 'admin' para 'super_admin'
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- 4. Exemplo de como definir permissões:
-- Super Admin (acesso total - não precisa de ministries definido)
-- UPDATE users SET role = 'super_admin', ministries = NULL WHERE id = 1;

-- Admin com acesso a todos ministérios
-- UPDATE users SET role = 'admin', ministries = '["pequenas_familias", "evangelismo", "diaconia", "louvor", "ministerio_infantil", "membros"]' WHERE id = 2;

-- Colaborador com acesso apenas ao ministério de louvor
-- UPDATE users SET role = 'colaborador', ministries = '["louvor"]' WHERE id = 3;

-- Ministérios disponíveis:
-- - pequenas_familias
-- - evangelismo
-- - diaconia
-- - louvor
-- - ministerio_infantil
-- - membros
