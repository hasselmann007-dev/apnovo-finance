import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TrendingUp, Plus, Shield, Component, Coins, Award, ArrowUpCircle, X, Edit3, Trash2 } from 'lucide-react';

export default function InvestmentsTab({ session }) {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    ativo: '',
    categoria: 'Renda Fixa',
    valor_investido: '',
    rendimento_percentual: ''
  });

  const COLORS = ['#6BC270', '#8B5CF6', '#F59E0B', '#06B6D4', '#9CA3AF'];

  useEffect(() => {
    if (session?.user?.id) {
      fetchInvestimentos();
    }
  }, [session]);

  const fetchInvestimentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor_investido);
    const rendimento = parseFloat(form.rendimento_percentual) || 0;

    if (!form.ativo || isNaN(valor)) return;

    try {
      const payload = {
        user_id: session.user.id,
        ativo: form.ativo,
        categoria: form.categoria,
        valor_investido: valor,
        rendimento_percentual: rendimento
      };

      if (editingId) {
        const { error } = await supabase.from('investimentos').update(payload).eq('id', editingId);
        if (!error) {
          setPortfolio(portfolio.map(item => item.id === editingId ? { ...item, ...payload } : item));
        }
      } else {
        const { data, error } = await supabase.from('investimentos').insert(payload).select().single();
        if (!error && data) {
          setPortfolio([data, ...portfolio]);
        }
      }
      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Certeza que deseja remover este ativo?")) {
      const { error } = await supabase.from('investimentos').delete().eq('id', id);
      if (!error) {
        setPortfolio(portfolio.filter(item => item.id !== id));
      }
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      ativo: item.ativo,
      categoria: item.categoria,
      valor_investido: item.valor_investido.toString(),
      rendimento_percentual: item.rendimento_percentual.toString()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ ativo: '', categoria: 'Renda Fixa', valor_investido: '', rendimento_percentual: '' });
  };

  const getCategoryIcon = (categoria) => {
    switch (categoria) {
      case 'Renda Fixa': return <Shield size={20} />;
      case 'Ações': return <TrendingUp size={20} />;
      case 'FIIs': return <Component size={20} />;
      case 'Cripto': return <Coins size={20} />;
      default: return <Award size={20} />;
    }
  };

  const getCategoryColor = (categoria) => {
    switch (categoria) {
      case 'Renda Fixa': return 'bg-primary-50 text-primary-600';
      case 'Ações': return 'bg-purple-50 text-purple-600';
      case 'FIIs': return 'bg-orange-50 text-orange-600';
      case 'Cripto': return 'bg-cyan-50 text-cyan-600';
      default: return 'bg-gray-50 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const pieData = useMemo(() => {
    const groups = {};
    portfolio.forEach(item => {
      groups[item.categoria] = (groups[item.categoria] || 0) + Number(item.valor_investido);
    });
    return Object.keys(groups).map(name => ({ name, value: groups[name] }));
  }, [portfolio]);

  const totalPatrimonio = useMemo(() => {
    return portfolio.reduce((sum, item) => sum + Number(item.valor_investido), 0);
  }, [portfolio]);

  const rendimentoEstimadoMes = useMemo(() => {
    return portfolio.reduce((sum, item) => {
       const ganho = Number(item.valor_investido) * (Number(item.rendimento_percentual) / 100);
       return sum + ganho;
    }, 0);
  }, [portfolio]);

  const rentabilidadeMedia = totalPatrimonio > 0 ? (rendimentoEstimadoMes / totalPatrimonio) * 100 : 0;

  if (loading) return <div className="p-10 text-center font-poppins font-bold text-gray-400">Carregando ativos...</div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-600 p-7 rounded-[32px] shadow-xl shadow-primary-600/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-bl-[150px] opacity-10 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-sm font-poppins font-bold text-primary-100 uppercase tracking-widest mb-1 relative z-10">Patrimônio Total</p>
          <p className="text-4xl font-poppins font-black text-white relative z-10">
            R$ {totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm relative z-10">
             <Award size={16} className="text-white" />
             <span className="text-xs font-bold text-white uppercase tracking-widest">
               Nível: {totalPatrimonio > 50000 ? 'Investidor Ouro' : totalPatrimonio > 10000 ? 'Investidor Prata' : 'Investidor Iniciante'}
             </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-7 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/20 rounded-bl-[100px] opacity-20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <ArrowUpCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Rendimento Acumulado</p>
          <p className="text-3xl font-poppins font-black text-gray-900 dark:text-white relative z-10">+ R$ {rendimentoEstimadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-7 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-bl-[100px] opacity-20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Rentabilidade Média</p>
          <p className="text-3xl font-poppins font-black text-primary-600 dark:text-primary-400 relative z-10">+ {rentabilidadeMedia.toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-poppins font-black text-gray-800 dark:text-white">Alocação da Carteira</h3>
             <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300 font-bold text-[10px] rounded-full uppercase">Visão Atual</span>
          </div>
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 font-bold">Nenhum investimento.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-poppins font-black text-gray-800 dark:text-white">Meus Ativos</h3>
             <span className="text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-xl dark:bg-slate-700/50">
               {portfolio.length}
             </span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {portfolio.length === 0 ? (
                <p className="text-center text-gray-400 mt-10 font-bold">Inicie agora o seu primeiro aporte!</p>
            ) : (
                portfolio.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors group border border-transparent dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-2xl ${getCategoryColor(item.categoria)}`}>
                        {getCategoryIcon(item.categoria)}
                    </div>
                    <div>
                        <p className="font-poppins font-bold text-gray-900 dark:text-white">{item.ativo}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">{item.categoria}</p>
                    </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-left md:text-right">
                        <p className="font-poppins font-black text-gray-900 dark:text-white">
                        R$ {Number(item.valor_investido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                           {Number(item.rendimento_percentual) > 0 ? '+' : ''}{Number(item.rendimento_percentual).toFixed(2)}% de rent.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(item)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors dark:hover:bg-primary-900/30">
                            <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors dark:hover:bg-rose-900/30">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-2xl font-poppins font-bold shadow-2xl shadow-primary-600/30 transition-all hover:scale-105 flex items-center gap-3 z-40 group border border-primary-500"
      >
        <Plus size={24} strokeWidth={3} className="bg-white text-primary-600 rounded-full p-0.5 group-hover:rotate-90 transition-transform" />
        Novo Aporte
      </button>

      {/* Modal Novo Aporte */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="text-2xl font-poppins font-black text-primary-700 dark:text-white">{editingId ? 'Editar Aporte' : 'Novo Aporte'}</h3>
                    <button onClick={closeModal} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors shadow-sm"><X size={24} /></button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="text-[10px] font-poppins font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nome do Ativo</label>
                            <input
                                type="text"
                                value={form.ativo}
                                onChange={(e) => setForm({ ...form, ativo: e.target.value })}
                                placeholder="Ex: Tesouro Selic, ITUB4, Bitcoin..."
                                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-poppins font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Categoria</label>
                            <select
                                value={form.categoria}
                                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white appearance-none"
                            >
                                <option>Renda Fixa</option>
                                <option>Ações</option>
                                <option>FIIs</option>
                                <option>Cripto</option>
                                <option>Outros</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-poppins font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Valor Aportado R$</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.valor_investido}
                                    onChange={(e) => setForm({ ...form, valor_investido: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-black text-xl text-primary-700 dark:text-white transition-all focus:bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-poppins font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Aumento/Rent. (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.rendimento_percentual}
                                    onChange={(e) => setForm({ ...form, rendimento_percentual: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-600 dark:text-primary-400 transition-all focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full text-white py-5 rounded-[20px] font-poppins font-black text-lg transition-all shadow-xl hover:-translate-y-1 bg-primary-600 hover:bg-primary-700 shadow-primary-600/20 mt-4"
                    >
                        {editingId ? 'Salvar Alterações' : 'Confirmar Aporte'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
