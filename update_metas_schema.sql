-- Arquivo de Atualização do Banco de Dados para Metas Gamificadas e Histórico

-- 1. Criação da Tabela de Movimentações da Meta (Extrato)
CREATE TABLE IF NOT EXISTS movimentacoes_meta (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id uuid REFERENCES metas_financeiras(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tipo text CHECK (tipo IN ('adicao', 'retirada')) NOT NULL,
  valor numeric NOT NULL,
  motivo text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ativar RLS (Row Level Security)
ALTER TABLE movimentacoes_meta ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para Movimentações
CREATE POLICY "Usuários podem ver suas próprias movimentações" 
ON movimentacoes_meta FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias movimentações" 
ON movimentacoes_meta FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias movimentações" 
ON movimentacoes_meta FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Atualizar a Tabela metas_financeiras existente com novas colunas
-- Ignora erro caso as colunas já existam
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE metas_financeiras ADD COLUMN plano text;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'coluna plano já existe';
  END;

  BEGIN
    ALTER TABLE metas_financeiras ADD COLUMN dia_d timestamp with time zone;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'coluna dia_d já existe';
  END;

  BEGIN
    ALTER TABLE metas_financeiras ADD COLUMN valor_inicial numeric DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'coluna valor_inicial já existe';
  END;

  BEGIN
    ALTER TABLE metas_financeiras ADD COLUMN categoria text;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'coluna categoria já existe';
  END;
  
  BEGIN
    ALTER TABLE metas_financeiras ADD COLUMN motivacao text;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'coluna motivacao já existe';
  END;
END $$;
