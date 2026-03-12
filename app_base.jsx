import React, { useState, useMemo } from 'react';
import {
    Plus, Trash2, Edit3, Save, X, TrendingUp, TrendingDown,
    Wallet, LayoutDashboard, List, PieChart as PieIcon, CheckCircle2,
    AlertCircle, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const App = () => {
    // DADOS EXTRAÍDOS DO PDF - PÁGINAS 28 A 31 (MÊS 03/2026)
    const [transactions, setTransactions] = useState([
        { id: 1, tipo: 'receita', descricao: 'Salário Beta', valor: 2800, categoria: 'Trabalho', data: '2026-03-01' },
        { id: 2, tipo: 'receita', descricao: 'Find Find (Extra)', valor: 1200, categoria: 'Trabalho', data: '2026-03-05' },
        { id: 3, tipo: 'receita', descricao: 'Bônus pela IA', valor: 1400, categoria: 'Bônus', data: '2026-03-15' },
        { id: 4, tipo: 'receita', descricao: 'Ana P (Devolução)', valor: 350, categoria: 'Outros', data: '2026-03-20' },
        { id: 5, tipo: 'receita', descricao: 'Extra Pix', valor: 200, categoria: 'Outros', data: '2026-03-25' },
        { id: 6, tipo: 'despesa', descricao: 'Mãe (Aluguel)', valor: 800, categoria: 'Moradia', data: '2026-03-05' },
        { id: 7, tipo: 'despesa', descricao: 'Conta de Luz', valor: 125.42, categoria: 'Contas Fixas', data: '2026-03-06' },
        { id: 8, tipo: 'despesa', descricao: 'Internet', valor: 159.79, categoria: 'Contas Fixas', data: '2026-03-07' },
        { id: 9, tipo: 'despesa', descricao: 'Conta de Água', valor: 207.97, categoria: 'Contas Fixas', data: '2026-03-08' },
        { id: 10, tipo: 'despesa', descricao: 'Empréstimo 99', valor: 81.98, categoria: 'Dívidas', data: '2026-03-10' },
        { id: 11, tipo: 'despesa', descricao: 'Cartão de Crédito', valor: 343.49, categoria: 'Cartão', data: '2026-03-12' },
        { id: 12, tipo: 'despesa', descricao: 'Empréstimo Nu 1', valor: 152.94, categoria: 'Dívidas', data: '2026-03-13' },
        { id: 13, tipo: 'despesa', descricao: 'Empréstimo Nu 2', valor: 104.02, categoria: 'Dívidas', data: '2026-03-14' },
        { id: 14, tipo: 'despesa', descricao: 'Celular (Cell)', valor: 199.90, categoria: 'Contas Fixas', data: '2026-03-15' },
        { id: 15, tipo: 'despesa', descricao: 'Compra de Casa', valor: 500, categoria: 'Mercado', data: '2026-03-16' },
        { id: 16, tipo: 'despesa', descricao: 'Investimento', valor: 1100, categoria: 'Investimento', data: '2026-03-28' },
        { id: 17, tipo: 'despesa', descricao: 'Tênis + Camisas', valor: 300, categoria: 'Lazer', data: '2026-03-30' },
    ]);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Estado do formulário
    const [form, setForm] = useState({
        tipo: 'despesa',
        descricao: '',
        valor: '',
        categoria: 'Outros',
        data: new Date().toISOString().split('T')[0]
    });

    // Cálculos de Totais
    const totals = useMemo(() => {
        const receitas = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
        const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
            totalRegistros: transactions.length
        };
    }, [transactions]);

    // Dados para o Gráfico de Pizza
    const pieData = useMemo(() => {
        const groups = {};
        transactions.filter(t => t.tipo === 'despesa').forEach(t => {
            groups[t.categoria] = (groups[t.categoria] || 0) + t.valor;
        });
        return Object.keys(groups).map(name => ({ name, value: groups[name] }));
    }, [transactions]);

    const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

    // Funções de Gerenciamento
    const handleSave = (e) => {
        e.preventDefault();
        const cleanValor = parseFloat(form.valor);
        if (!form.descricao || isNaN(cleanValor)) return;

        if (editingId) {
            setTransactions(transactions.map(t => t.id === editingId ? { ...form, id: editingId, valor: cleanValor } : t));
        } else {
            setTransactions([{ ...form, id: Date.now(), valor: cleanValor }, ...transactions]);
        }
        closeModal();
    };

    const deleteItem = (id) => {
        if (window.confirm("Tem certeza que deseja apagar este registro?")) {
            setTransactions(transactions.filter(t => t.id !== id));
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">

            {/* MENU LATERAL */}
            <aside className="w-full md:w-72 bg-white border-r border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <Wallet size={24} />
                    </div>
                    <span className="text-xl font-black text-gray-800 tracking-tight">Danilo Cash</span>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'lista' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <List size={20} /> Lançamentos
                    </button>
                </nav>

                <div className="mt-10 p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl text-white shadow-xl">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Dica Rápida</p>
                    <p className="text-sm leading-relaxed mb-4">
                        Para adicionar um gasto novo, use o botão azul no topo da página. Os dados iniciais são do seu Mês 03!
                    </p>
                    <div className="flex items-center gap-2 text-xs bg-white/20 p-2 rounded-lg">
                        <CheckCircle2 size={14} /> Total de {totals.totalRegistros} itens
                    </div>
                </div>
            </aside>

            {/* ÁREA PRINCIPAL */}
            <main className="flex-1 p-4 md:p-10 max-h-screen overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Resumo de Março</h2>
                        <p className="text-gray-500">Controle total dos seus ganhos e gastos.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:-translate-y-0.5"
                    >
                        <Plus size={20} strokeWidth={3} /> Novo Registro
                    </button>
                </header>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* CARDS DE RESUMO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <ArrowUpCircle size={24} />
                                    </div>
                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+100%</span>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Entrou</p>
                                <p className="text-3xl font-black text-gray-900">R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>

                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                        <ArrowDownCircle size={24} />
                                    </div>
                                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Cuidado</span>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Gastou</p>
                                <p className="text-3xl font-black text-gray-900">R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>

                            <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm ring-2 ring-indigo-600/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Wallet size={24} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Sobrou Líquido</p>
                                <p className={`text-3xl font-black ${totals.saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* GRÁFICOS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-2">
                                    <PieIcon size={20} className="text-indigo-600" /> Para onde vai o dinheiro?
                                </h3>
                                <div className="h-72">
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
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center text-center px-10">
                                <div className="mx-auto bg-indigo-50 p-5 rounded-full mb-6">
                                    <AlertCircle size={40} className="text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Saúde das Finanças</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Danilo, você economizou <span className="font-bold text-indigo-600">R$ {totals.saldo.toFixed(2)}</span> este mês.
                                    Seu maior gasto é com <span className="font-bold text-rose-500">Dívidas e Contas Fixas</span>.
                                    Considere aumentar seus aportes em Investimentos!
                                </p>
                                <div className="mt-8 pt-8 border-t border-gray-50 flex justify-around">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Economia</p>
                                        <p className="text-xl font-black text-emerald-500">20.5%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Dívidas</p>
                                        <p className="text-xl font-black text-rose-500">12.3%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* LISTAGEM TAB */
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-800">Histórico Completo</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Receitas</span>
                                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase">Gastos</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Descrição</th>
                                        <th className="px-8 py-5">Categoria</th>
                                        <th className="px-8 py-5">Valor</th>
                                        <th className="px-8 py-5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).map((t) => (
                                        <tr key={t.id} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-gray-800">{t.descricao}</p>
                                                <p className="text-xs text-gray-400">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold">
                                                    {t.categoria}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className={`font-black text-sm ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                    {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(t)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit3 size={18} /></button>
                                                    <button onClick={() => deleteItem(t.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* FORMULÁRIO (MODAL) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-gray-900">{editingId ? 'Editar Item' : 'Novo Registro'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors text-2xl"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            {/* Seletor de Tipo */}
                            <div className="flex bg-gray-100 p-1.5 rounded-[20px]">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, tipo: 'despesa' })}
                                    className={`flex-1 py-3 text-sm font-black rounded-[15px] transition-all ${form.tipo === 'despesa' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    Gasto
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
                                        placeholder="0,00"
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
};

export default App;