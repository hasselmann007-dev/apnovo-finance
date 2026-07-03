import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Plus, X, MessageCircle, LayoutDashboard, FileText, TrendingUp, CreditCard, LogOut, 
  Eye, EyeOff, Search, Terminal, Sparkles, Check, ChevronRight, AlertCircle, Settings, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import DashboardSidebar from '../components/DashboardSidebar';
import OverviewTab from '../components/OverviewTab';
import ExtractsTab from '../components/ExtractsTab';
import InvestmentsTab from '../components/InvestmentsTab';
import CreditCardsTab from '../components/CreditCardsTab';
import SettingsTab from '../components/SettingsTab';

export default function Dashboard({ session }) {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Novas abas: dashboard (Visão Geral), extratos, metas
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('apnovo_dashboard_tab') || 'dashboard';
    });

    useEffect(() => {
        localStorage.setItem('apnovo_dashboard_tab', activeTab);
    }, [activeTab]);

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        tipo: 'despesa',
        descricao: '',
        valor: '',
        categoria: 'Outros',
        data: new Date().toISOString().split('T')[0],
        pago: true
    });

    // Privacy Mode state
    const [showSensitiveData, setShowSensitiveData] = useState(() => {
        const saved = localStorage.getItem('apnovo_show_sensitive_data');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('apnovo_show_sensitive_data', JSON.stringify(showSensitiveData));
    }, [showSensitiveData]);

    // Command Bar state
    const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const commandInputRef = useRef(null);

    // Listen for '/' shortcut to open the Quick Command Bar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsCommandBarOpen(true);
            }
            if (e.key === 'Escape') {
                setIsCommandBarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isCommandBarOpen && commandInputRef.current) {
            commandInputRef.current.focus();
        }
    }, [isCommandBarOpen]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
                
            if (!profileData) {
                const fallbackProfile = {
                    id: session.user.id,
                    display_name: session.user.email.split('@')[0],
                    meta_economia: 1000
                };
                await supabase.from('profiles').upsert(fallbackProfile, { onConflict: 'id' });
                setProfile(fallbackProfile);
            } else {
                setProfile(profileData);
            }

            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .order('data', { ascending: false });
            
            if (transData) setTransactions(transData);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const filteredTransactions = useMemo(() => {
        if (!selectedMonth) return transactions;
        return transactions.filter(t => t.data.startsWith(selectedMonth));
    }, [transactions, selectedMonth]);

    const totals = useMemo(() => {
        const receitas = filteredTransactions.filter(t => t.tipo === 'receita' && t.pago !== false).reduce((sum, t) => sum + Number(t.valor), 0);
        const despesas = filteredTransactions.filter(t => t.tipo === 'despesa' && t.pago !== false).reduce((sum, t) => sum + Number(t.valor), 0);
        const aPagar = filteredTransactions.filter(t => t.tipo === 'despesa' && t.pago === false).reduce((sum, t) => sum + Number(t.valor), 0);
        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
            aPagar,
            totalRegistros: filteredTransactions.length
        };
    }, [filteredTransactions]);

    const pieData = useMemo(() => {
        const groups = {};
        filteredTransactions.filter(t => t.tipo === 'despesa').forEach(t => {
            groups[t.categoria] = (groups[t.categoria] || 0) + Number(t.valor);
        });
        return Object.keys(groups).map(name => ({ name, value: groups[name] }));
    }, [filteredTransactions]);

    const handleSave = async (e) => {
        e.preventDefault();
        const cleanValor = parseFloat(form.valor);
        if (!form.descricao || isNaN(cleanValor) || cleanValor <= 0) {
            alert('Por favor, preencha a descrição e um valor maior que zero.');
            return;
        }

        try {
            const payload = {
                user_id: session.user.id,
                tipo: form.tipo,
                descricao: form.descricao,
                valor: cleanValor,
                categoria: form.categoria,
                data: form.data,
                pago: form.tipo === 'despesa' ? form.pago : true // Only despesas can be unpaid
            };

            if (editingId) {
                const { error } = await supabase.from('transactions')
                    .update(payload)
                    .eq('id', editingId)
                    .eq('user_id', session.user.id);
                if (!error) {
                    setTransactions(transactions.map(t => t.id === editingId ? { ...t, ...payload } : t));
                }
            } else {
                const { data, error } = await supabase.from('transactions').insert(payload).select().single();
                if (!error && data) {
                    setTransactions([data, ...transactions]);
                }
            }
            closeModal();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteItem = async (id) => {
        if (window.confirm("Tem certeza que deseja apagar?")) {
            const { error } = await supabase.from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', session.user.id);
            if (!error) {
                setTransactions(transactions.filter(t => t.id !== id));
            }
        }
    };

    const togglePago = async (t) => {
        const novoStatus = t.pago === false ? true : false;
        const { error } = await supabase.from('transactions')
            .update({ pago: novoStatus })
            .eq('id', t.id)
            .eq('user_id', session.user.id);
        if (!error) {
            setTransactions(transactions.map(item => item.id === t.id ? { ...item, pago: novoStatus } : item));
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setForm({ ...item, valor: item.valor.toString() });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm({ tipo: 'despesa', descricao: '', valor: '', categoria: 'Outros', data: new Date().toISOString().split('T')[0], pago: true });
    };

    const handleQuickTransaction = async (action, value, description, category) => {
        try {
            const payload = {
                user_id: session.user.id,
                tipo: action,
                descricao: description,
                valor: value,
                categoria: category,
                data: new Date().toISOString().split('T')[0],
                pago: true
            };

            const { data, error } = await supabase.from('transactions').insert(payload).select().single();
            if (error) throw error;
            if (data) {
                setTransactions([data, ...transactions]);
            }
            return true;
        } catch (error) {
            console.error('Erro no comando rápido:', error);
            alert('Erro ao salvar transação rápida: ' + error.message);
            return false;
        }
    };

    const parsedCommand = useMemo(() => {
        const trimmed = commandInput.trim();
        if (!trimmed) return null;

        // Navigation commands first
        const lower = trimmed.toLowerCase();
        if (['inicio', 'início', 'dashboard', 'visão', 'visao', 'geral', 'visão geral', 'ir para inicio', 'ir para dashboard'].includes(lower)) {
            return { type: 'navigation', target: 'dashboard', label: 'Ir para Visão Geral' };
        } else if (['extrato', 'extratos', 'ir para extrato', 'historico', 'histórico'].includes(lower)) {
            return { type: 'navigation', target: 'extratos', label: 'Ir para Extratos' };
        } else if (['cartao', 'cartão', 'cartões', 'cartoes', 'ir para cartões', 'fatura', 'faturas'].includes(lower)) {
            return { type: 'navigation', target: 'cartoes', label: 'Ir para Cartões de Crédito' };
        } else if (['investimento', 'investimentos', 'ativos', 'ativo', 'ir para investimentos'].includes(lower)) {
            return { type: 'navigation', target: 'investimentos', label: 'Ir para Investimentos' };
        } else if (['ocultar', 'privacidade', 'olho', 'visibilidade', 'mostrar', 'valores', 'modo privacidade', 'modo de privacidade'].includes(lower)) {
            return { type: 'action', action: 'toggle_privacy', label: 'Alternar Modo de Privacidade' };
        }

        // Parse transaction commands using smart regex and natural language indicators
        // Match a decimal value, optionally with R$ prefix (e.g. 100, 100.50, 100,50, R$50, r$ 1.250)
        const valueMatch = trimmed.match(/(?:r\$\s*)?(\d+(?:\.\d{3})*(?:[.,]\d{1,2})?)/i);
        if (!valueMatch) return null;

        const rawValue = valueMatch[1];
        // Normalize number format (remove thousands separator dot, convert comma decimal to dot)
        const normalizedValue = rawValue.replace(/\./g, '').replace(',', '.');
        const value = parseFloat(normalizedValue);
        if (isNaN(value) || value <= 0) return null;

        // Extract description by removing value from the original command input
        const textWithoutValue = trimmed.replace(valueMatch[0], '').trim();

        // Income indicator keywords
        const incomeIndicators = [
            'ganho', 'ganhei', 'receita', 'salario', 'salário', 'recebi', 'entrada', 
            'credito', 'crédito', 'deposito', 'depósito', 'bonus', 'bônus', 'vendi', 'venda',
            'faturamento', '/ganho', '/receita', '/entrada'
        ];

        // Expense indicator keywords
        const expenseIndicators = [
            'gasto', 'gastou', 'despesa', 'pagamento', 'paguei', 'comprei', 'compra', 
            'saida', 'saída', 'custo', 'perda', 'debito', 'débito', 'perdi', 'transferi',
            'pagar', '/gasto', '/despesa', '/saida', '/compra'
        ];

        // Tokenize remaining text to check for type indicators
        const words = textWithoutValue.toLowerCase().split(/\s+/);
        let action = 'despesa'; // Default to despesa
        let detectedTypeByWord = false;
        let matchedIndicator = '';

        for (const word of words) {
            const cleanWord = word.replace(/[^\w/áéíóúâêôãõç]/g, '');
            if (incomeIndicators.includes(cleanWord)) {
                action = 'receita';
                detectedTypeByWord = true;
                matchedIndicator = cleanWord;
                break;
            }
            if (expenseIndicators.includes(cleanWord)) {
                action = 'despesa';
                detectedTypeByWord = true;
                matchedIndicator = cleanWord;
                break;
            }
        }

        // Clean description: remove indicator words and Portuguese prepositions/stop words
        const stopwords = [
            'de', 'do', 'da', 'no', 'na', 'em', 'com', 'para', 'um', 'uma', 'o', 'a', 'os', 'as', 
            'por', 'reais', 'real', 'rs', 'r$'
        ];
        const cleanDescriptionWords = textWithoutValue.split(/\s+/).filter(word => {
            const wordLower = word.toLowerCase().replace(/[^\w/áéíóúâêôãõç]/g, '');
            return !incomeIndicators.includes(wordLower) && 
                   !expenseIndicators.includes(wordLower) && 
                   !stopwords.includes(wordLower);
        });

        let description = cleanDescriptionWords.join(' ');
        
        // Capitalize first letter of description, or use matching indicator if description is blank
        if (description) {
            description = description.charAt(0).toUpperCase() + description.slice(1);
        } else {
            if (matchedIndicator) {
                // capitalize indicator (e.g. "salário" -> "Salário")
                description = matchedIndicator.replace('/', '').charAt(0).toUpperCase() + matchedIndicator.replace('/', '').slice(1);
            } else {
                description = 'Lançamento rápido';
            }
        }

        // Suggest category based on description
        let category = 'Outros';
        const descLower = description.toLowerCase();
        if (descLower.includes('mercado') || descLower.includes('comida') || descLower.includes('alimento') || descLower.includes('restaurante') || descLower.includes('jantar') || descLower.includes('almoço') || descLower.includes('padaria') || descLower.includes('supermercado') || descLower.includes('lanche')) {
            category = 'Mercado';
        } else if (descLower.includes('aluguel') || descLower.includes('luz') || descLower.includes('agua') || descLower.includes('água') || descLower.includes('internet') || descLower.includes('energia') || descLower.includes('fixa') || descLower.includes('condominio') || descLower.includes('condomínio') || descLower.includes('telefone') || descLower.includes('mensalidade')) {
            category = 'Contas Fixas';
        } else if (descLower.includes('trabalho') || descLower.includes('salario') || descLower.includes('salário') || descLower.includes('job') || descLower.includes('freela') || descLower.includes('pagamento') || descLower.includes('comissão')) {
            category = 'Trabalho';
        } else if (descLower.includes('investimento') || descLower.includes('acoes') || descLower.includes('ações') || descLower.includes('tesouro') || descLower.includes('poupança') || descLower.includes('poupanca') || descLower.includes('fundo') || descLower.includes('cdb')) {
            category = 'Investimento';
        } else if (descLower.includes('lazer') || descLower.includes('cinema') || descLower.includes('viagem') || descLower.includes('festa') || descLower.includes('show') || descLower.includes('bar') || descLower.includes('futebol') || descLower.includes('ingresso') || descLower.includes('role') || descLower.includes('rolê')) {
            category = 'Lazer';
        } else if (descLower.includes('cartao') || descLower.includes('cartão') || descLower.includes('fatura') || descLower.includes('credito') || descLower.includes('crédito')) {
            category = 'Cartão';
        } else if (descLower.includes('moradia') || descLower.includes('casa') || descLower.includes('reforma') || descLower.includes('moveis') || descLower.includes('móveis')) {
            category = 'Moradia';
        } else if (descLower.includes('divida') || descLower.includes('dívida') || descLower.includes('emprestimo') || descLower.includes('empréstimo') || descLower.includes('juros')) {
            category = 'Dívidas';
        }

        return {
            type: 'transaction',
            action,
            value,
            description,
            category,
            isValid: value > 0 && description.length > 0
        };
    }, [commandInput]);

    const handleCommandSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!parsedCommand) return;

        if (parsedCommand.type === 'transaction' && parsedCommand.isValid) {
            const success = await handleQuickTransaction(
                parsedCommand.action,
                parsedCommand.value,
                parsedCommand.description,
                parsedCommand.category
            );
            if (success) {
                setIsCommandBarOpen(false);
                setCommandInput('');
            }
        } else if (parsedCommand.type === 'navigation') {
            setActiveTab(parsedCommand.target);
            setIsCommandBarOpen(false);
            setCommandInput('');
        } else if (parsedCommand.type === 'action' && parsedCommand.action === 'toggle_privacy') {
            setShowSensitiveData(prev => !prev);
            setIsCommandBarOpen(false);
            setCommandInput('');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Carregando painel...</div>;

    const renderTabContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return (
            <OverviewTab 
              session={session}
              transactions={filteredTransactions} 
              totals={totals} 
              pieData={pieData} 
              startEdit={startEdit} 
              deleteItem={deleteItem} 
              togglePago={togglePago} 
              showSensitiveData={showSensitiveData}
              setActiveTab={setActiveTab}
              openCommandBar={() => setIsCommandBarOpen(true)}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          );
        case 'extratos':
          return <ExtractsTab />;
        case 'investimentos':
          return <InvestmentsTab session={session} />;
        case 'cartoes':
          return <CreditCardsTab session={session} showSensitiveData={showSensitiveData} />;
        case 'configuracoes':
          return (
            <SettingsTab 
              session={session}
              profile={profile}
              handleLogout={handleLogout}
              onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
            />
          );
        default:
          return null;
      }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-300 relative transition-colors duration-300">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full z-45 bg-white/80 dark:bg-[#0A0C10]/80 backdrop-blur-md border-b border-slate-150 dark:border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                    <div className="bg-primary-700 p-2 rounded-xl text-white">
                        <TrendingUp size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">FINANCE ORGANIZER</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-300"
                        title={showSensitiveData ? "Ocultar Valores" : "Mostrar Valores"}
                    >
                        {showSensitiveData ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                        onClick={toggleTheme}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-300"
                        title="Alternar Tema"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button 
                        onClick={() => setIsCommandBarOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-600 dark:text-primary-400 transition-colors"
                        title="Comandos Rápidos"
                    >
                        <Terminal size={18} />
                    </button>
                    <button 
                        onClick={() => setActiveTab('configuracoes')}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${activeTab === 'configuracoes' ? 'bg-primary-650 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
                        title="Configurações"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full z-45 bg-white/80 dark:bg-[#0A0C10]/80 backdrop-blur-md border-t border-slate-150 dark:border-white/5 px-4 py-3 pb-safe flex justify-around items-center">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === 'dashboard' ? 'text-primary-600 dark:text-primary-500' : 'text-slate-550 dark:text-gray-400'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-[10px] font-bold">Início</span>
                </button>
                <button 
                    onClick={() => setActiveTab('extratos')}
                    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === 'extratos' ? 'text-primary-600 dark:text-primary-500' : 'text-slate-550 dark:text-gray-400'}`}
                >
                    <FileText size={20} />
                    <span className="text-[10px] font-bold">Extrato</span>
                </button>
                <button 
                    onClick={() => setActiveTab('cartoes')}
                    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === 'cartoes' ? 'text-primary-600 dark:text-primary-500' : 'text-slate-550 dark:text-gray-400'}`}
                >
                    <CreditCard size={20} />
                    <span className="text-[10px] font-bold">Cartões</span>
                </button>
                <button 
                    onClick={() => setActiveTab('investimentos')}
                    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === 'investimentos' ? 'text-primary-600 dark:text-primary-500' : 'text-slate-550 dark:text-gray-400'}`}
                >
                    <TrendingUp size={20} />
                    <span className="text-[10px] font-bold">Ativos</span>
                </button>
                <button 
                    onClick={() => setActiveTab('configuracoes')}
                    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === 'configuracoes' ? 'text-primary-600 dark:text-primary-500' : 'text-slate-550 dark:text-gray-400'}`}
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-bold">Ajustes</span>
                </button>
            </nav>

            <DashboardSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              profile={profile} 
              session={session} 
              handleLogout={handleLogout} 
            />

            <main className="flex-1 px-6 pt-24 pb-28 md:p-12 max-h-screen overflow-y-auto w-full relative z-0">

                <header className="hidden md:flex flex-row justify-between items-center gap-4 mb-10 pb-6 border-b border-slate-150 dark:border-white/5">
                    <div>
                        {activeTab === 'dashboard' && <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>}
                        {activeTab === 'extratos' && <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Extrato</h2>}
                        {activeTab === 'investimentos' && <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Investimentos</h2>}
                        {activeTab === 'cartoes' && <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cartões</h2>}
                        {activeTab === 'configuracoes' && <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configurações</h2>}
                    </div>
                    <div className="flex items-center gap-4">
                        {activeTab === 'dashboard' && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-bold px-4 py-2.5 rounded-xl outline-none focus:border-primary-500 transition-all cursor-pointer text-sm shadow-sm dark:shadow-none"
                            />
                        )}
                        
                        {/* Quick Command Button */}
                        <button
                            onClick={() => setIsCommandBarOpen(true)}
                            className="flex items-center gap-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-200 dark:border-white/5 text-sm shadow-sm dark:shadow-none"
                            title="Abrir Painel de Comandos (Pressione '/')"
                        >
                            <span className="bg-slate-100 dark:bg-white/10 text-slate-550 dark:text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 mr-1 font-mono">/</span>
                            Comandos Rápidos
                        </button>
                        
                        {/* Privacy Toggle Button */}
                        <button
                            onClick={() => setShowSensitiveData(!showSensitiveData)}
                            className="p-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-all border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                            title={showSensitiveData ? "Ocultar Valores" : "Mostrar Valores"}
                        >
                            {showSensitiveData ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>

                        {activeTab === 'dashboard' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-[#00f0ff] dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] px-6 py-2.5 rounded-xl font-black transition-all shadow-xl shadow-primary-500/10 dark:shadow-[#00f0ff]/10 hover:-translate-y-0.5 text-sm"
                            >
                                <Plus size={18} strokeWidth={3} /> Lançar Transação
                            </button>
                        )}
                    </div>
                </header>

                {renderTabContent()}
                
                {/* Global Floating Action Button & Micro-Menu setup */}
                <div className="fixed bottom-20 right-6 md:bottom-12 md:right-12 z-50 pointer-events-none flex flex-col items-end gap-3">
                  {isQuickMenuOpen && (
                    <div className="pointer-events-auto flex flex-col gap-2 bg-[#0A0C10]/95 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 w-48 mb-2">
                      <div className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest px-2 mb-1">
                        Ações Rápidas
                      </div>
                      {activeTab === 'investimentos' ? (
                        <>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-novo-aporte'));
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Novo Aporte
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-registrar-resgate'));
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            Registrar Resgate
                          </button>
                        </>
                      ) : activeTab === 'cartoes' ? (
                        <>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-lancar-gasto'));
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            Lançar Gasto
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-pagar-fatura'));
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Pagar Fatura
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setForm({
                                tipo: 'receita',
                                descricao: '',
                                valor: '',
                                categoria: 'Trabalho',
                                data: new Date().toISOString().split('T')[0],
                                pago: true
                              });
                              setIsModalOpen(true);
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span>
                            Lançar Entrada
                          </button>
                          <button
                            onClick={() => {
                              setForm({
                                tipo: 'despesa',
                                descricao: '',
                                valor: '',
                                categoria: 'Outros',
                                data: new Date().toISOString().split('T')[0],
                                pago: true
                              });
                              setIsModalOpen(true);
                              setIsQuickMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            Lançar Despesa
                          </button>
                        </>
                      )}
                      <div className="border-t border-white/5 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setIsCommandBarOpen(true);
                            setIsQuickMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all flex items-center gap-2"
                        >
                          <Terminal size={14} />
                          Console "/"
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                    className="pointer-events-auto bg-[#00f0ff] hover:bg-[#00d8e6] text-[#0A0C10] p-5 rounded-full shadow-2xl shadow-[#00f0ff]/25 transition-all hover:-translate-y-1 hover:scale-105 group flex items-center gap-3 relative"
                    title="Ações Rápidas (Pressione '/')"
                  >
                    <Terminal size={28} strokeWidth={2.5} className={`transition-transform duration-300 ${isQuickMenuOpen ? 'rotate-90' : ''}`} />
                    <span className="font-black text-sm hidden md:block whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out">
                      {isQuickMenuOpen ? 'Fechar Menu' : 'Comandos Rápidos'}
                    </span>
                  </button>
                </div>
            </main>

            {/* Spotlight Quick Command Bar */}
            {isCommandBarOpen && (
                <div className="fixed inset-0 bg-[#0A0C10]/80 backdrop-blur-md z-50 flex justify-center items-start pt-[15vh] px-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 z-0" onClick={() => { setIsCommandBarOpen(false); setCommandInput(''); }}></div>
                    
                    <div className="bg-slate-900/90 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/2">
                            <Terminal size={22} className="text-[#00f0ff]" />
                            <input 
                                ref={commandInputRef}
                                type="text"
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCommandSubmit(e);
                                    }
                                }}
                                placeholder="O que deseja lançar? (ex: 'paguei 45 no mercado' ou 'recebi 3000 de salário')"
                                className="bg-transparent text-white font-extrabold text-lg placeholder-slate-500 border-none outline-none focus:ring-0 w-full"
                            />
                            <button 
                                onClick={() => { setIsCommandBarOpen(false); setCommandInput(''); }}
                                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto">
                            {parsedCommand ? (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-1.5">
                                        <Sparkles size={12} /> Comando Reconhecido
                                    </p>
                                    
                                    {parsedCommand.type === 'transaction' && (
                                        <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/20 p-5 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ação</span>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${parsedCommand.action === 'despesa' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : 'bg-primary-500/10 text-primary-400 border border-primary-500/25'}`}>
                                                    {parsedCommand.action === 'despesa' ? 'Registrar Gasto (Saída)' : 'Registrar Entrada'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Valor</span>
                                                <span className="text-xl font-black text-white">
                                                    {parsedCommand.value ? `R$ ${parsedCommand.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Descrição</span>
                                                <span className="font-extrabold text-white">{parsedCommand.description || '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Categoria Sugerida</span>
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white">
                                                    {parsedCommand.category}
                                                </span>
                                            </div>
                                            
                                            {parsedCommand.isValid ? (
                                                <div className="pt-2 flex justify-end">
                                                    <button 
                                                        onClick={() => handleCommandSubmit()}
                                                        className="flex items-center gap-1.5 bg-[#00f0ff] hover:bg-[#00d8e6] text-[#0A0C10] px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                                                    >
                                                        <Check size={14} strokeWidth={3} /> Confirmar (Pressione Enter)
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-rose-400 font-bold text-center mt-2">Digite uma descrição e valor válidos para confirmar.</p>
                                            )}
                                        </div>
                                    )}

                                    {parsedCommand.type === 'navigation' && (
                                        <div className="bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm font-extrabold text-white">{parsedCommand.label}</span>
                                            <button 
                                                onClick={() => handleCommandSubmit()}
                                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                                            >
                                                Ir Agora (Pressione Enter)
                                            </button>
                                        </div>
                                    )}

                                    {parsedCommand.type === 'action' && (
                                        <div className="bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm font-extrabold text-white">{parsedCommand.label}</span>
                                            <button 
                                                onClick={() => handleCommandSubmit()}
                                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                                            >
                                                Executar (Pressione Enter)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Exemplos e Atalhos</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl space-y-1">
                                            <p className="text-xs font-black text-white">Gasto / Despesa</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Escreva de forma natural: <span className="text-rose-400 font-bold">'paguei 45 no mercado'</span>, <span className="text-rose-400 font-bold">'gasto 1200 aluguel'</span> ou <span className="text-rose-400 font-bold">'comprei pizza de 50'</span></p>
                                        </div>
                                        <div className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl space-y-1">
                                            <p className="text-xs font-black text-white">Ganho / Receita</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Escreva de forma natural: <span className="text-primary-400 font-bold">'recebi 3000 de salário'</span>, <span className="text-primary-400 font-bold">'ganho de 200 do freela'</span> ou <span className="text-primary-400 font-bold">'depósito 150'</span></p>
                                        </div>
                                        <div className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl space-y-1">
                                            <p className="text-xs font-black text-[#8b5cf6]">Navegação Direta</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Escreva <span className="text-[#8b5cf6] font-bold">'extrato'</span>, <span className="text-[#8b5cf6] font-bold">'cartões'</span> ou <span className="text-[#8b5cf6] font-bold">'ativos'</span> para mudar de aba instantaneamente.</p>
                                        </div>
                                        <div className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl space-y-1">
                                            <p className="text-xs font-black text-[#00f0ff]">Modo de Privacidade</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Escreva <span className="text-[#00f0ff] font-bold">'privacidade'</span> ou <span className="text-[#00f0ff] font-bold">'ocultar'</span> para mascarar ou revelar os saldos.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white/2 border-t border-white/5 text-[10px] text-gray-500 flex justify-between font-bold">
                            <span>O console entende linguagem natural e sugere a categoria com base no contexto</span>
                            <span>ESC para fechar</span>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-primary-700/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                        <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-2xl font-black text-primary-700 dark:text-white">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors shadow-sm"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="flex bg-gray-100 dark:bg-slate-900 p-1.5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'receita' })}
                                    className={`flex-1 py-3 text-sm font-bold rounded-[15px] transition-all ${form.tipo === 'receita' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                                >
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'despesa' })}
                                    className={`flex-1 py-3 text-sm font-bold rounded-[15px] transition-all ${form.tipo === 'despesa' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                                >
                                    Gasto (Saída)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Descrição</label>
                                    <input
                                        type="text"
                                        value={form.descricao}
                                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                        placeholder="Ex: Salário, Aluguel, Mercado..."
                                        className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Valor R$</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.valor}
                                        onChange={(e) => setForm({ ...form, valor: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-black text-xl text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categoria</label>
                                    <select
                                        value={form.categoria}
                                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 appearance-none"
                                    >
                                        <option>Trabalho</option>
                                        <option>Bônus</option>
                                        <option>Contas Fixas</option>
                                        <option>Moradia</option>
                                        <option>Mercado</option>
                                        <option>Investimento</option>
                                        <option>Dívidas</option>
                                        <option>Lazer</option>
                                        <option>Cartão</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Data</label>
                                    <input
                                        type="date"
                                        value={form.data}
                                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border-2 border-transparent">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-primary-700 dark:text-white">Transação já foi {form.tipo === 'despesa' ? 'paga' : 'recebida'}?</span>
                                        <span className="text-xs text-gray-400 font-medium">Se desmarcado, constará como prevista (não entra no saldo atual).</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={form.pago !== false} 
                                            onChange={(e) => setForm({ ...form, pago: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full text-white py-5 rounded-xl font-black text-lg transition-all shadow-xl hover:-translate-y-1 ${form.tipo === 'receita' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                            >
                                {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
