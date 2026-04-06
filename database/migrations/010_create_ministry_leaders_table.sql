-- Create ministry_leaders table
-- This table manages the relationship between ministries and their leaders (members)

CREATE TABLE IF NOT EXISTS ministry_leaders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ministry_id VARCHAR(50) NOT NULL,
  member_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate ministry-member relationships
  UNIQUE KEY unique_ministry_member (ministry_id, member_id),
  
  -- Indexes for performance
  INDEX idx_ministry_leaders_ministry_id (ministry_id),
  INDEX idx_ministry_leaders_member_id (member_id)
);

-- Add comments for documentation
ALTER TABLE ministry_leaders 
  COMMENT = 'Table that stores the relationship between ministries and their leaders (members)';

DELIMITER //

CREATE TRIGGER check_ministry_leaders_limit
BEFORE INSERT ON ministry_leaders
FOR EACH ROW
BEGIN
  DECLARE leader_count INT;

  SELECT COUNT(*) INTO leader_count
  FROM ministry_leaders
  WHERE ministry_id = NEW.ministry_id;

  IF leader_count >= 2 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Ministry cannot have more than 2 leaders';
  END IF;

  -- Evitar duplicidade (mesmo membro no mesmo ministério)
  IF EXISTS (
    SELECT 1 FROM ministry_leaders
    WHERE ministry_id = NEW.ministry_id
      AND member_id = NEW.member_id
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'This member is already a leader of this ministry';
  END IF;

END//

DELIMITER ;
