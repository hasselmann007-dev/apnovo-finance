import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, Trash2, Edit3, CreditCard, Terminal, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

export default function OverviewTab({ 
  session, 
  transactions, 
  totals, 
  pieData: externalPieData, 
  startEdit, 
  deleteItem, 
  togglePago, 
  showSensitiveData = true,
  setActiveTab,
  openCommandBar,
  selectedMonth,
  setSelectedMonth
}) {
  const [cards, setCards] = useState([]);
  const { isDarkMode } = useTheme();
  
  // Estado de filtragem dinâmica por clique na fatia do gráfico (Task 4)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  
  // Ref para o input nativo de mês mobile
  const mobileMonthInputRef = useRef(null);

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

  // Mapeamento de meses em Português
  const getMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  // Cálculo local do PieData para agrupar em Receitas, Despesas Fixas e Investimentos (Task 4)
  const localPieData = useMemo(() => {
    const income = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0);
    const investment = transactions.filter(t => t.tipo === 'despesa' && t.categoria === 'Investimento').reduce((sum, t) => sum + Number(t.valor), 0);
    const expense = transactions.filter(t => t.tipo === 'despesa' && t.categoria !== 'Investimento').reduce((sum, t) => sum + Number(t.valor), 0);

    const data = [];
    if (income > 0) data.push({ name: 'Receitas', value: income, color: '#22C55E', type: 'receita' });
    if (expense > 0) data.push({ name: 'Despesas', value: expense, color: '#EF4444', type: 'despesa' });
    if (investment > 0) data.push({ name: 'Investimentos', value: investment, color: '#8B5CF6', type: 'investimento' });

    return data;
  }, [transactions]);

  // Histórico filtrado dinamicamente via cliques no gráfico
  const filteredTransactionsForList = useMemo(() => {
    if (!selectedCategoryFilter) return transactions;
    if (selectedCategoryFilter === 'receita') {
      return transactions.filter(t => t.tipo === 'receita');
    }
    if (selectedCategoryFilter === 'investimento') {
      return transactions.filter(t => t.tipo === 'despesa' && t.categoria === 'Investimento');
    }
    if (selectedCategoryFilter === 'despesa') {
      return transactions.filter(t => t.tipo === 'despesa' && t.categoria !== 'Investimento');
    }
    return transactions;
  }, [transactions, selectedCategoryFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      
      {/* Mobile Month Selector (Task 1 & Task 5) */}
      <div className="md:hidden flex justify-between items-center mb-2 bg-white dark:bg-white/5 border border-slate-150 dark:border-white/10 p-4 rounded-2xl shadow-sm shadow-indigo-500/5 dark:shadow-none w-full">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">Finanças Consolidadas</p>
        </div>
        <div className="relative">
          <button
            onClick={() => {
              if (mobileMonthInputRef.current) {
                if (typeof mobileMonthInputRef.current.showPicker === 'function') {
                  mobileMonthInputRef.current.showPicker();
                } else {
                  mobileMonthInputRef.current.click();
                }
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className="min-h-[48px] min-w-[48px] px-4 py-2.5 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider shadow-sm"
          >
            <Calendar size={16} className="text-primary-500" />
            <span>{selectedMonth ? getMonthName(selectedMonth).split(' de ')[0] : 'Filtrar'}</span>
          </button>
          <input
            ref={mobileMonthInputRef}
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Widget de Comando Rápido Proeminente */}
      <div 
        onClick={openCommandBar}
        className="bg-white dark:bg-gradient-to-r dark:from-primary-500/10 dark:via-secondary-500/10 dark:to-transparent border border-slate-150 dark:border-white/10 p-6 rounded-2xl shadow-sm shadow-indigo-500/5 dark:shadow-lg cursor-pointer hover:border-primary-500/30 transition-all duration-300 group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-2xl border border-primary-500/20 group-hover:scale-105 transition-transform duration-300">
            <Terminal size={26} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Comandos Rápidos (Pressione "/")</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-bold mt-1 max-w-lg leading-relaxed">
              Escreva comandos para lançar transações instantâneas ou navegar. Ex: <span className="text-[#00c0cc] dark:text-[#00f0ff] font-mono">/gasto 45.00 Mercado</span> ou <span className="text-secondary-600 dark:text-secondary-400 font-mono">extrato</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-slate-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider group-hover:bg-[#00f0ff] group-hover:text-[#0A0C10] group-hover:border-transparent transition-all duration-300">
          <span>Abrir Console</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Entradas */}
        <div className="bg-white dark:bg-white/5 p-7 rounded-2xl border border-slate-150 dark:border-white/10 shadow-sm shadow-indigo-500/5 dark:shadow-none relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-550/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-primary-400 rounded-2xl border border-emerald-500/10">
              <ArrowUpCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-1 relative z-10">Entradas</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">
            {formatMoney(totals.receitas)}
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-white/5 p-7 rounded-2xl border border-slate-150 dark:border-white/10 shadow-sm shadow-indigo-500/5 dark:shadow-none relative overflow-hidden group hover:border-rose-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-550/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/10">
              <ArrowDownCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-1 relative z-10">Saídas</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">
            {formatMoney(totals.despesas)}
          </p>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white dark:bg-white/5 p-7 rounded-2xl border border-slate-150 dark:border-white/10 shadow-sm shadow-indigo-500/5 dark:shadow-none relative overflow-hidden group hover:border-primary-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-550/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3 rounded-2xl border ${totals.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'}`}>
              <Wallet size={24} />
            </div>
            {totals.receitas > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${totals.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'}`}>
                {economiaPercent}% economizado
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-1 relative z-10">Saldo do Período</p>
          <p className={`text-3xl font-black relative z-10 ${totals.saldo >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
            {formatMoney(totals.saldo)}
          </p>
        </div>

        {/* Widgets de Cartões Rápidos */}
        <div className="bg-white dark:bg-white/5 p-7 rounded-2xl border border-slate-150 dark:border-white/10 shadow-sm shadow-indigo-500/5 dark:shadow-none relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/5 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-indigo-500/10 text-[#8B5CF6] rounded-2xl border border-indigo-500/10">
              <CreditCard size={24} />
            </div>
            <button 
              onClick={() => setActiveTab('cartoes')}
              className="text-[10px] font-black uppercase text-[#8B5CF6] hover:underline"
            >
              Ver Tudo
            </button>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-1 relative z-10">Faturas Ativas</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white relative z-10">
            {cards.length} {cards.length === 1 ? 'Cartão' : 'Cartões'}
          </p>
        </div>

      </div>

      {/* Main Charts & Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfico Donut Otimizado (Task 4) */}
        <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-150 dark:border-white/10 shadow-sm shadow-indigo-500/5 dark:shadow-none relative">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-primary-500" /> Alocação Financeira
          </h3>
          
          {/* Mobile Net Balance Stacked directly above the donut (Task 4) */}
          <div className="flex md:hidden flex-col items-center justify-center mb-6 bg-slate-50 dark:bg-white/2 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Saldo Líquido Mensal</span>
            <span className={`text-2xl font-black mt-1 ${totals.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {formatMoney(totals.saldo)}
            </span>
          </div>

          <div className="h-72 relative">
            {localPieData.length > 0 ? (
              <div className="w-full h-full relative">
                
                {/* Desktop Net Balance centered inside the donut hole (Task 4) */}
                <div className="hidden md:flex flex-col items-center justify-center absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <span className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Saldo Líquido</span>
                  <span className={`text-xl font-black mt-0.5 ${totals.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-550'}`}>
                    {formatMoney(totals.saldo)}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={localPieData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      cursor="pointer"
                      onClick={(data) => {
                        const tappedType = data.type;
                        setSelectedCategoryFilter(prev => prev === tappedType ? null : tappedType);
                      }}
                    >
                       {localPieData.map((entry, index) => (
                         <Cell 
                           key={`cell-${index}`} 
                           fill={entry.color} 
                           cornerRadius={8} 
                           className={`transition-all duration-300 stroke-transparent outline-none ${selectedCategoryFilter === entry.type ? 'opacity-100 scale-105' : selectedCategoryFilter ? 'opacity-40' : 'opacity-100'}`}
                         />
                       ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: isDarkMode ? '#0c0e12' : '#ffffff', 
                        borderRadius: '16px', 
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        color: isDarkMode ? '#ffffff' : '#0f172a' 
                      }} 
                    />
                    <Legend 
                      iconType="circle" 
                      onClick={(e) => {
                        const tappedType = localPieData.find(item => item.name === e.value)?.type;
                        if (tappedType) {
                          setSelectedCategoryFilter(prev => prev === tappedType ? null : tappedType);
                        }
                      }}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-gray-400 font-bold">Nenhum lançamento cadastrado.</div>
            )}
          </div>
        </div>
        
        {/* Saúde Financeira Card */}
        <div className="bg-white dark:bg-white/5 border border-slate-150 dark:border-white/10 p-8 rounded-3xl shadow-sm shadow-indigo-500/5 dark:shadow-none flex flex-col justify-center text-center px-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-white/1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="mx-auto bg-slate-150 dark:bg-white/5 p-5 rounded-[24px] mb-6 shadow-inner ring-1 ring-slate-200 dark:ring-white/10 relative z-10">
            <AlertCircle size={40} className="text-primary-600 dark:text-primary-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 relative z-10">Saúde das Finanças</h3>
          <p className="text-slate-600 dark:text-gray-450 leading-relaxed font-semibold relative z-10 max-w-sm mx-auto">
            {totals.saldo >= 0 ? (
              <>Parabéns! Você está com <b className="text-emerald-600 dark:text-primary-400">saldo positivo</b> de <span className="text-emerald-650 dark:text-primary-450 font-black">{formatMoney(totals.saldo)}</span>. Organize suas próximas metas e mantenha o ritmo!</>
            ) : (
              <>Cuidado! Seu saldo está <span className="text-rose-500 font-black">negativo em {formatMoney(Math.abs(totals.saldo))}</span>. Reveja seus gastos deste mês e ajuste a rota.</>
            )}
          </p>
        </div>
      </div>

      {/* Histórico Integrado (Transações) (Com filtro responsivo tátil da Task 4) */}
      <div id="historico-table" className="bg-white dark:bg-white/5 border border-slate-150 dark:border-white/10 rounded-3xl shadow-sm shadow-indigo-500/5 dark:shadow-none overflow-hidden mt-8">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-55/30 dark:bg-white/2">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Histórico Recente</h3>
            {selectedCategoryFilter && (
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-bold">
                Mostrando apenas: <span className={selectedCategoryFilter === 'receita' ? 'text-emerald-500 font-black' : selectedCategoryFilter === 'investimento' ? 'text-purple-500 font-black' : 'text-rose-500 font-black'}>
                  {selectedCategoryFilter === 'receita' ? 'Receitas' : selectedCategoryFilter === 'investimento' ? 'Investimentos' : 'Despesas'}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {selectedCategoryFilter && (
              <button 
                onClick={() => setSelectedCategoryFilter(null)}
                className="px-4 py-2 bg-primary-600 dark:bg-[#00f0ff] text-white dark:text-[#0A0C10] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                Limpar Filtro
              </button>
            )}
            <span className="hidden md:inline-block px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">+ Receitas</span>
            <span className="hidden md:inline-block px-4 py-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">- Gastos</span>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {filteredTransactionsForList.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-gray-400 font-bold flex flex-col items-center">
              <Wallet size={48} className="text-slate-400 dark:text-gray-600 mb-4" />
              Nenhum lançamento encontrado para este filtro.
            </div>
          ) : (
            <table className="w-full text-left">
               <thead className="bg-slate-55/20 dark:bg-white/2 text-slate-500 dark:text-gray-400 text-[10px] uppercase font-black tracking-widest hidden md:table-header-group">
                 <tr>
                    <th className="px-8 py-6">Descrição</th>
                    <th className="px-8 py-6">Categoria</th>
                    <th className="px-8 py-6">Valor</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                 {filteredTransactionsForList.map((t) => (
                    <tr key={t.id} className="group hover:bg-slate-50 dark:hover:bg-white/2 transition-all flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-2 md:px-8 py-4 md:py-6">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">{t.descricao}</p>
                            {t.pago === false && (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">Pendente</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <span className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-350 rounded-xl text-[11px] font-bold inline-block border border-slate-200 dark:border-white/5">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <p className={`font-black text-lg md:text-md ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                          {t.tipo === 'receita' ? '+' : '-'} {formatMoney(t.valor)}
                        </p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6 md:text-right">
                        <div className="flex justify-start md:justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-2 md:mt-0 items-center">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 dark:text-gray-400 mr-2" title="Marcar como Pago/Recebido">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-white/5"
                              checked={t.pago !== false}
                              onChange={() => togglePago(t)}
                            />
                            {t.pago !== false ? 'Pago' : 'Pendente'}
                          </label>
                          <button onClick={() => startEdit(t)} aria-label="Editar" className="p-3 text-slate-600 hover:text-primary-550 dark:text-primary-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors bg-slate-100 dark:bg-white/5 md:bg-transparent" title="Editar">
                             <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteItem(t.id)} aria-label="Apagar" className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors bg-slate-100 dark:bg-white/5 md:bg-transparent" title="Apagar">
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
