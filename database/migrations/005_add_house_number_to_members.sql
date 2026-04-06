-- Migration: Adicionar campo house_number na tabela members
-- Data: 2025-03-27
-- Descrição: Adiciona campo para número da casa no endereço dos membros

USE igreja_crista;

-- Adicionar coluna house_number após address
ALTER TABLE members 
ADD COLUMN house_number VARCHAR(20) NULL 
AFTER address;

-- Adicionar comentário na coluna
ALTER TABLE members 
MODIFY COLUMN house_number VARCHAR(20) NULL 
COMMENT 'Número da casa/apartamento do endereço';

-- Exibir estrutura atualizada
DESCRIBE members;
