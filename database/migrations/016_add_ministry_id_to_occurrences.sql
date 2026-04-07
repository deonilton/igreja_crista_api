-- Migration: Add ministry_id to occurrences table
-- Description: Add column to separate occurrences by ministry (diaconia, pequenas_familias, etc.)

-- Add ministry_id column
ALTER TABLE occurrences 
ADD COLUMN ministry_id VARCHAR(50) NULL COMMENT 'Identificador do ministério (diaconia, pequenas_familias, etc.)' 
AFTER id;

-- Create index for ministry_id
CREATE INDEX idx_occurrences_ministry_id ON occurrences(ministry_id);

-- Update existing records to have a default ministry (diaconia, as it was the first to use this table)
UPDATE occurrences SET ministry_id = 'diaconia' WHERE ministry_id IS NULL;
