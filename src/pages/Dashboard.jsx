import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus, Trash2, Edit3, Save, X, LogOut,
    Wallet, LayoutDashboard, List, PieChart as PieIcon, CheckCircle2,
    AlertCircle, ArrowUpCircle, ArrowDownCircle, Users
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export default function Dashboard({ session }) {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('dashboard');
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
            // Get profile safely
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

            // Get transactions
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

    const totals = useMemo(() => {
        const receitas = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0);
        const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0);
        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
            totalRegistros: transactions.length
        };
    }, [transactions]);

    const pieData = useMemo(() => {
        const groups = {};
        transactions.filter(t => t.tipo === 'despesa').forEach(t => {
            groups[t.categoria] = (groups[t.categoria] || 0) + Number(t.valor);
        });
        return Object.keys(groups).map(name => ({ name, value: groups[name] }));
    }, [transactions]);

    const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

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

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Carregando painel...</div>;

    const economiaPercent = totals.receitas > 0 ? ((totals.saldo / totals.receitas) * 100).toFixed(1) : 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
            <aside className="w-full md:w-72 bg-white border-r border-gray-200 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <Wallet size={24} />
                    </div>
                    <span className="text-xl font-black text-gray-800 tracking-tight">Danilo Cash</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard size={20} /> Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'lista' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <List size={20} /> Histórico
                    </button>
                    <button
                        onClick={() => navigate('/comunidade')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-gray-500 hover:bg-gray-50`}
                    >
                        <Users size={20} /> Comunidade (UGC)
                    </button>
                </nav>

                <div className="mt-auto pt-6 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl text-white shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Bem-vindo(a),</p>
                        <p className="text-lg font-black leading-tight mb-4">{profile?.display_name || 'Usuário'}</p>
                        <div className="flex items-center gap-2 text-xs bg-white/20 p-2 rounded-lg break-all">
                            {session.user.email}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center gap-2 py-3 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-colors"
                    >
                        <LogOut size={18} /> Sair da Conta
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 md:p-10 max-h-screen overflow-y-auto w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Seu Dinheiro</h2>
                        <p className="text-gray-500">Métricas e acompanhamento financeiro atual.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:-translate-y-0.5"
                    >
                        <Plus size={20} strokeWidth={3} /> Lançar Movimento
                    </button>
                </header>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <ArrowUpCircle size={24} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Entradas</p>
                                <p className="text-3xl font-black text-gray-900">R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>

                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                        <ArrowDownCircle size={24} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Saídas</p>
                                <p className="text-3xl font-black text-gray-900">R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>

                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm ring-2 ring-indigo-600/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Wallet size={24} />
                                    </div>
                                    <span className={`text-xs font-black px-2 py-1 rounded-md ${totals.saldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {economiaPercent}% economizado
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                                <p className={`text-3xl font-black ${totals.saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-2">
                                    <PieIcon size={20} className="text-indigo-600" /> Para onde vai o dinheiro?
                                </h3>
                                <div className="h-72">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={95}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    animationBegin={0}
                                                    animationDuration={1000}
                                                >
                                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 font-bold">Nenhum gasto cadastrado.</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center text-center px-10">
                                <div className="mx-auto bg-indigo-50 p-5 rounded-full mb-6">
                                    <AlertCircle size={40} className="text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Saúde das Finanças</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {totals.saldo >= 0 ? (
                                        <>Parabéns! Você está com <b>saldo positivo</b> de <span className="text-indigo-600 font-bold">R$ {totals.saldo.toFixed(2)}</span>. Compartilhe suas estratégias na Comunidade!</>
                                    ) : (
                                        <>Cuidado! Seu saldo está <span className="text-rose-600 font-bold">negativo em R$ {Math.abs(totals.saldo).toFixed(2)}</span>. Reveja seus gastos deste mês e ajuste a rota.</>
                                    )}
                                </p>
                                <button 
                                    onClick={() => navigate('/comunidade')}
                                    className="mt-8 mx-auto bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Ver Dicas da Comunidade
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-800">Histórico Completo</h3>
                            <div className="flex gap-2">
                                <span className="hidden md:inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Receitas</span>
                                <span className="hidden md:inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase">Gastos</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            {transactions.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 font-bold">Nenhum lançamento encontrado.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest hidden md:table-header-group">
                                        <tr>
                                            <th className="px-8 py-5">Descrição</th>
                                            <th className="px-8 py-5">Categoria</th>
                                            <th className="px-8 py-5">Valor</th>
                                            <th className="px-8 py-5 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.map((t) => (
                                            <tr key={t.id} className="group hover:bg-gray-50/50 transition-all flex flex-col md:table-row p-4 md:p-0">
                                                <td className="px-2 md:px-8 py-2 md:py-5">
                                                    <p className="font-bold text-gray-800">{t.descricao}</p>
                                                    <p className="text-xs text-gray-400">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                                </td>
                                                <td className="px-2 md:px-8 py-2 md:py-5">
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold inline-block">
                                                        {t.categoria}
                                                    </span>
                                                </td>
                                                <td className="px-2 md:px-8 py-2 md:py-5">
                                                    <p className={`font-black text-base md:text-sm ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                        {t.tipo === 'receita' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </td>
                                                <td className="px-2 md:px-8 py-2 md:py-5 md:text-right">
                                                    <div className="flex justify-start md:justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity mt-2 md:mt-0">
                                                        <button onClick={() => startEdit(t)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors bg-gray-50 md:bg-transparent"><Edit3 size={18} /></button>
                                                        <button onClick={() => deleteItem(t.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors bg-gray-50 md:bg-transparent"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-gray-900">{editingId ? 'Editar Item' : 'Novo Registro'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors text-2xl"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="flex bg-gray-100 p-1.5 rounded-[20px]">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'despesa' })}
                                    className={`flex-1 py-3 text-sm font-black rounded-[15px] transition-all ${form.tipo === 'despesa' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    Gasto (Saída)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'receita' })}
                                    className={`flex-1 py-3 text-sm font-black rounded-[15px] transition-all ${form.tipo === 'receita' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    Entrada
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nome do Registro</label>
                                    <input
                                        type="text"
                                        value={form.descricao}
                                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                        placeholder="Ex: Salário, Aluguel, Uber..."
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Valor R$</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.valor}
                                        onChange={(e) => setForm({ ...form, valor: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all text-xl"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Categoria</label>
                                    <select
                                        value={form.categoria}
                                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"
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
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Data</label>
                                    <input
                                        type="date"
                                        value={form.data}
                                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1"
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
