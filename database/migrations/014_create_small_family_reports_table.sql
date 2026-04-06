-- Criar tabela de relatórios de pequenas famílias
CREATE TABLE small_family_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  cult_date DATE NOT NULL,
  horario_inicio TIME DEFAULT NULL,
  horario_termino TIME DEFAULT NULL,
  responsavel VARCHAR(255) NOT NULL,
  endereco VARCHAR(500) DEFAULT NULL,
  bairro VARCHAR(255) DEFAULT NULL,
  participantes TEXT DEFAULT NULL,
  offering_amount DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES small_families(id) ON DELETE CASCADE
);

CREATE INDEX idx_small_family_reports_family_id ON small_family_reports(family_id);
CREATE INDEX idx_small_family_reports_cult_date ON small_family_reports(cult_date);
