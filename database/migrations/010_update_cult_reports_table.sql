-- Migração: Atualizar tabela de relatórios de culto com novos campos
-- Data: 2026-04-02

ALTER TABLE cult_reports
  ADD COLUMN cult_type_familia BOOLEAN DEFAULT FALSE COMMENT 'Culto da Família (Domingo)',
  ADD COLUMN cult_type_oracao BOOLEAN DEFAULT FALSE COMMENT 'Culto de Oração (Quarta-feira)',
  ADD COLUMN cult_type_adolescentes BOOLEAN DEFAULT FALSE COMMENT 'Culto de Adolescentes (Sábado)',
  ADD COLUMN cult_type_outros BOOLEAN DEFAULT FALSE COMMENT 'Outro tipo de culto',
  ADD COLUMN cult_type_outros_texto VARCHAR(255) COMMENT 'Texto do outro tipo de culto',
  ADD COLUMN horario_inicio TIME COMMENT 'Horário de início do culto',
  ADD COLUMN horario_termino TIME COMMENT 'Horário de término do culto',
  ADD COLUMN ministro VARCHAR(255) COMMENT 'Ministro da Palavra',
  ADD COLUMN igreja VARCHAR(255) COMMENT 'Igrejas',
  ADD COLUMN assunto VARCHAR(255) COMMENT 'Assunto da pregação',
  ADD COLUMN texto VARCHAR(255) COMMENT 'Texto bíblico',
  ADD COLUMN lideranca JSON COMMENT 'Liderança presente (array de objetos)',
  ADD COLUMN freq_adultos INT DEFAULT 0 COMMENT 'Frequência de adultos',
  ADD COLUMN freq_criancas INT DEFAULT 0 COMMENT 'Frequência de crianças',
  ADD COLUMN freq_adolescentes INT DEFAULT 0 COMMENT 'Frequência de adolescentes',
  ADD COLUMN freq_visitantes INT DEFAULT 0 COMMENT 'Frequência de visitantes',
  ADD COLUMN freq_total INT DEFAULT 0 COMMENT 'Total de frequência',
  ADD COLUMN diacono_responsavel VARCHAR(255) COMMENT 'Diácono responsável',
  ADD COLUMN casal_recepcao_1 VARCHAR(255) COMMENT 'Casal de recepção 1',
  ADD COLUMN casal_recepcao_2 VARCHAR(255) COMMENT 'Casal de recepção 2',
  ADD COLUMN casal_santa_ceia_1 VARCHAR(255) COMMENT 'Casal da Santa Ceia 1',
  ADD COLUMN casal_santa_ceia_2 VARCHAR(255) COMMENT 'Casal da Santa Ceia 2',
  ADD COLUMN programacao JSON COMMENT 'Programação do culto (array de objetos)',
  ADD COLUMN ocorrencias_gerais TEXT COMMENT 'Ocorrências gerais',
  ADD COLUMN responsavel VARCHAR(255) COMMENT 'Responsável pelo relatório';

-- Remover colunas antigas (opcional - após migração bem-sucedida)
-- ALTER TABLE cult_reports DROP COLUMN preacher;
-- ALTER TABLE cult_reports DROP COLUMN subject;
-- ALTER TABLE cult_reports DROP COLUMN visitors;
-- ALTER TABLE cult_reports DROP COLUMN members;
-- ALTER TABLE cult_reports DROP COLUMN children;
-- ALTER TABLE cult_reports DROP COLUMN teenagers;
-- ALTER TABLE cult_reports DROP COLUMN baptisms;
-- ALTER TABLE cult_reports DROP COLUMN accidents;
-- ALTER TABLE cult_reports DROP COLUMN description;
