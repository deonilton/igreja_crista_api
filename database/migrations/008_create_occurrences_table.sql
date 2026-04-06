-- Migration: Create occurrences table
-- Description: Create table to store church occurrences and incidents (MySQL)

CREATE TABLE IF NOT EXISTS occurrences (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único da ocorrência',
    date DATE NOT NULL COMMENT 'Data em que a ocorrência aconteceu',
    reporter_name VARCHAR(255) NOT NULL COMMENT 'Nome da pessoa que está registrando a ocorrência',
    witnesses TEXT NULL COMMENT 'Nomes das testemunhas (se houver)',
    location VARCHAR(255) NOT NULL COMMENT 'Local onde ocorreu o incidente',
    description TEXT NOT NULL COMMENT 'Descrição detalhada do ocorrido',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação do registro',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última atualização do registro'
);

-- Create index for date column for better query performance
CREATE INDEX idx_occurrences_date ON occurrences(date);

-- Create index for reporter_name
CREATE INDEX idx_occurrences_reporter ON occurrences(reporter_name);

-- Create index for created_at
CREATE INDEX idx_occurrences_created_at ON occurrences(created_at);
