-- Migration: 002_create_ministries_table.sql
-- Descrição: Cria tabela de ministérios do sistema
-- Data: 2026-03-26

USE igreja_crista;

-- Criar tabela de ministérios
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

-- Inserir ministérios padrão
INSERT INTO ministries (name, display_name, description, icon) VALUES
('pequenas_familias', 'Pequenas Famílias', 'Gestão e acompanhamento das pequenas famílias da igreja', 'FiHeart'),
('evangelismo', 'Evangelismo e Missões - Casa de Paz', 'Gestão de atividades evangelísticas e casas de paz', 'FiSend'),
('diaconia', 'Diaconia', 'Gestão de ações sociais e serviços diaconais', 'FiGift'),
('louvor', 'Louvor', 'Gestão do ministério de louvor e adoração', 'FiMusic'),
('ministerio_infantil', 'Ministério Infantil', 'Gestão das atividades e crianças do ministério infantil', 'FiSmile'),
('membros', 'Membros da ICF - Aparecida', 'Gestão de membros e visitantes da igreja', 'FiUsers');

-- Comentários nas colunas
ALTER TABLE ministries 
  MODIFY COLUMN name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Identificador único do ministério (usado no código)',
  MODIFY COLUMN display_name VARCHAR(100) NOT NULL COMMENT 'Nome amigável para exibição',
  MODIFY COLUMN description TEXT NULL COMMENT 'Descrição do ministério e suas atividades',
  MODIFY COLUMN icon VARCHAR(50) NULL COMMENT 'Nome do ícone React Icons',
  MODIFY COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'Indica se o ministério está ativo';
