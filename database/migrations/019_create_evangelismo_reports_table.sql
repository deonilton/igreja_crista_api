-- Criar tabela de relatórios de evangelismo
CREATE TABLE IF NOT EXISTS evangelismo_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  casa_de_paz_id INT NOT NULL COMMENT 'ID da Casa de Paz',
  
  -- Data e Horário
  cult_date DATE NOT NULL COMMENT 'Data do encontro',
  horario_inicio TIME DEFAULT NULL COMMENT 'Horário de início',
  horario_termino TIME DEFAULT NULL COMMENT 'Horário de término',
  
  -- Informações do encontro
  responsavel VARCHAR(255) NOT NULL COMMENT 'Nome do responsável',
  endereco VARCHAR(255) DEFAULT NULL COMMENT 'Endereço do encontro',
  bairro VARCHAR(100) DEFAULT NULL COMMENT 'Bairro do encontro',
  participantes TEXT DEFAULT NULL COMMENT 'Nomes dos participantes',
  
  -- Estatísticas
  new_visitors INT DEFAULT 0 COMMENT 'Quantidade de novos visitantes',
  conversions INT DEFAULT 0 COMMENT 'Quantidade de conversões',
  offeringAmount DECIMAL(10,2) DEFAULT 0 COMMENT 'Valor da oferta',
  
  -- Observações
  observacoes TEXT DEFAULT NULL COMMENT 'Observações gerais',
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (casa_de_paz_id) REFERENCES casas_de_paz(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_casa_de_paz_id (casa_de_paz_id),
  INDEX idx_cult_date (cult_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
