-- 1. Create Pagamentos Fatura table
CREATE TABLE IF NOT EXISTS public.pagamentos_fatura (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor_pago NUMERIC NOT NULL CHECK (valor_pago >= 0),
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    metodo_pagamento TEXT NOT NULL CHECK (metodo_pagamento IN ('Saldo', 'Saldo da Conta', 'Pix', 'Boleto', 'Outros')),
    comprovante_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on pagamentos_fatura
ALTER TABLE public.pagamentos_fatura ENABLE ROW LEVEL SECURITY;

-- Policies for pagamentos_fatura
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos de fatura" ON public.pagamentos_fatura;
CREATE POLICY "Usuários podem ver seus próprios pagamentos de fatura"
    ON public.pagamentos_fatura FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios pagamentos de fatura" ON public.pagamentos_fatura;
CREATE POLICY "Usuários podem inserir seus próprios pagamentos de fatura"
    ON public.pagamentos_fatura FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 2. Create Pagamentos Itens Vinculo table
CREATE TABLE IF NOT EXISTS public.pagamentos_itens_vinculo (
    pagamento_id UUID NOT NULL REFERENCES public.pagamentos_fatura(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.credit_card_transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor_abatido_nesta_parcela NUMERIC NOT NULL CHECK (valor_abatido_nesta_parcela > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (pagamento_id, transaction_id)
);

-- Enable RLS on pagamentos_itens_vinculo
ALTER TABLE public.pagamentos_itens_vinculo ENABLE ROW LEVEL SECURITY;

-- Policies for pagamentos_itens_vinculo
DROP POLICY IF EXISTS "Usuários podem ver seus próprios vínculos de pagamento" ON public.pagamentos_itens_vinculo;
CREATE POLICY "Usuários podem ver seus próprios vínculos de pagamento"
    ON public.pagamentos_itens_vinculo FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios vínculos de pagamento" ON public.pagamentos_itens_vinculo;
CREATE POLICY "Usuários podem inserir seus próprios vínculos de pagamento"
    ON public.pagamentos_itens_vinculo FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Drop old trigger to prevent double-restoring limits
DROP TRIGGER IF EXISTS trg_invoice_payment_limit_sync ON public.credit_card_invoices;


-- 4. Trigger to update available_limit and invoice status when a payment is inserted
CREATE OR REPLACE FUNCTION trg_after_payment_item_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_card_id UUID;
    v_invoice_id UUID;
    v_unpaid_count INTEGER;
BEGIN
    -- Find card and invoice for this transaction
    SELECT i.card_id, t.invoice_id INTO v_card_id, v_invoice_id
    FROM public.credit_card_transactions t
    JOIN public.credit_card_invoices i ON t.invoice_id = i.id
    WHERE t.id = NEW.transaction_id;

    -- Add the payment amount to the card's available_limit
    UPDATE public.credit_cards
    SET available_limit = LEAST(total_limit, available_limit + NEW.valor_abatido_nesta_parcela)
    WHERE id = v_card_id;

    -- Check if all transactions in this invoice are now fully paid
    SELECT COUNT(*) INTO v_unpaid_count
    FROM public.credit_card_transactions t
    WHERE t.invoice_id = v_invoice_id
      AND t.is_recurring = false
      AND (
          SELECT COALESCE(SUM(v.valor_abatido_nesta_parcela), 0)
          FROM public.pagamentos_itens_vinculo v
          WHERE v.transaction_id = t.id
      ) < t.amount;

    -- If all are fully paid, set invoice status to 'paid'
    IF v_unpaid_count = 0 THEN
        UPDATE public.credit_card_invoices
        SET status = 'paid'
        WHERE id = v_invoice_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_item_inserted ON public.pagamentos_itens_vinculo;
CREATE TRIGGER trg_payment_item_inserted
AFTER INSERT ON public.pagamentos_itens_vinculo
FOR EACH ROW EXECUTE FUNCTION trg_after_payment_item_insert();


-- 5. Trigger to subtract from limit if a payment link is deleted
CREATE OR REPLACE FUNCTION trg_after_payment_item_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_card_id UUID;
    v_invoice_id UUID;
BEGIN
    SELECT i.card_id, t.invoice_id INTO v_card_id, v_invoice_id
    FROM public.credit_card_transactions t
    JOIN public.credit_card_invoices i ON t.invoice_id = i.id
    WHERE t.id = OLD.transaction_id;

    -- Subtract from available_limit
    UPDATE public.credit_cards
    SET available_limit = GREATEST(0, available_limit - OLD.valor_abatido_nesta_parcela)
    WHERE id = v_card_id;

    -- Reopen invoice if it was paid
    UPDATE public.credit_card_invoices
    SET status = 'open'
    WHERE id = v_invoice_id AND status = 'paid';

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_item_deleted ON public.pagamentos_itens_vinculo;
CREATE TRIGGER trg_payment_item_deleted
AFTER DELETE ON public.pagamentos_itens_vinculo
FOR EACH ROW EXECUTE FUNCTION trg_after_payment_item_delete();


-- 6. Trigger to automatically debit account balance when paid with 'Saldo'
CREATE OR REPLACE FUNCTION trg_after_pagamento_fatura_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_card_name TEXT;
BEGIN
    IF NEW.metodo_pagamento = 'Saldo' OR NEW.metodo_pagamento = 'Saldo da Conta' THEN
        -- Find the card name associated with this payment session
        SELECT DISTINCT c.name INTO v_card_name
        FROM public.pagamentos_itens_vinculo v
        JOIN public.credit_card_transactions t ON t.id = v.transaction_id
        JOIN public.credit_card_invoices i ON i.id = t.invoice_id
        JOIN public.credit_cards c ON c.id = i.card_id
        WHERE v.pagamento_id = NEW.id
        LIMIT 1;

        IF v_card_name IS NULL THEN
            v_card_name := 'Cartão de Crédito';
        END IF;

        -- Insert expense transaction
        INSERT INTO public.transactions (
            user_id, tipo, descricao, valor, categoria, data, pago
        ) VALUES (
            NEW.user_id,
            'despesa',
            'Pagamento Fatura - ' || v_card_name,
            NEW.valor_pago,
            'Contas Fixas',
            CURRENT_DATE,
            true
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pagamento_fatura_inserted ON public.pagamentos_fatura;
CREATE TRIGGER trg_pagamento_fatura_inserted
AFTER INSERT ON public.pagamentos_fatura
FOR EACH ROW EXECUTE FUNCTION trg_after_pagamento_fatura_insert();


-- 7. Trigger to prevent card deletion if it has unpaid transactions
CREATE OR REPLACE FUNCTION trg_prevent_card_deletion_if_unpaid()
RETURNS TRIGGER AS $$
DECLARE
    v_unpaid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_unpaid_count
    FROM public.credit_card_invoices i
    JOIN public.credit_card_transactions t ON t.invoice_id = i.id
    WHERE i.card_id = OLD.id
      AND i.status <> 'paid'
      AND t.is_recurring = false
      AND (
          SELECT COALESCE(SUM(v.valor_abatido_nesta_parcela), 0)
          FROM public.pagamentos_itens_vinculo v
          WHERE v.transaction_id = t.id
      ) < t.amount;
      
    IF v_unpaid_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir o cartão "%" pois ele possui faturas ou parcelas pendentes de pagamento. Por favor, quite todas as faturas antes de remover o cartão.', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_card_delete ON public.credit_cards;
CREATE TRIGGER trg_prevent_card_delete
BEFORE DELETE ON public.credit_cards
FOR EACH ROW EXECUTE FUNCTION trg_prevent_card_deletion_if_unpaid();


-- 8. RPC: Selective Payments
CREATE OR REPLACE FUNCTION public.pay_selected_transactions_v2(
    p_transaction_ids UUID[],
    p_amounts NUMERIC[],
    p_metodo_pagamento TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_pagamento_id UUID;
    v_total_paid NUMERIC := 0;
    v_i INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Calculate total amount
    FOR v_i IN 1..array_length(p_amounts, 1) LOOP
        v_total_paid := v_total_paid + p_amounts[v_i];
    END LOOP;

    IF v_total_paid <= 0 THEN
        RAISE EXCEPTION 'O valor do pagamento deve ser maior que zero';
    END IF;

    -- Create payment record
    INSERT INTO public.pagamentos_fatura (user_id, valor_pago, metodo_pagamento)
    VALUES (v_user_id, v_total_paid, p_metodo_pagamento)
    RETURNING id INTO v_pagamento_id;

    -- Insert links (triggers will sync limit & check invoice completion)
    FOR v_i IN 1..array_length(p_transaction_ids, 1) LOOP
        INSERT INTO public.pagamentos_itens_vinculo (pagamento_id, user_id, transaction_id, valor_abatido_nesta_parcela)
        VALUES (v_pagamento_id, v_user_id, p_transaction_ids[v_i], p_amounts[v_i]);
    END LOOP;

    RETURN v_pagamento_id;
END;
$$ LANGUAGE plpgsql;


-- 9. RPC: Pay entire invoice in one go
CREATE OR REPLACE FUNCTION public.pay_entire_invoice_v2(
    p_invoice_id UUID,
    p_metodo_pagamento TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_pagamento_id UUID;
    v_total_paid NUMERIC := 0;
    r_tx RECORD;
    v_remaining NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Calculate total remaining
    FOR r_tx IN 
        SELECT t.id, t.amount, COALESCE(SUM(v.valor_abatido_nesta_parcela), 0) as paid
        FROM public.credit_card_transactions t
        LEFT JOIN public.pagamentos_itens_vinculo v ON v.transaction_id = t.id
        WHERE t.invoice_id = p_invoice_id AND t.is_recurring = false
        GROUP BY t.id, t.amount
    LOOP
        v_remaining := r_tx.amount - r_tx.paid;
        IF v_remaining > 0 THEN
            v_total_paid := v_total_paid + v_remaining;
        END IF;
    END LOOP;

    IF v_total_paid <= 0 THEN
        RAISE EXCEPTION 'A fatura já está totalmente paga.';
    END IF;

    -- Create payment record
    INSERT INTO public.pagamentos_fatura (user_id, valor_pago, metodo_pagamento)
    VALUES (v_user_id, v_total_paid, p_metodo_pagamento)
    RETURNING id INTO v_pagamento_id;

    -- Insert links
    FOR r_tx IN 
        SELECT t.id, t.amount, COALESCE(SUM(v.valor_abatido_nesta_parcela), 0) as paid
        FROM public.credit_card_transactions t
        LEFT JOIN public.pagamentos_itens_vinculo v ON v.transaction_id = t.id
        WHERE t.invoice_id = p_invoice_id AND t.is_recurring = false
        GROUP BY t.id, t.amount
    LOOP
        v_remaining := r_tx.amount - r_tx.paid;
        IF v_remaining > 0 THEN
            INSERT INTO public.pagamentos_itens_vinculo (pagamento_id, user_id, transaction_id, valor_abatido_nesta_parcela)
            VALUES (v_pagamento_id, v_user_id, r_tx.id, v_remaining);
        END IF;
    END LOOP;

    RETURN v_pagamento_id;
END;
$$ LANGUAGE plpgsql;


-- 10. RPC: Pay custom amount via FIFO
CREATE OR REPLACE FUNCTION public.pay_custom_amount_fifo_v2(
    p_card_id UUID,
    p_amount NUMERIC,
    p_metodo_pagamento TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_pagamento_id UUID;
    v_remaining_payment NUMERIC := p_amount;
    r_tx RECORD;
    v_tx_remaining NUMERIC;
    v_amount_to_pay NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'O valor do pagamento deve ser maior que zero';
    END IF;

    -- Create payment record
    INSERT INTO public.pagamentos_fatura (user_id, valor_pago, metodo_pagamento)
    VALUES (v_user_id, p_amount, p_metodo_pagamento)
    RETURNING id INTO v_pagamento_id;

    -- Loop through all unpaid transactions for this card, oldest first
    FOR r_tx IN 
        SELECT t.id, t.amount, COALESCE(SUM(v.valor_abatido_nesta_parcela), 0) as paid
        FROM public.credit_card_transactions t
        JOIN public.credit_card_invoices i ON t.invoice_id = i.id
        LEFT JOIN public.pagamentos_itens_vinculo v ON v.transaction_id = t.id
        WHERE i.card_id = p_card_id AND t.is_recurring = false
        GROUP BY t.id, t.amount, t.purchase_date, t.created_at
        HAVING COALESCE(SUM(v.valor_abatido_nesta_parcela), 0) < t.amount
        ORDER BY t.purchase_date ASC, t.created_at ASC
    LOOP
        EXIT WHEN v_remaining_payment <= 0;

        v_tx_remaining := r_tx.amount - r_tx.paid;
        v_amount_to_pay := LEAST(v_remaining_payment, v_tx_remaining);

        INSERT INTO public.pagamentos_itens_vinculo (pagamento_id, user_id, transaction_id, valor_abatido_nesta_parcela)
        VALUES (v_pagamento_id, v_user_id, r_tx.id, v_amount_to_pay);

        v_remaining_payment := v_remaining_payment - v_amount_to_pay;
    END LOOP;

    RETURN v_pagamento_id;
END;
$$ LANGUAGE plpgsql;

-- 11. RPC: Delete payment and restore limit (cascade triggers handle the logic)
CREATE OR REPLACE FUNCTION public.delete_credit_card_payment_v2(p_payment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    DELETE FROM public.pagamentos_fatura
    WHERE id = p_payment_id AND user_id = v_user_id;
END;
$$;

-- 12. RLS DELETE Policies
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos de fatura" ON public.pagamentos_fatura;
CREATE POLICY "Usuários podem deletar seus próprios pagamentos de fatura"
    ON public.pagamentos_fatura FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios vínculos de pagamento" ON public.pagamentos_itens_vinculo;
CREATE POLICY "Usuários podem deletar seus próprios vínculos de pagamento"
    ON public.pagamentos_itens_vinculo FOR DELETE USING (auth.uid() = user_id);

