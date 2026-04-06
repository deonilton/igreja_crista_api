-- =====================================================
-- Script de Criação de Tabelas para Pequenas Famílias
-- Execute este script no seu banco de dados MySQL
-- =====================================================

-- Criar tabela de detalhes de pequenas famílias
CREATE TABLE IF NOT EXISTS small_family_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Nome da Pequena Família',
  responsible_id INT NOT NULL COMMENT 'ID do membro responsável',
  
  -- Endereço
  cep VARCHAR(9) NOT NULL COMMENT 'CEP',
  street VARCHAR(255) DEFAULT NULL COMMENT 'Rua/Logradouro',
  number VARCHAR(20) NOT NULL COMMENT 'Número',
  complement VARCHAR(100) DEFAULT NULL COMMENT 'Complemento',
  neighborhood VARCHAR(100) DEFAULT NULL COMMENT 'Bairro',
  city VARCHAR(100) DEFAULT NULL COMMENT 'Cidade',
  state VARCHAR(2) DEFAULT NULL COMMENT 'Estado (UF)',
  
  -- Família
  host_name VARCHAR(255) NOT NULL COMMENT 'Nome do anfitrião',
  host_age INT NOT NULL COMMENT 'Idade do anfitrião',
  
  -- Informações adicionais
  is_converted BOOLEAN DEFAULT FALSE COMMENT 'É convertido?',
  has_bible BOOLEAN DEFAULT FALSE COMMENT 'Possui bíblia em casa?',
  meeting_days JSON DEFAULT NULL COMMENT 'Dias de reunião (array)',
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (responsible_id) REFERENCES members(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_responsible_id (responsible_id),
  INDEX idx_city (city),
  INDEX idx_neighborhood (neighborhood)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de membros da família (relacionamento 1:N)
CREATE TABLE IF NOT EXISTS small_family_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  small_family_id INT NOT NULL COMMENT 'ID da pequena família',
  name VARCHAR(255) NOT NULL COMMENT 'Nome do membro',
  age INT NOT NULL COMMENT 'Idade do membro',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (small_family_id) REFERENCES small_family_details(id) ON DELETE CASCADE,
  INDEX idx_small_family_id (small_family_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se as tabelas foram criadas
SELECT 
  'Tabelas criadas com sucesso!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'small_family_details') AS small_family_details_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'small_family_members') AS small_family_members_exists;
