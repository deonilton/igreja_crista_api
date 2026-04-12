-- Criar tabela de líderes de evangelismo
CREATE TABLE evangelismo_leaders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member_id (member_id)
);

CREATE INDEX idx_evangelismo_leaders_member_id ON evangelismo_leaders(member_id);
