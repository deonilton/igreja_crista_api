-- Script completo para setup das tabelas de Ministry Leaders
-- Execute este script no MySQL Workbench ou via linha de comando
-- Uso: mysql -u root -p igreja_crista < database/setup_ministry_leaders.sql

USE igreja_crista;

-- 1. Criar tabela members (se não existir)
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL UNIQUE,
  phone VARCHAR(20) NULL,
  birth_date DATE NULL,
  gender ENUM('Masculino', 'Feminino') NULL,
  address VARCHAR(255) NULL,
  house_number VARCHAR(20) NULL,
  complement VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(2) NULL,
  zip_code VARCHAR(10) NULL,
  baptism_date DATE NULL,
  membership_date DATE NULL,
  status ENUM('Ativo', 'Inativo', 'Visitante') DEFAULT 'Ativo',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_full_name (full_name),
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar comentários na tabela members
ALTER TABLE members 
  COMMENT = 'Tabela de membros da igreja com informações pessoais e de contato';

-- 2. Criar tabela ministry_leaders
CREATE TABLE IF NOT EXISTS ministry_leaders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ministry_id VARCHAR(50) NOT NULL,
  member_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate ministry-member relationships
  UNIQUE KEY unique_ministry_member (ministry_id, member_id),
  
  -- Indexes for performance
  INDEX idx_ministry_leaders_ministry_id (ministry_id),
  INDEX idx_ministry_leaders_member_id (member_id)
);

-- Adicionar comentários na tabela ministry_leaders
ALTER TABLE ministry_leaders 
  COMMENT = 'Tabela que armazena o relacionamento entre ministérios e seus líderes (membros)';

-- 3. Verificar se a tabela ministries existe e criar dados básicos se necessário
CREATE TABLE IF NOT EXISTS ministries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(50) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir ministérios padrão (se não existirem)
INSERT IGNORE INTO ministries (name, display_name, description, icon) VALUES
('pequenas_familias', 'Pequenas Famílias', 'Grupos de pequenas famílias para comunhão e cuidado mútuo', 'home'),
('evangelismo', 'Evangelismo e Missões', 'Responsável por evangelismo e projetos missionários', 'globe'),
('diaconia', 'Diaconia', 'Cuidado com necessidades práticas e assistência social', 'heart'),
('louvor', 'Louvor', 'Ministério de música e adoração', 'music'),
('ministerio_infantil', 'Ministério Infantil', 'Cuidado e ensino para crianças', 'child'),
('membros', 'Membros da ICF', 'Gestão geral de membros da igreja', 'users');

-- 4. Inserir alguns membros de teste (se não existirem)
INSERT IGNORE INTO members (full_name, email, phone, status) VALUES
('João Silva', 'joao@exemplo.com', '11999999999', 'Ativo'),
('Maria Santos', 'maria@exemplo.com', '11888888888', 'Ativo'),
('Pedro Oliveira', 'pedro@exemplo.com', '11777777777', 'Ativo'),
('Ana Costa', 'ana@exemplo.com', '11666666666', 'Ativo'),
('Carlos Ferreira', 'carlos@exemplo.com', '11555555555', 'Ativo');

-- 5. Mostrar estrutura criada
SELECT 'Tabelas criadas com sucesso:' as status;

SHOW TABLES LIKE 'members';
SHOW TABLES LIKE 'ministries';  
SHOW TABLES LIKE 'ministry_leaders';

-- 6. Verificar dados inseridos
SELECT 'Ministérios cadastrados:' as info;
SELECT id, name, display_name, is_active FROM ministries ORDER BY display_name;

SELECT 'Membros cadastrados:' as info;
SELECT id, full_name, email, phone, status FROM members ORDER BY full_name LIMIT 5;

SELECT 'Estrutura da tabela ministry_leaders:' as info;
DESCRIBE ministry_leaders;

-- 7. Script finalizado
SELECT 'Setup completo! As tabelas estão prontas para uso.' as final_status;
