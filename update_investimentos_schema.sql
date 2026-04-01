-- Migration to create the Investimentos table

CREATE TABLE IF NOT EXISTS public.investimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Renda Fixa', 'Ações', 'FIIs', 'Cripto', 'Outros')),
    valor_investido NUMERIC NOT NULL DEFAULT 0.00,
    rendimento_percentual NUMERIC NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver seus próprios investimentos"
    ON public.investimentos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios investimentos"
    ON public.investimentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios investimentos"
    ON public.investimentos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios investimentos"
    ON public.investimentos FOR DELETE
    USING (auth.uid() = user_id);
    

-- Para teste inicial, caso não houver registros, vamos deixar o app limpo e permitir que o usuário insira.
-- Com isso aplicamos as permissões corretas no banco real do supabase.
