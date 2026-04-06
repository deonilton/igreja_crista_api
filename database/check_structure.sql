-- Script para verificar estrutura atual do banco de dados
USE igreja_crista;

-- Verificar estrutura da tabela members
DESCRIBE members;

-- Verificar dados existentes na tabela members
SELECT id, full_name, phone, status FROM members LIMIT 5;

-- Verificar estrutura da tabela users
DESCRIBE users;

-- Verificar dados do usuário específico
SELECT * FROM users WHERE email = 'deoniltonborges@gmail.com';

-- Verificar se existe campo role
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'igreja_crista' 
  AND TABLE_NAME = 'users';
