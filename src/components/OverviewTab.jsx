import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, Trash2, Edit3, CreditCard, Terminal, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OverviewTab({ 
  session, 
  transactions, 
  totals, 
  pieData, 
  startEdit, 
  deleteItem, 
  togglePago, 
  showSensitiveData = true,
  setActiveTab,
  openCommandBar
}) {
  const [cards, setCards] = useState([]);
  const COLORS = ['#6BC270', '#E11D48', '#F59E0B', '#1C2D1A', '#8B5CF6', '#EC4899', '#06B6D4'];

  useEffect(() => {
    if (session?.user?.id) {
      fetchCards();
    }
  }, [session]);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Erro ao buscar cartões para widget:', err);
    }
  };

  const formatMoney = (value) => {
    if (!showSensitiveData) return 'R$ ••••';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const economiaPercent = totals.receitas > 0 ? ((totals.saldo / totals.receitas) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      
      {/* Widget de Comando Rápido Proeminente */}
      <div 
        onClick={openCommandBar}
        className="bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-transparent backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg cursor-pointer hover:border-primary-500/30 transition-all duration-300 group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary-500/10 text-primary-400 rounded-2xl border border-primary-500/20 group-hover:scale-105 transition-transform duration-300">
            <Terminal size={26} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white group-hover:text-primary-400 transition-colors">Comandos Rápidos (Pressione "/")</h3>
            <p className="text-xs text-gray-400 font-bold mt-1 max-w-lg leading-relaxed">
              Escreva comandos para lançar transações instantâneas ou navegar. Ex: <span className="text-[#00f0ff] font-mono">/gasto 45.00 Mercado</span> ou <span className="text-secondary-400 font-mono">extrato</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-gray-400 font-bold text-xs uppercase tracking-wider group-hover:bg-[#00f0ff] group-hover:text-[#0A0C10] transition-all duration-300">
          <span>Abrir Console</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Entradas */}
        <div className="bg-white/5 backdrop-blur-md p-7 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:border-primary-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-500/10 text-primary-400 rounded-2xl border border-primary-500/10">
              <ArrowUpCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Entradas</p>
          <p className="text-3xl font-black text-white relative z-10">
            {formatMoney(totals.receitas)}
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white/5 backdrop-blur-md p-7 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:border-rose-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-550/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-rose-500/10 text-rose-450 rounded-2xl border border-rose-500/10">
              <ArrowDownCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Saídas</p>
          <p className="text-3xl font-black text-white relative z-10">
            {formatMoney(totals.despesas)}
          </p>
        </div>

        {/* Saldo Atual */}
        <div className="bg-white/5 backdrop-blur-md p-7 rounded-2xl border border-white/10 shadow-sm ring-2 ring-primary-500/10 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-500/15 text-primary-400 rounded-2xl border border-primary-500/10">
              <Wallet size={24} />
            </div>
            {showSensitiveData && (
              <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${totals.saldo >= 0 ? 'bg-primary-500/10 text-primary-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {economiaPercent}% economizado
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Saldo Atual</p>
          <p className={`text-3xl font-black relative z-10 ${totals.saldo >= 0 ? 'text-primary-455' : 'text-rose-450'}`}>
            {formatMoney(totals.saldo)}
          </p>
        </div>

        {/* A Pagar (Previsto) */}
        <div className="bg-white/5 backdrop-blur-md p-7 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/10">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">A Pagar (Previsto)</p>
          <p className="text-3xl font-black text-white relative z-10">
            {formatMoney(totals.aPagar || 0)}
          </p>
        </div>
      </div>

      {/* Credit Cards Radial Limit Widget */}
      {cards.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CreditCard size={20} className="text-primary-500" /> Limites de Crédito
            </h3>
            <button 
              onClick={() => setActiveTab('cartoes')}
              className="text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors border border-primary-500/20 px-3.5 py-1.5 rounded-full"
            >
              Ver Faturas
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map(card => {
              const used = card.total_limit - card.available_limit;
              const pct = card.total_limit > 0 ? (used / card.total_limit) * 100 : 0;
              
              // SVG radial formulas
              const radius = 30;
              const circ = 2 * Math.PI * radius;
              const strokeOffset = circ - (pct / 100) * circ;

              return (
                <div 
                  key={card.id}
                  onClick={() => setActiveTab('cartoes')}
                  className="bg-white/2 border border-white/5 hover:border-white/15 hover:bg-white/5 p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 group"
                >
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle 
                        cx="32" cy="32" r={radius} 
                        className="stroke-white/5 fill-transparent" 
                        strokeWidth="5"
                      />
                      <circle 
                        cx="32" cy="32" r={radius} 
                        className="fill-transparent transition-all duration-500" 
                        style={{ stroke: card.color_hex }}
                        strokeWidth="5"
                        strokeDasharray={circ}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-white">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-xs text-white truncate group-hover:text-primary-400 transition-colors">{card.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Comprometido</p>
                    <p className="text-xs font-black text-rose-400 mt-0.5">
                      {formatMoney(used)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Charts & Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-sm">
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
            <PieChart size={20} className="text-primary-500" /> Para onde vai o dinheiro?
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
                  <Tooltip contentStyle={{ background: '#0c0e12', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold">Nenhum gasto cadastrado.</div>
            )}
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-center text-center px-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="mx-auto bg-white/5 p-5 rounded-[24px] mb-6 shadow-inner ring-1 ring-white/10 relative z-10">
            <AlertCircle size={40} className="text-primary-500" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 relative z-10">Saúde das Finanças</h3>
          <p className="text-gray-400 leading-relaxed font-medium relative z-10">
            {totals.saldo >= 0 ? (
              <>Parabéns! Você está com <b className="text-primary-400">saldo positivo</b> de <span className="text-primary-400 font-black">{formatMoney(totals.saldo)}</span>. Organize suas próximas metas e mantenha o ritmo!</>
            ) : (
              <>Cuidado! Seu saldo está <span className="text-rose-450 font-black">negativo em {formatMoney(Math.abs(totals.saldo))}</span>. Reveja seus gastos deste mês e ajuste a rota.</>
            )}
          </p>
        </div>
      </div>

      {/* Histórico Integrado (Transações) */}
      <div id="historico-table" className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm overflow-hidden mt-8">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
          <h3 className="text-xl font-black text-white">Histórico Recente</h3>
          <div className="flex gap-2">
            <span className="hidden md:inline-block px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">+ Receitas</span>
            <span className="hidden md:inline-block px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">- Gastos</span>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {transactions.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-bold flex flex-col items-center">
              <Wallet size={48} className="text-gray-600 mb-4" />
              Nenhum lançamento encontrado ainda.
            </div>
          ) : (
            <table className="w-full text-left">
               <thead className="bg-white/2 text-gray-450 text-[10px] uppercase font-black tracking-widest hidden md:table-header-group">
                 <tr>
                    <th className="px-8 py-6">Descrição</th>
                    <th className="px-8 py-6">Categoria</th>
                    <th className="px-8 py-6">Valor</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {transactions.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/2 transition-all flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-2 md:px-8 py-4 md:py-6">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{t.descricao}</p>
                            {t.pago === false && (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">Pendente</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <span className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl text-[11px] font-bold inline-block border border-white/5">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <p className={`font-black text-lg md:text-md ${t.tipo === 'receita' ? 'text-primary-500' : 'text-white'}`}>
                          {t.tipo === 'receita' ? '+' : '-'} {formatMoney(t.valor)}
                        </p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6 md:text-right">
                        <div className="flex justify-start md:justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-2 md:mt-0 items-center">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-400 mr-2" title="Marcar como Pago/Recebido">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-white/5"
                              checked={t.pago !== false}
                              onChange={() => togglePago(t)}
                            />
                            {t.pago !== false ? 'Pago' : 'Pendente'}
                          </label>
                          <button onClick={() => startEdit(t)} aria-label="Editar" className="p-3 text-primary-500 hover:bg-white/5 rounded-xl transition-colors bg-white/5 md:bg-transparent" title="Editar">
                             <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteItem(t.id)} aria-label="Apagar" className="p-3 text-rose-450 hover:bg-rose-500/10 rounded-xl transition-colors bg-white/5 md:bg-transparent" title="Apagar">
                             <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                 ))}
               </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
