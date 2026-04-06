-- Migration: 000_create_members_table.sql
-- Descrição: Cria tabela de membros da igreja
-- Data: 2026-03-29

USE igreja_crista;

-- Criar tabela de membros
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

-- Comentários nas colunas
ALTER TABLE members 
  MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único do membro',
  MODIFY COLUMN full_name VARCHAR(255) NOT NULL COMMENT 'Nome completo do membro',
  MODIFY COLUMN email VARCHAR(255) NULL UNIQUE COMMENT 'Email do membro (único)',
  MODIFY COLUMN phone VARCHAR(20) NULL COMMENT 'Telefone do membro',
  MODIFY COLUMN birth_date DATE NULL COMMENT 'Data de nascimento',
  MODIFY COLUMN gender ENUM('Masculino', 'Feminino') NULL COMMENT 'Gênero do membro',
  MODIFY COLUMN address VARCHAR(255) NULL COMMENT 'Endereço do membro',
  MODIFY COLUMN house_number VARCHAR(20) NULL COMMENT 'Número da casa/apartamento',
  MODIFY COLUMN complement VARCHAR(100) NULL COMMENT 'Complemento do endereço',
  MODIFY COLUMN city VARCHAR(100) NULL COMMENT 'Cidade do membro',
  MODIFY COLUMN state VARCHAR(2) NULL COMMENT 'Estado (UF) do membro',
  MODIFY COLUMN zip_code VARCHAR(10) NULL COMMENT 'CEP do membro',
  MODIFY COLUMN baptism_date DATE NULL COMMENT 'Data do batismo',
  MODIFY COLUMN membership_date DATE NULL COMMENT 'Data de entrada como membro',
  MODIFY COLUMN status ENUM('Ativo', 'Inativo', 'Visitante') DEFAULT 'Ativo' COMMENT 'Status atual do membro',
  MODIFY COLUMN notes TEXT NULL COMMENT 'Observações adicionais sobre o membro',
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
  MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização';

-- Adicionar comentário na tabela
ALTER TABLE members 
  COMMENT = 'Tabela de membros da igreja com informações pessoais e de contato';
