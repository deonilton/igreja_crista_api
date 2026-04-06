-- Migration: Adicionar campo complement na tabela members
-- Data: 2025-03-27
-- Descrição: Adiciona campo para complemento do endereço dos membros

USE igreja_crista;

-- Adicionar coluna complement após house_number
ALTER TABLE members 
ADD COLUMN complement VARCHAR(100) NULL 
AFTER house_number;

-- Adicionar comentário na coluna
ALTER TABLE members 
MODIFY COLUMN complement VARCHAR(100) NULL 
COMMENT 'Complemento do endereço (apto, bloco, casa, etc.)';

-- Exibir estrutura atualizada
DESCRIBE members;
