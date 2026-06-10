-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Credit Cards table
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#3B82F6',
    total_limit NUMERIC NOT NULL CHECK (total_limit >= 0),
    available_limit NUMERIC NOT NULL CHECK (available_limit >= 0),
    closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on credit_cards
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Policies for credit_cards
DROP POLICY IF EXISTS "Usuários podem ver seus próprios cartões" ON public.credit_cards;
CREATE POLICY "Usuários podem ver seus próprios cartões"
    ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios cartões" ON public.credit_cards;
CREATE POLICY "Usuários podem inserir seus próprios cartões"
    ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios cartões" ON public.credit_cards;
CREATE POLICY "Usuários podem atualizar seus próprios cartões"
    ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios cartões" ON public.credit_cards;
CREATE POLICY "Usuários podem deletar seus próprios cartões"
    ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);


-- 2. Create Credit Card Invoices table
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'paid', 'overdue')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(card_id, month, year)
);

-- Enable RLS on credit_card_invoices
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

-- Policies for credit_card_invoices
DROP POLICY IF EXISTS "Usuários podem ver suas próprias faturas" ON public.credit_card_invoices;
CREATE POLICY "Usuários podem ver suas próprias faturas"
    ON public.credit_card_invoices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias faturas" ON public.credit_card_invoices;
CREATE POLICY "Usuários podem inserir suas próprias faturas"
    ON public.credit_card_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias faturas" ON public.credit_card_invoices;
CREATE POLICY "Usuários podem atualizar suas próprias faturas"
    ON public.credit_card_invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias faturas" ON public.credit_card_invoices;
CREATE POLICY "Usuários podem deletar suas próprias faturas"
    ON public.credit_card_invoices FOR DELETE USING (auth.uid() = user_id);


-- 3. Create Credit Card Transactions table
CREATE TABLE IF NOT EXISTS public.credit_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.credit_card_invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    purchase_date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    current_installment INTEGER NOT NULL DEFAULT 1,
    total_installments INTEGER NOT NULL DEFAULT 1 CHECK (total_installments >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on credit_card_transactions
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for credit_card_transactions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações de cartão" ON public.credit_card_transactions;
CREATE POLICY "Usuários podem ver suas próprias transações de cartão"
    ON public.credit_card_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações de cartão" ON public.credit_card_transactions;
CREATE POLICY "Usuários podem inserir suas próprias transações de cartão"
    ON public.credit_card_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações de cartão" ON public.credit_card_transactions;
CREATE POLICY "Usuários podem atualizar suas próprias transações de cartão"
    ON public.credit_card_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias transações de cartão" ON public.credit_card_transactions;
CREATE POLICY "Usuários podem deletar suas próprias transações de cartão"
    ON public.credit_card_transactions FOR DELETE USING (auth.uid() = user_id);


-- 4. Trigger to automatically recalculate invoice total_amount
CREATE OR REPLACE FUNCTION trg_recalculate_invoice_total_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_total
    FROM public.credit_card_transactions
    WHERE invoice_id = v_invoice_id;

    UPDATE public.credit_card_invoices
    SET total_amount = v_total
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_invoice_total ON public.credit_card_transactions;
CREATE TRIGGER trg_recalculate_invoice_total
AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_transactions
FOR EACH ROW EXECUTE FUNCTION trg_recalculate_invoice_total_amount();


-- 5. Trigger to update available_limit on credit card
CREATE OR REPLACE FUNCTION trg_update_card_available_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_card_id UUID;
    v_status TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT card_id, status INTO v_card_id, v_status FROM public.credit_card_invoices WHERE id = NEW.invoice_id;
        IF v_status <> 'paid' AND NEW.is_recurring = false THEN
            UPDATE public.credit_cards
            SET available_limit = GREATEST(0, available_limit - NEW.amount)
            WHERE id = v_card_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT card_id, status INTO v_card_id, v_status FROM public.credit_card_invoices WHERE id = OLD.invoice_id;
        IF v_status <> 'paid' AND OLD.is_recurring = false THEN
            UPDATE public.credit_cards
            SET available_limit = LEAST(total_limit, available_limit + OLD.amount)
            WHERE id = v_card_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revert OLD if it wasn't recurring
        SELECT card_id, status INTO v_card_id, v_status FROM public.credit_card_invoices WHERE id = OLD.invoice_id;
        IF v_status <> 'paid' AND OLD.is_recurring = false THEN
            UPDATE public.credit_cards
            SET available_limit = LEAST(total_limit, available_limit + OLD.amount)
            WHERE id = v_card_id;
        END IF;
        
        -- Apply NEW if it isn't recurring
        SELECT card_id, status INTO v_card_id, v_status FROM public.credit_card_invoices WHERE id = NEW.invoice_id;
        IF v_status <> 'paid' AND NEW.is_recurring = false THEN
            UPDATE public.credit_cards
            SET available_limit = GREATEST(0, available_limit - NEW.amount)
            WHERE id = v_card_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_card_limit_sync ON public.credit_card_transactions;
CREATE TRIGGER trg_card_limit_sync
AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_transactions
FOR EACH ROW EXECUTE FUNCTION trg_update_card_available_limit();


-- 6. Trigger to restore limit when an invoice is marked as paid
CREATE OR REPLACE FUNCTION trg_update_card_limit_on_invoice_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_amount_to_restore NUMERIC;
BEGIN
    -- If status changed to 'paid'
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
        SELECT COALESCE(SUM(amount), 0.00) INTO v_amount_to_restore
        FROM public.credit_card_transactions
        WHERE invoice_id = NEW.id AND is_recurring = false;
        
        UPDATE public.credit_cards
        SET available_limit = LEAST(total_limit, available_limit + v_amount_to_restore)
        WHERE id = NEW.card_id;
        
    -- If status changed FROM 'paid' (reopened)
    ELSIF OLD.status = 'paid' AND NEW.status <> 'paid' THEN
        SELECT COALESCE(SUM(amount), 0.00) INTO v_amount_to_restore
        FROM public.credit_card_transactions
        WHERE invoice_id = NEW.id AND is_recurring = false;
        
        UPDATE public.credit_cards
        SET available_limit = GREATEST(0, available_limit - v_amount_to_restore)
        WHERE id = NEW.card_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_payment_limit_sync ON public.credit_card_invoices;
CREATE TRIGGER trg_invoice_payment_limit_sync
AFTER UPDATE ON public.credit_card_invoices
FOR EACH ROW EXECUTE FUNCTION trg_update_card_limit_on_invoice_payment();


-- 7. Helper: Get Routed Period (Closing day logic)
CREATE OR REPLACE FUNCTION public.get_routed_period(
    p_card_id UUID,
    p_purchase_date DATE,
    OUT r_month INTEGER,
    OUT r_year INTEGER
) AS $$
DECLARE
    v_closing_day INTEGER;
    v_p_day INTEGER;
    v_p_month INTEGER;
    v_p_year INTEGER;
BEGIN
    SELECT closing_day INTO v_closing_day FROM public.credit_cards WHERE id = p_card_id;
    
    v_p_day := EXTRACT(DAY FROM p_purchase_date);
    v_p_month := EXTRACT(MONTH FROM p_purchase_date);
    v_p_year := EXTRACT(YEAR FROM p_purchase_date);
    
    IF v_p_day >= v_closing_day THEN
        v_p_month := v_p_month + 1;
        IF v_p_month > 12 THEN
            v_p_month := 1;
            v_p_year := v_p_year + 1;
        END IF;
    END IF;
    
    r_month := v_p_month;
    r_year := v_p_year;
END;
$$ LANGUAGE plpgsql;


-- 8. RPC: Get or Create Invoice with Auto-Recurring copy
CREATE OR REPLACE FUNCTION public.get_or_create_invoice(
    p_card_id UUID,
    p_user_id UUID,
    p_month INTEGER,
    p_year INTEGER
) RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_last_invoice_id UUID;
BEGIN
    -- Check if invoice exists
    SELECT id INTO v_invoice_id
    FROM public.credit_card_invoices
    WHERE card_id = p_card_id AND month = p_month AND year = p_year;

    IF v_invoice_id IS NULL THEN
        -- Create invoice
        INSERT INTO public.credit_card_invoices (card_id, user_id, month, year, status)
        VALUES (p_card_id, p_user_id, p_month, p_year, 'open')
        RETURNING id INTO v_invoice_id;

        -- Get most recent invoice before this one
        SELECT id INTO v_last_invoice_id
        FROM public.credit_card_invoices
        WHERE card_id = p_card_id
          AND (year < p_year OR (year = p_year AND month < p_month))
        ORDER BY year DESC, month DESC
        LIMIT 1;

        -- Copy recurring transactions from that invoice
        IF v_last_invoice_id IS NOT NULL THEN
            INSERT INTO public.credit_card_transactions (
                invoice_id, user_id, description, category, amount, purchase_date, is_recurring, current_installment, total_installments
            )
            SELECT
                v_invoice_id, user_id, description, category, amount, MAKE_DATE(p_year, p_month, 1), true, 1, 1
            FROM public.credit_card_transactions
            WHERE invoice_id = v_last_invoice_id AND is_recurring = true;
        END IF;
    END IF;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;


-- 9. RPC: Atomic Transaction and Spreader Creator
CREATE OR REPLACE FUNCTION public.create_credit_card_transaction_v2(
    p_card_id UUID,
    p_description TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_purchase_date DATE,
    p_is_recurring BOOLEAN,
    p_total_installments INTEGER
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_avail_limit NUMERIC;
    v_routed_month INTEGER;
    v_routed_year INTEGER;
    v_invoice_id UUID;
    v_inst_amount NUMERIC;
    v_last_inst_amount NUMERIC;
    v_curr_month INTEGER;
    v_curr_year INTEGER;
    v_i INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Verify card ownership and get current limit
    SELECT available_limit INTO v_avail_limit
    FROM public.credit_cards
    WHERE id = p_card_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cartão não encontrado';
    END IF;

    -- Check limit if not recurring
    IF NOT p_is_recurring AND v_avail_limit < p_amount THEN
        RAISE EXCEPTION 'Limite insuficiente. Disponível: R$ %', v_avail_limit;
    END IF;

    -- Calculate initial routing month and year
    SELECT r_month, r_year INTO v_routed_month, v_routed_year
    FROM public.get_routed_period(p_card_id, p_purchase_date);

    IF p_is_recurring THEN
        -- Insert a single recurring transaction
        v_invoice_id := public.get_or_create_invoice(p_card_id, v_user_id, v_routed_month, v_routed_year);
        INSERT INTO public.credit_card_transactions (
            invoice_id, user_id, description, category, amount, purchase_date, is_recurring, current_installment, total_installments
        ) VALUES (
            v_invoice_id, v_user_id, p_description, p_category, p_amount, p_purchase_date, true, 1, 1
        );
    ELSE
        IF p_total_installments <= 1 THEN
            -- Insert single transaction
            v_invoice_id := public.get_or_create_invoice(p_card_id, v_user_id, v_routed_month, v_routed_year);
            INSERT INTO public.credit_card_transactions (
                invoice_id, user_id, description, category, amount, purchase_date, is_recurring, current_installment, total_installments
            ) VALUES (
                v_invoice_id, v_user_id, p_description, p_category, p_amount, p_purchase_date, false, 1, 1
            );
        ELSE
            -- Installments spread logic
            v_inst_amount := ROUND(p_amount / p_total_installments, 2);
            v_last_inst_amount := p_amount - (v_inst_amount * (p_total_installments - 1));

            FOR v_i IN 1..p_total_installments LOOP
                v_curr_month := v_routed_month + v_i - 1;
                v_curr_year := v_routed_year;
                
                WHILE v_curr_month > 12 LOOP
                    v_curr_month := v_curr_month - 12;
                    v_curr_year := v_curr_year + 1;
                END LOOP;

                v_invoice_id := public.get_or_create_invoice(p_card_id, v_user_id, v_curr_month, v_curr_year);

                DECLARE
                    v_amt NUMERIC;
                BEGIN
                    IF v_i = p_total_installments THEN
                        v_amt := v_last_inst_amount;
                    ELSE
                        v_amt := v_inst_amount;
                    END IF;

                    INSERT INTO public.credit_card_transactions (
                        invoice_id, user_id, description, category, amount, purchase_date, is_recurring, current_installment, total_installments
                    ) VALUES (
                        v_invoice_id, v_user_id, p_description, p_category, v_amt, p_purchase_date, false, v_i, p_total_installments
                    );
                END;
            END LOOP;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 10. RPC: Ensure Future Invoices Range (and populate recurring charges)
CREATE OR REPLACE FUNCTION public.ensure_future_invoices(p_months_ahead INTEGER)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_card RECORD;
    v_i INTEGER;
    v_curr_month INTEGER;
    v_curr_year INTEGER;
    v_now_month INTEGER;
    v_now_year INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    v_now_month := EXTRACT(MONTH FROM CURRENT_DATE);
    v_now_year := EXTRACT(YEAR FROM CURRENT_DATE);

    FOR v_card IN SELECT id FROM public.credit_cards WHERE user_id = v_user_id LOOP
        FOR v_i IN 0..p_months_ahead LOOP
            v_curr_month := v_now_month + v_i;
            v_curr_year := v_now_year;
            
            WHILE v_curr_month > 12 LOOP
                v_curr_month := v_curr_month - 12;
                v_curr_year := v_curr_year + 1;
            END LOOP;

            -- Automatically create invoice and carry over active recurring costs
            PERFORM public.get_or_create_invoice(v_card.id, v_user_id, v_curr_month, v_curr_year);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
