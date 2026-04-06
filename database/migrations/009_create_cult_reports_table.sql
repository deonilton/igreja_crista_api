-- Migração: Criar tabela de relatórios de culto
-- Data: 2026-03-28

CREATE TABLE IF NOT EXISTS cult_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preacher VARCHAR(255) NOT NULL COMMENT 'Nome do pregador',
  subject VARCHAR(255) NOT NULL COMMENT 'Assunto da pregação',
  visitors INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de visitantes',
  members INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de membros',
  children INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de crianças',
  teenagers INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de adolescentes',
  baptisms INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de batismos',
  accidents INT NOT NULL DEFAULT 0 COMMENT 'Quantidade de acidentes',
  description TEXT COMMENT 'Descrição geral do culto',
  cult_date DATE NOT NULL COMMENT 'Data do culto',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_cult_date (cult_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
