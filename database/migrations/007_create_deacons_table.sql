-- Criar tabela de diáconos
CREATE TABLE deacons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member_id (member_id) -- Garante que um membro não pode ser diácono mais de uma vez
);

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_deacons_member_id ON deacons(member_id);
