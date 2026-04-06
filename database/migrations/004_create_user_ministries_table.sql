-- Migration: 004_create_user_ministries_table.sql
-- Descrição: Cria tabela de relacionamento entre usuários e ministérios
-- Data: 2026-03-26

USE igreja_crista;

-- Criar tabela de relacionamento user_ministries
CREATE TABLE IF NOT EXISTS user_ministries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ministry_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_ministry (user_id, ministry_id),
  INDEX idx_user_id (user_id),
  INDEX idx_ministry_id (ministry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentários
ALTER TABLE user_ministries 
  MODIFY COLUMN user_id INT NOT NULL COMMENT 'ID do usuário',
  MODIFY COLUMN ministry_id INT NOT NULL COMMENT 'ID do ministério permitido';

-- Nota: Super admins não precisam de registros nesta tabela
-- pois têm acesso total automaticamente
