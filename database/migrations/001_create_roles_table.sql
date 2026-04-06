-- Migration: 001_create_roles_table.sql
-- Descrição: Cria tabela de roles (perfis de acesso) do sistema
-- Data: 2026-03-26

USE igreja_crista;

-- Criar tabela de roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir roles padrão do sistema
INSERT INTO roles (name, display_name, description, is_super_admin) VALUES
('super_admin', 'Super Administrador', 'Acesso total ao sistema, pode gerenciar usuários e todas as funcionalidades', TRUE),
('admin', 'Administrador', 'Acesso aos ministérios selecionados, pode gerenciar dados dentro de suas permissões', FALSE),
('colaborador', 'Colaborador', 'Acesso limitado aos ministérios específicos atribuídos', FALSE);

-- Comentários nas colunas
ALTER TABLE roles 
  MODIFY COLUMN name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Identificador único da role (usado no código)',
  MODIFY COLUMN display_name VARCHAR(100) NOT NULL COMMENT 'Nome amigável para exibição',
  MODIFY COLUMN description TEXT NULL COMMENT 'Descrição detalhada da role e suas permissões',
  MODIFY COLUMN is_super_admin BOOLEAN DEFAULT FALSE COMMENT 'Indica se é super admin com acesso total';
