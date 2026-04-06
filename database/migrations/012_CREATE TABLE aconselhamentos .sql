CREATE TABLE aconselhamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pastor_id INT NOT NULL,
  nome_pessoa VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  observacoes TEXT,
  status ENUM('agendado', 'realizado', 'cancelado') DEFAULT 'agendado',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pastor_data (pastor_id, data),
  INDEX idx_data (data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;