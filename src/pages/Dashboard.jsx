import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, X, MessageCircle } from 'lucide-react';

import DashboardSidebar from '../components/DashboardSidebar';
import OverviewTab from '../components/OverviewTab';
import ExtractsTab from '../components/ExtractsTab';
import GoalsTab from '../components/GoalsTab';
import InvestmentsTab from '../components/InvestmentsTab';

export default function Dashboard({ session }) {
    const navigate = useNavigate();
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
        data: new Date().toISOString().split('T')[0]
    });

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
        const receitas = filteredTransactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0);
        const despesas = filteredTransactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0);
        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
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
        if (!form.descricao || isNaN(cleanValor)) return;

        try {
            const payload = {
                user_id: session.user.id,
                tipo: form.tipo,
                descricao: form.descricao,
                valor: cleanValor,
                categoria: form.categoria,
                data: form.data
            };

            if (editingId) {
                const { error } = await supabase.from('transactions').update(payload).eq('id', editingId);
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
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (!error) {
                setTransactions(transactions.filter(t => t.id !== id));
            }
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
        setForm({ tipo: 'despesa', descricao: '', valor: '', categoria: 'Outros', data: new Date().toISOString().split('T')[0] });
    };

    if (loading) return <div className="p-10 text-center font-poppins font-bold text-gray-400">Carregando painel...</div>;

    const renderTabContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <OverviewTab transactions={filteredTransactions} totals={totals} pieData={pieData} startEdit={startEdit} deleteItem={deleteItem} />;
        case 'extratos':
          return <ExtractsTab />;
        case 'metas':
          return <GoalsTab session={session} />;
        case 'investimentos':
          return <InvestmentsTab session={session} />;
        default:
          return null;
      }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] dark:bg-slate-900 flex flex-col md:flex-row font-sans text-primary-700 dark:text-slate-100 relative transition-colors">
            <DashboardSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              profile={profile} 
              session={session} 
              handleLogout={handleLogout} 
            />

            <main className="flex-1 p-6 md:p-12 max-h-screen overflow-y-auto w-full relative z-0">
                {/* Horizontal Touchbar for Navigation */}
                <div className="bg-white dark:bg-slate-800 rounded-[20px] p-1.5 mb-8 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between w-full transition-colors">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex-1 py-4 text-[10px] md:text-xs font-poppins font-bold uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'dashboard' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-700/50' : 'text-gray-400 dark:text-slate-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('extratos')}
                        className={`flex-1 py-4 text-[10px] md:text-xs font-poppins font-bold uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'extratos' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-700/50' : 'text-gray-400 dark:text-slate-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                    >
                        Extrato
                    </button>
                    <button
                        onClick={() => setActiveTab('metas')}
                        className={`flex-1 py-4 text-[10px] md:text-xs font-poppins font-bold uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'metas' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-700/50' : 'text-gray-400 dark:text-slate-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                    >
                        Metas
                    </button>
                    <button
                        onClick={() => setActiveTab('investimentos')}
                        className={`flex-1 py-4 text-[10px] md:text-xs font-poppins font-bold uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'investimentos' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-700/50' : 'text-gray-400 dark:text-slate-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                    >
                        Ativos
                    </button>
                </div>

                <header className="flex justify-end items-center gap-4 mb-10">
                    {activeTab === 'dashboard' && (
                      <>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white dark:bg-slate-800 text-primary-700 dark:text-white font-poppins font-bold px-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm outline-none focus:border-primary-500 transition-all cursor-pointer"
                        />
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-poppins font-bold transition-all shadow-xl shadow-primary-600/20 hover:-translate-y-0.5"
                        >
                            <Plus size={20} strokeWidth={3} /> Lançar Entrada
                        </button>
                      </>
                    )}
                </header>

                {renderTabContent()}
                
                {/* Floating Action Button for Community/Chats */}
                <button 
                  onClick={() => navigate('/chats')}
                  className="fixed bottom-8 right-8 bg-primary-700 hover:bg-primary-600 text-white p-5 rounded-full shadow-2xl shadow-primary-700/40 transition-all hover:-translate-y-1 hover:scale-105 z-40 group flex items-center gap-3"
                  title="Assistência IA e Chats"
                >
                  <MessageCircle size={28} strokeWidth={2.5} />
                  <span className="font-poppins font-bold text-sm hidden md:block whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out">Assistência IA</span>
                </button>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-primary-700/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                        <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-2xl font-poppins font-black text-primary-700 dark:text-white">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors shadow-sm"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="flex bg-gray-100 dark:bg-slate-900 p-1.5 rounded-[20px]">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'receita' })}
                                    className={`flex-1 py-3 text-sm font-poppins font-bold rounded-[15px] transition-all ${form.tipo === 'receita' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                                >
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'despesa' })}
                                    className={`flex-1 py-3 text-sm font-poppins font-bold rounded-[15px] transition-all ${form.tipo === 'despesa' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                                >
                                    Gasto (Saída)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Descrição</label>
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
                                    <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Valor R$</label>
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
                                    <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categoria</label>
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
                                    <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Data</label>
                                    <input
                                        type="date"
                                        value={form.data}
                                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full text-white py-5 rounded-[20px] font-poppins font-black text-lg transition-all shadow-xl hover:-translate-y-1 ${form.tipo === 'receita' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
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
