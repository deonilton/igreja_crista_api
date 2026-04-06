-- Criar tabela de pequenas famílias
CREATE TABLE small_families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member_id (member_id)
);

CREATE INDEX idx_small_families_member_id ON small_families(member_id);
