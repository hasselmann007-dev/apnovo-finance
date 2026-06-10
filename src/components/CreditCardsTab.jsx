import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CreditCard, Plus, Trash2, Calendar, DollarSign, Check, 
  AlertCircle, X, ChevronRight, Info, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';

export default function CreditCardsTab({ session, showSensitiveData = true }) {
  const [cards, setCards] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceTransactions, setInvoiceTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Histórico de pagamentos
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  // Pagamento seletivo & FIFO
  const [checkedTxIds, setCheckedTxIds] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('selected'); // 'selected', 'entire', 'fifo'
  const [paymentMethod, setPaymentMethod] = useState('Saldo da Conta');
  const [fifoAmount, setFifoAmount] = useState('');
  const [receipt, setReceipt] = useState(null); // { id, total, method, items: [] }

  // Form Novo Cartão
  const [cardForm, setCardForm] = useState({
    name: '',
    color_hex: '#2563EB',
    total_limit: '',
    closing_day: 5,
    due_day: 15
  });

  // Form Nova Transação
  const [txForm, setTxForm] = useState({
    description: '',
    category: 'Outros',
    amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    is_installment: false,
    total_installments: 2
  });

  const presetColors = [
    { name: 'Azul Safira', hex: '#2563EB' },
    { name: 'Verde Esmeralda', hex: '#059669' },
    { name: 'Rosa Rubi', hex: '#E11D48' },
    { name: 'Roxo Violeta', hex: '#7C3AED' },
    { name: 'Laranja Âmbar', hex: '#D97706' },
    { name: 'Preto Carvão', hex: '#1E293B' }
  ];

  const categories = [
    'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 
    'Serviços/Assinaturas', 'Moradia', 'Vestuário', 'Outros'
  ];

  useEffect(() => {
    initData();
  }, []);

  // Recarrega faturas e transações sempre que o cartão selecionado mudar
  useEffect(() => {
    if (selectedCard) {
      fetchInvoices(selectedCard.id);
      setCheckedTxIds([]);
    } else {
      setInvoices([]);
      setSelectedInvoice(null);
      setInvoiceTransactions([]);
      setCheckedTxIds([]);
    }
  }, [selectedCard]);

  // Recarrega transações e pagamentos quando a fatura selecionada mudar
  useEffect(() => {
    if (selectedInvoice) {
      fetchTransactions(selectedInvoice.id);
      fetchInvoicePayments(selectedInvoice.id);
      setCheckedTxIds([]);
    } else {
      setInvoiceTransactions([]);
      setInvoicePayments([]);
      setCheckedTxIds([]);
    }
  }, [selectedInvoice]);

  // Eventos para acionamento a partir do Botão de Comandos Rápidos
  useEffect(() => {
    const handleLancarGasto = () => {
      if (selectedCard) {
        setIsTxModalOpen(true);
      } else {
        alert('Por favor, selecione ou crie um cartão de crédito primeiro.');
      }
    };
    
    const handlePagarFatura = () => {
      if (selectedInvoice) {
        if (selectedInvoice.status === 'paid') {
          alert('Esta fatura já está paga.');
          return;
        }
        setPaymentType('entire');
        setIsPaymentModalOpen(true);
      } else {
        alert('Nenhuma fatura selecionada para pagamento.');
      }
    };

    window.addEventListener('open-lancar-gasto', handleLancarGasto);
    window.addEventListener('open-pagar-fatura', handlePagarFatura);
    
    return () => {
      window.removeEventListener('open-lancar-gasto', handleLancarGasto);
      window.removeEventListener('open-pagar-fatura', handlePagarFatura);
    };
  }, [selectedCard, selectedInvoice]);

  const fetchInvoicePayments = async (invoiceId) => {
    try {
      const { data, error } = await supabase
        .from('pagamentos_itens_vinculo')
        .select(`
          pagamento_id,
          valor_abatido_nesta_parcela,
          pagamentos_fatura (
            id,
            data_pagamento,
            metodo_pagamento
          ),
          credit_card_transactions!inner (
            invoice_id
          )
        `)
        .eq('credit_card_transactions.invoice_id', invoiceId);

      if (error) throw error;

      // Group by payment_id
      const groups = {};
      (data || []).forEach(row => {
        const pf = row.pagamentos_fatura;
        if (!pf) return;
        if (!groups[pf.id]) {
          groups[pf.id] = {
            id: pf.id,
            data_pagamento: pf.data_pagamento,
            metodo_pagamento: pf.metodo_pagamento,
            valor_pago: 0
          };
        }
        groups[pf.id].valor_pago += Number(row.valor_abatido_nesta_parcela);
      });

      const list = Object.values(groups).sort((a, b) => new Date(b.data_pagamento) - new Date(a.data_pagamento));
      setInvoicePayments(list);
    } catch (err) {
      console.error('Erro ao buscar historico de pagamentos:', err);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Deseja realmente estornar este pagamento? O limite do cartão será atualizado e o saldo correspondente será ajustado.')) return;

    setDeletingPaymentId(paymentId);
    try {
      const start = Date.now();

      const { error } = await supabase.rpc('delete_credit_card_payment_v2', {
        p_payment_id: paymentId
      });

      if (error) throw error;

      const elapsed = Date.now() - start;
      if (elapsed < 600) {
        await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
      }

      // Optimistic visual update
      setInvoicePayments(prev => prev.filter(p => p.id !== paymentId));
      alert("Pagamento estornado com sucesso. O limite do cartão foi atualizado.");

      // Refresh
      await initData();
      if (selectedCard) {
        await fetchInvoices(selectedCard.id);
      }
      if (selectedInvoice) {
        await fetchTransactions(selectedInvoice.id);
        await fetchInvoicePayments(selectedInvoice.id);
      }
    } catch (err) {
      console.error('Erro ao estornar pagamento:', err);
      alert(err.message || 'Erro ao estornar o pagamento.');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const initData = async () => {
    setLoading(true);
    try {
      // 1. Garantir faturas para os próximos 3 meses
      await supabase.rpc('ensure_future_invoices', { p_months_ahead: 3 });

      // 2. Buscar cartões
      const { data: cardsData, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;

      setCards(cardsData || []);
      if (cardsData && cardsData.length > 0) {
        setSelectedCard(prev => {
          const exists = cardsData.find(c => c.id === prev?.id);
          return exists || cardsData[0];
        });
      } else {
        setSelectedCard(null);
      }
    } catch (err) {
      console.error('Erro ao inicializar cartões:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (cardId) => {
    try {
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .select('*')
        .eq('card_id', cardId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;

      setInvoices(data || []);
      if (data && data.length > 0) {
        setSelectedInvoice(prev => {
          if (prev) {
            const updated = data.find(i => i.id === prev.id);
            if (updated) return updated;
          }
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          return data.find(i => i.month === currentMonth && i.year === currentYear) || data[0];
        });
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
    }
  };

  const fetchTransactions = async (invoiceId) => {
    try {
      // 1. Buscar transações
      const { data: txs, error: txsError } = await supabase
        .from('credit_card_transactions')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('purchase_date', { ascending: false });

      if (txsError) throw txsError;

      if (!txs || txs.length === 0) {
        setInvoiceTransactions([]);
        return;
      }

      // 2. Buscar todos os vínculos de pagamentos destas transações
      const txIds = txs.map(t => t.id);
      const { data: links, error: linksError } = await supabase
        .from('pagamentos_itens_vinculo')
        .select('transaction_id, valor_abatido_nesta_parcela')
        .in('transaction_id', txIds);

      if (linksError) throw linksError;

      // 3. Mapear valores quitados
      const mappedTxs = txs.map(tx => {
        const txLinks = (links || []).filter(l => l.transaction_id === tx.id);
        const paid = txLinks.reduce((sum, l) => sum + Number(l.valor_abatido_nesta_parcela), 0);
        return {
          ...tx,
          paid,
          remaining: tx.amount - paid
        };
      });

      setInvoiceTransactions(mappedTxs);
    } catch (err) {
      console.error('Erro ao buscar transações da fatura:', err);
    }
  };

  // Cadastra um novo cartão
  const handleCreateCard = async (e) => {
    e.preventDefault();
    const limit = parseFloat(cardForm.total_limit);
    if (!cardForm.name || isNaN(limit) || limit <= 0) {
      alert('Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: session.user.id,
          name: cardForm.name,
          color_hex: cardForm.color_hex,
          total_limit: limit,
          available_limit: limit,
          closing_day: parseInt(cardForm.closing_day),
          due_day: parseInt(cardForm.due_day)
        })
        .select()
        .single();

      if (error) throw error;

      setCards([...cards, data]);
      setSelectedCard(data);
      setIsCardModalOpen(false);
      setCardForm({
        name: '',
        color_hex: '#2563EB',
        total_limit: '',
        closing_day: 5,
        due_day: 15
      });
      await supabase.rpc('ensure_future_invoices', { p_months_ahead: 3 });
    } catch (err) {
      console.error('Erro ao criar cartão:', err);
      alert('Erro ao criar cartão.');
    }
  };

  // Cadastra uma nova despesa
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    const amount = parseFloat(txForm.amount);
    if (!txForm.description || isNaN(amount) || amount <= 0 || !selectedCard) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const installments = txForm.is_installment ? parseInt(txForm.total_installments) : 1;
      
      const { error } = await supabase.rpc('create_credit_card_transaction_v2', {
        p_card_id: selectedCard.id,
        p_description: txForm.description,
        p_category: txForm.category,
        p_amount: amount,
        p_purchase_date: txForm.purchase_date,
        p_is_recurring: txForm.is_recurring,
        p_total_installments: installments
      });

      if (error) throw error;

      setTxForm({
        description: '',
        category: 'Outros',
        amount: '',
        purchase_date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        is_installment: false,
        total_installments: 2
      });
      setIsTxModalOpen(false);

      await initData();
      if (selectedCard) {
        await fetchInvoices(selectedCard.id);
      }
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      alert(err.message || 'Erro ao processar compra no cartão de crédito.');
    }
  };

  // Exclui uma transação individual
  const handleDeleteTransaction = async (tx) => {
    if (!confirm('Deseja excluir este gasto? O limite correspondente será restabelecido proporcionalmente.')) return;

    try {
      const { error } = await supabase
        .from('credit_card_transactions')
        .delete()
        .eq('id', tx.id);

      if (error) throw error;

      await initData();
      if (selectedCard) {
        await fetchInvoices(selectedCard.id);
      }
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
      alert('Erro ao excluir a transação.');
    }
  };

  // Exclui um cartão de crédito
  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    if (!confirm(`Deseja realmente remover o cartão "${selectedCard.name}"? Esta ação é irreversível.`)) return;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', selectedCard.id);

      if (error) {
        // Exibir erro amigável em PT-BR lançado pelo Trigger
        alert(error.message || 'Não foi possível excluir o cartão.');
        return;
      }

      setSelectedCard(null);
      await initData();
    } catch (err) {
      console.error('Erro ao deletar cartão:', err);
      alert('Ocorreu um erro ao excluir o cartão.');
    }
  };

  // Processa o Pagamento de Fatura (Selecionados, Inteira, FIFO)
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;

    try {
      let paymentId = null;
      let totalAmountPaid = 0;

      if (paymentType === 'selected') {
        const selectedTransactions = invoiceTransactions.filter(t => checkedTxIds.includes(t.id));
        const ids = selectedTransactions.map(t => t.id);
        const amounts = selectedTransactions.map(t => t.remaining);
        totalAmountPaid = amounts.reduce((sum, a) => sum + a, 0);

        if (ids.length === 0) {
          alert('Nenhuma compra selecionada para pagamento.');
          return;
        }

        const { data, error } = await supabase.rpc('pay_selected_transactions_v2', {
          p_transaction_ids: ids,
          p_amounts: amounts,
          p_metodo_pagamento: paymentMethod === 'Saldo da Conta' ? 'Saldo' : paymentMethod
        });
        if (error) throw error;
        paymentId = data;
      } else if (paymentType === 'entire') {
        if (!selectedInvoice) return;
        
        totalAmountPaid = invoiceTransactions
          .filter(t => !t.is_recurring)
          .reduce((sum, t) => sum + t.remaining, 0);

        const { data, error } = await supabase.rpc('pay_entire_invoice_v2', {
          p_invoice_id: selectedInvoice.id,
          p_metodo_pagamento: paymentMethod === 'Saldo da Conta' ? 'Saldo' : paymentMethod
        });
        if (error) throw error;
        paymentId = data;
      } else if (paymentType === 'fifo') {
        const amount = parseFloat(fifoAmount);
        if (isNaN(amount) || amount <= 0) {
          alert('Digite um valor válido maior que zero.');
          return;
        }
        totalAmountPaid = amount;

        const { data, error } = await supabase.rpc('pay_custom_amount_fifo_v2', {
          p_card_id: selectedCard.id,
          p_amount: amount,
          p_metodo_pagamento: paymentMethod === 'Saldo da Conta' ? 'Saldo' : paymentMethod
        });
        if (error) throw error;
        paymentId = data;
      }

      if (paymentId) {
        // Buscar detalhes do vínculo para o recibo
        const { data: links, error: linksError } = await supabase
          .from('pagamentos_itens_vinculo')
          .select('valor_abatido_nesta_parcela, transaction_id')
          .eq('pagamento_id', paymentId);

        if (linksError) throw linksError;

        const txIds = links.map(l => l.transaction_id);
        const { data: txs, error: txsError } = await supabase
          .from('credit_card_transactions')
          .select('id, description')
          .in('id', txIds);

        if (txsError) throw txsError;

        const items = (links || []).map(link => {
          const tx = txs.find(t => t.id === link.transaction_id);
          return {
            description: tx ? tx.description : 'Compra',
            amountPaid: link.valor_abatido_nesta_parcela
          };
        });

        // Abrir Recibo
        setReceipt({
          id: paymentId,
          total: totalAmountPaid,
          method: paymentMethod,
          items
        });

        setIsPaymentModalOpen(false);
        setCheckedTxIds([]);
        setFifoAmount('');

        // Recarregar dados
        await initData();
        if (selectedCard) {
          await fetchInvoices(selectedCard.id);
        }
        if (selectedInvoice) {
          fetchTransactions(selectedInvoice.id);
          fetchInvoicePayments(selectedInvoice.id);
        }
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      alert(err.message || 'Erro ao efetuar o pagamento.');
    }
  };

  const handleToggleCheckTx = (txId) => {
    setCheckedTxIds(prev => 
      prev.includes(txId) ? prev.filter(id => id !== txId) : [...prev, txId]
    );
  };

  const totalSelectedAmount = useMemo(() => {
    return invoiceTransactions
      .filter(t => checkedTxIds.includes(t.id))
      .reduce((sum, t) => sum + t.remaining, 0);
  }, [invoiceTransactions, checkedTxIds]);

  // Nomes dos meses em PT-BR
  const getMonthName = (monthNum) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNum - 1];
  };

  // Determinar limite utilizado
  const cardStats = useMemo(() => {
    if (!selectedCard) return { used: 0, usedPercent: 0 };
    const used = selectedCard.total_limit - selectedCard.available_limit;
    const usedPercent = Math.min(100, Math.max(0, (used / selectedCard.total_limit) * 100));
    return { used, usedPercent };
  }, [selectedCard]);

  // Mascaramento de dados sensíveis
  const formatMoney = (value) => {
    if (!showSensitiveData) return 'R$ ••••';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  if (loading && cards.length === 0) {
    return <div className="p-10 text-center font-bold text-gray-400">Carregando seus cartões...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Meus Cartões de Crédito</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">Gerencie seus limites, compras parceladas e faturas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedCard && (
            <button
              onClick={handleDeleteCard}
              className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 px-5 py-3.5 rounded-2xl font-bold transition-all"
            >
              <Trash2 size={18} /> Excluir Cartão
            </button>
          )}
          {cards.length > 0 && (
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20"
            >
              <Plus size={18} strokeWidth={3} /> Lançar Compra
            </button>
          )}
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary-650 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-primary-600/20"
          >
            <Plus size={18} strokeWidth={3} /> Novo Cartão
          </button>
        </div>
      </div>

      {/* Cartões Section */}
      {cards.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center border border-white/10 shadow-sm flex flex-col items-center">
          <div className="p-4 bg-white/5 rounded-full mb-4">
            <CreditCard size={36} className="text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-gray-400 max-w-sm mb-6">Cadastre seu primeiro cartão de crédito para acompanhar seus gastos parcelados e limite.</p>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            Adicionar Cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            const cardUsed = card.total_limit - card.available_limit;
            const cardUsedPct = (cardUsed / card.total_limit) * 100;
            
            return (
              <div 
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`cursor-pointer rounded-2xl p-6 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 shadow-md ${
                  isSelected 
                    ? 'ring-4 ring-offset-4 ring-primary-500 dark:ring-offset-slate-950' 
                    : 'hover:shadow-lg'
                }`}
                style={{ 
                  backgroundColor: card.color_hex,
                  color: '#FFFFFF' 
                }}
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute right-4 top-4 opacity-20">
                  <CreditCard size={48} />
                </div>

                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
                    Crédito
                  </span>
                  <h3 className="text-2xl font-black tracking-tight mt-3 truncate">{card.name}</h3>
                  <p className="text-[11px] opacity-80 font-mono tracking-widest mt-1">•••• •••• •••• {card.closing_day}{card.due_day}</p>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-xs font-bold opacity-90 mb-1">
                      <span>Limite Disponível</span>
                      <span>{formatMoney(card.available_limit)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, 100 - cardUsedPct))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] opacity-75 mt-1 font-bold">
                      <span>Limite Total: {formatMoney(card.total_limit)}</span>
                      <span>Usado: {cardUsedPct.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xs">
                    <div>
                      <span className="block opacity-75 text-[9px] uppercase tracking-wider font-bold">Vence Dia</span>
                      <span className="font-extrabold">{card.due_day}</span>
                    </div>
                    <div className="text-right">
                      <span className="block opacity-75 text-[9px] uppercase tracking-wider font-bold">Melhor Compra</span>
                      <span className="bg-white/20 text-white px-2 py-0.5 rounded font-black">
                        Dia {card.closing_day}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Breakdown Panel */}
      {selectedCard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Invoices Timeline Navigation (Left) */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm p-6 flex flex-col">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary-500" /> Faturas do Cartão
            </h3>
            
            {invoices.length === 0 ? (
              <div className="text-center p-6 text-gray-400 font-bold">Nenhuma fatura gerada.</div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {invoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  
                  let statusColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
                  let statusText = 'Aberta';
                  if (inv.status === 'paid') {
                    statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
                    statusText = 'Paga';
                  } else if (inv.status === 'closed') {
                    statusColor = 'bg-gray-500/10 text-gray-400 border border-gray-500/25';
                    statusText = 'Fechada';
                  } else if (inv.status === 'overdue') {
                    statusColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
                    statusText = 'Atrasada';
                  }

                  return (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between group ${
                        isSelected 
                          ? 'border-primary-500 bg-white/5' 
                          : 'border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold text-white text-sm">
                          {getMonthName(inv.month)} de {inv.year}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold mt-1">
                          Valor: {formatMoney(inv.total_amount)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${statusColor}`}>
                        {statusText}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions List inside Invoice (Right/Middle) */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col">
            {selectedInvoice ? (
              <>
                {/* Header da Fatura */}
                <div className="p-6 border-b border-white/5 bg-white/2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Detalhamento da Fatura
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      {getMonthName(selectedInvoice.month)} de {selectedInvoice.year}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                      <span className="text-2xl font-black text-white">
                        {formatMoney(selectedInvoice.total_amount)}
                      </span>
                    </div>

                    {selectedInvoice.status !== 'paid' && (
                      <div className="flex gap-2">
                        {checkedTxIds.length > 0 ? (
                          <button
                            onClick={() => {
                              setPaymentType('selected');
                              setIsPaymentModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md"
                          >
                            Pagar Selecionados ({checkedTxIds.length})
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPaymentType('entire');
                              setIsPaymentModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 bg-emerald-650 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md"
                          >
                            <Check size={16} strokeWidth={3} /> Quitar Fatura
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Painel FIFO de Pagamento Parcial (Exibido se fatura não paga) */}
                {selectedInvoice.status !== 'paid' && (
                  <div className="px-6 py-4 border-b border-white/5 bg-white/1 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left w-full sm:w-auto">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <Info size={14} className="text-primary-500" /> Pagamento Parcial (Lógica FIFO)
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Amortize os gastos mais antigos do cartão digitando o valor.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input 
                        type="number" 
                        placeholder="R$ 0,00" 
                        value={fifoAmount}
                        onChange={(e) => setFifoAmount(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none w-32 focus:border-primary-500"
                      />
                      <button
                        onClick={() => {
                          if (!fifoAmount || parseFloat(fifoAmount) <= 0) {
                            alert('Insira um valor maior que zero.');
                            return;
                          }
                          setPaymentType('fifo');
                          setIsPaymentModalOpen(true);
                        }}
                        className="bg-primary-600 hover:bg-primary-750 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
                      >
                        Pagar FIFO
                      </button>
                    </div>
                  </div>
                )}

                {/* Listagem de Transações */}
                <div className="flex-1 overflow-x-auto min-h-[250px]">
                  {invoiceTransactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center justify-center h-full">
                      <Info size={36} className="text-gray-600 mb-3" />
                      Nenhuma transação lançada nesta fatura ainda.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-white/2 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                        <tr>
                          {selectedInvoice.status !== 'paid' && <th className="px-6 py-4 w-12"></th>}
                          <th className="px-6 py-4">Descrição</th>
                          <th className="px-6 py-4">Categoria</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Saldo Restante</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {invoiceTransactions.map((tx) => {
                          const isFullyPaid = tx.remaining <= 0;
                          const isChecked = checkedTxIds.includes(tx.id);

                          return (
                            <tr key={tx.id} className={`hover:bg-white/2 transition-all ${isFullyPaid ? 'opacity-50' : ''}`}>
                              {selectedInvoice.status !== 'paid' && (
                                <td className="px-6 py-4 text-center">
                                  {!tx.is_recurring && !isFullyPaid && (
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleCheckTx(tx.id)}
                                      className="w-4 h-4 rounded border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-white/5"
                                    />
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{tx.description}</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                  Compra: {new Date(tx.purchase_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/5">
                                  {tx.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {tx.is_recurring ? (
                                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    Recorrente
                                  </span>
                                ) : tx.total_installments > 1 ? (
                                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    Parcela ({tx.current_installment}/{tx.total_installments})
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-white/5 text-gray-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-white/5">
                                    À vista
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-black text-white text-sm">
                                  {formatMoney(tx.amount)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {isFullyPaid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 size={14} /> Quitada
                                  </span>
                                ) : (
                                  <span className="font-black text-rose-400 text-sm">
                                    {formatMoney(tx.remaining)}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteTransaction(tx)}
                                  className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                  title="Excluir Transação"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Histórico de Pagamentos da Fatura */}
                <div className="p-6 border-t border-white/5 bg-white/2">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-400" /> Histórico de Pagamentos da Fatura
                  </h4>
                  {invoicePayments.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold">Nenhum pagamento realizado para esta fatura.</p>
                  ) : (
                    <div className="space-y-3">
                      {invoicePayments.map((pay) => {
                        const isDeleting = deletingPaymentId === pay.id;
                        return (
                          <div key={pay.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                            <div>
                              <p className="text-xs font-bold text-white">
                                Pagamento via {pay.metodo_pagamento}
                              </p>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-mono">
                                {new Date(pay.data_pagamento).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-emerald-400">
                                {formatMoney(pay.valor_pago)}
                              </span>
                              <button
                                onClick={() => handleDeletePayment(pay.id)}
                                disabled={deletingPaymentId !== null}
                                aria-label="Excluir pagamento"
                                className={`p-2 rounded-lg transition-colors ${
                                  isDeleting 
                                    ? 'bg-rose-500/10 text-rose-500 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-rose-500 hover:bg-rose-500/10'
                                }`}
                                title="Estornar Pagamento"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center justify-center min-h-[300px]">
                Selecione uma fatura para ver os detalhes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NOVO CARTÃO */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
              <h3 className="text-xl font-black text-white">Adicionar Cartão de Crédito</h3>
              <button 
                onClick={() => setIsCardModalOpen(false)} 
                className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-1.5 block">Nome do Cartão (Apelido)</label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="Ex: Nubank, Inter, Visa Infinite..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-1.5 block">Limite Total R$</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardForm.total_limit}
                  onChange={(e) => setCardForm({ ...cardForm, total_limit: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-extrabold text-lg text-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-1.5 block">Fechamento (Dia)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardForm.closing_day}
                    onChange={(e) => setCardForm({ ...cardForm, closing_day: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-1.5 block">Vencimento (Dia)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardForm.due_day}
                    onChange={(e) => setCardForm({ ...cardForm, due_day: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-2 block">Cor Temática</label>
                <div className="grid grid-cols-6 gap-2">
                  {presetColors.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setCardForm({ ...cardForm, color_hex: col.hex })}
                      className="w-10 h-10 rounded-full border-2 transition-transform flex items-center justify-center transform hover:scale-105"
                      style={{ 
                        backgroundColor: col.hex,
                        borderColor: cardForm.color_hex === col.hex ? '#FFFFFF' : 'transparent' 
                      }}
                      title={col.name}
                    >
                      {cardForm.color_hex === col.hex && <Check size={16} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-750 text-white py-4 rounded-xl font-black text-md transition-all shadow-xl shadow-primary-600/10"
              >
                Criar Cartão
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA COMPRA */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div className="flex items-center gap-2">
                <CreditCard className="text-rose-500" size={22} />
                <h3 className="text-xl font-black text-white">Lançar Compra no Cartão</h3>
              </div>
              <button 
                onClick={() => setIsTxModalOpen(false)} 
                className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              <div className="flex flex-col p-4 bg-slate-900 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Cartão Selecionado</span>
                <span className="font-extrabold text-primary-400 text-lg flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCard?.color_hex }}></span>
                  {selectedCard?.name}
                </span>
                <span className="text-xs text-gray-400 font-semibold mt-1">
                  Limite Disponível: {formatMoney(selectedCard?.available_limit || 0)}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-450 uppercase tracking-widest ml-0.5 mb-1 block">Descrição da Compra</label>
                <input
                  type="text"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  placeholder="Ex: Assinatura Netflix, Supermercado, Monitor Gamer..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 outline-none font-bold text-white transition-all focus:bg-slate-950"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase tracking-widest ml-0.5 mb-1 block">Valor Total R$</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 outline-none font-black text-xl text-white transition-all focus:bg-slate-950"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase tracking-widest ml-0.5 mb-1 block">Categoria</label>
                  <select
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 outline-none font-bold text-white transition-all focus:bg-slate-950 appearance-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-450 uppercase tracking-widest ml-0.5 mb-1 block">Data da Compra</label>
                <input
                  type="date"
                  value={txForm.purchase_date}
                  onChange={(e) => setTxForm({ ...txForm, purchase_date: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 outline-none font-bold text-white transition-all"
                  required
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">Assinatura Recorrente?</span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Cobra mensalmente e não bloqueia o limite do cartão.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={txForm.is_recurring}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setTxForm({ 
                          ...txForm, 
                          is_recurring: val, 
                          is_installment: val ? false : txForm.is_installment 
                        });
                      }}
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                {!txForm.is_recurring && (
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">Dividir em Parcelas?</span>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Distribui o valor em faturas futuras.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={txForm.is_installment}
                        onChange={(e) => setTxForm({ ...txForm, is_installment: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                )}

                {txForm.is_installment && !txForm.is_recurring && (
                  <div className="flex items-center justify-between p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/35 animate-in slide-in-from-top-2 duration-200">
                    <span className="text-xs font-black text-amber-400">Número de parcelas:</span>
                    <select
                      value={txForm.total_installments}
                      onChange={(e) => setTxForm({ ...txForm, total_installments: parseInt(e.target.value) })}
                      className="bg-slate-800 border border-amber-500/35 rounded-lg p-1.5 text-xs font-black text-white outline-none cursor-pointer"
                    >
                      {[2,3,4,5,6,7,8,9,10,11,12,18,24,36,48].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-black text-md transition-all shadow-xl shadow-rose-500/10 hover:-translate-y-0.5"
              >
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO DE FATURA */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
              <h3 className="text-xl font-black text-white">Efetuar Pagamento</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
              <div className="bg-slate-900 p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Resumo do Pagamento</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-semibold text-gray-300">Tipo de Pagamento:</span>
                  <span className="text-xs font-black text-white">
                    {paymentType === 'selected' ? 'Compras Selecionadas' : paymentType === 'entire' ? 'Fatura Completa' : 'Valor Customizado (FIFO)'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                  <span className="text-sm font-extrabold text-white">Total a Pagar:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatMoney(
                      paymentType === 'selected' 
                        ? totalSelectedAmount 
                        : paymentType === 'entire' 
                          ? invoiceTransactions.filter(t => !t.is_recurring).reduce((sum, t) => sum + t.remaining, 0)
                          : parseFloat(fifoAmount) || 0
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-0.5 mb-1.5 block">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-white transition-all appearance-none cursor-pointer focus:bg-slate-950"
                >
                  <option value="Saldo da Conta">Saldo da Conta (Debita no Extrato)</option>
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto Bancário</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-650 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-md transition-all shadow-xl hover:-translate-y-0.5"
              >
                Confirmar Pagamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECIBO DIGITAL */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-850 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200 relative noise-overlay">
            
            {/* Success confetti light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2 relative z-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400 animate-bounce" size={24} />
                <h3 className="text-lg font-black text-white">Comprovante de Pagamento</h3>
              </div>
              <button 
                onClick={() => setReceipt(null)} 
                className="p-1.5 hover:bg-white/5 rounded-full text-gray-450 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 relative z-10 font-sans">
              
              <div className="text-center py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">VALOR TOTAL QUITADO</p>
                <h4 className="text-3xl font-black text-emerald-400">{formatMoney(receipt.total)}</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">Pago via {receipt.method}</p>
              </div>

              <div className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                  Amortizações da Fatura
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {receipt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white truncate max-w-[200px]" title={item.description}>
                        {item.description}
                      </span>
                      <span className="font-extrabold text-emerald-400 whitespace-nowrap">
                        + {formatMoney(item.amountPaid)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-gray-500 text-center font-mono select-all">
                Autenticação: {receipt.id}
              </div>

              <button
                onClick={() => setReceipt(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-black text-sm transition-all border border-white/10"
              >
                Fechar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
