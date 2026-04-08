-- Criar tabela de detalhes das Casas de Paz
CREATE TABLE IF NOT EXISTS casas_de_paz (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Nome da Casa de Paz',
  responsible_id INT NOT NULL COMMENT 'ID do membro responsável/líder',
  
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

-- Criar tabela de membros da Casa de Paz (relacionamento 1:N)
CREATE TABLE IF NOT EXISTS casa_de_paz_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  casa_de_paz_id INT NOT NULL COMMENT 'ID da Casa de Paz',
  name VARCHAR(255) NOT NULL COMMENT 'Nome do membro',
  age INT NOT NULL COMMENT 'Idade do membro',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (casa_de_paz_id) REFERENCES casas_de_paz(id) ON DELETE CASCADE,
  INDEX idx_casa_de_paz_id (casa_de_paz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
