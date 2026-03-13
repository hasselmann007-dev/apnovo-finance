import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Target, TrendingUp, TrendingDown, Clock, Calendar, Edit2, Trash2, Plus, Minus, Trophy, Rocket, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GoalDetailView({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [goal, setGoal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isRemovingMode, setIsRemovingMode] = useState(false);
  const [transAmount, setTransAmount] = useState('');
  const [transMotive, setTransMotive] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock validation for UI before BD sync
      if (typeof id === 'string' && id.startsWith('mock-')) {
         setGoal({
           id,
           titulo: 'Meta Mockada (Para teste de UI)',
           categoria: 'reserva',
           valor_alvo: 5000,
           valor_inicial: 1000,
           plano: 'agressivo',
           dia_d: new Date(Date.now() + 86400000 * 90).toISOString(),
           created_at: new Date().toISOString()
         });
         setTransactions([
           { id: '1', tipo: 'adicao', valor: 500, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
           { id: '2', tipo: 'adicao', valor: 300, created_at: new Date(Date.now() - 86400000 * 15).toISOString() }
         ]);
         setLoading(false);
         return;
      }

      // Fetch Goal
      const { data: goalData, error: goalError } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();
        
      if (goalError) throw goalError;
      setGoal(goalData);

      // Fetch Transactions
      const { data: transData, error: transError } = await supabase
        .from('movimentacoes_meta')
        .select('*')
        .eq('meta_id', id)
        .order('created_at', { ascending: true });
        
      if (transError && transError.code !== '42P01') { 
        // 42P01 is relation does not exist, ignore if table not created yet
        throw transError;
      }
      setTransactions(transData || []);

    } catch (error) {
      console.error("Error fetching goal details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (tipo) => {
    if (!transAmount || isNaN(parseFloat(transAmount)) || parseFloat(transAmount) <= 0) return;
    if (tipo === 'retirada' && !transMotive.trim()) return;

    const val = parseFloat(transAmount);
    // Em meta real conectada
    if (!String(id).startsWith('mock-')) {
      try {
        const { error } = await supabase.from('movimentacoes_meta').insert({
          meta_id: id,
          user_id: session.user.id,
          tipo,
          valor: val,
          motivo: tipo === 'retirada' ? transMotive : null
        });
        if (error) throw error;
      } catch (e) {
        console.error("Error saving transaction", e);
        return;
      }
    }
    
    // update local state
    setTransactions(prev => [...prev, {
      id: Date.now().toString(),
      tipo,
      valor: val,
      motivo: tipo === 'retirada' ? transMotive : null,
      created_at: new Date().toISOString()
    }]);
    
    setTransAmount('');
    setTransMotive('');
    setIsAddingMode(false);
    setIsRemovingMode(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-slate-900 text-primary-600 dark:text-primary-400">Carregando detalhes da meta...</div>;
  }

  if (!goal) {
    return (
      <div className="min-h-screen p-8 bg-[#F4F5F7] dark:bg-slate-900 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold dark:text-white mb-4">Meta não encontrada</h2>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary-600 text-white rounded-xl">Voltar ao painel</button>
      </div>
    );
  }

  // Cálculos matemáticos
  const initialValue = parseFloat(goal.valor_inicial) || 0;
  const totalAdded = transactions.filter(t => t.tipo === 'adicao').reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalRemoved = transactions.filter(t => t.tipo === 'retirada').reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const currentTotal = initialValue + totalAdded - totalRemoved;
  const targetValue = parseFloat(goal.valor_alvo) || 0;
  const remaining = Math.max(0, targetValue - currentTotal);
  
  const percentage = targetValue > 0 ? Math.min(100, Math.max(0, (currentTotal / targetValue) * 100)) : 0;
  
  // Sistema de Nível
  let level = 1;
  if (percentage >= 25) level = 2;
  if (percentage >= 50) level = 3;
  if (percentage >= 75) level = 4;
  if (percentage >= 100) level = 5;

  const levelNames = ["Start", "Bronze", "Prata", "Ouro", "Diamante"];

  // Dia D
  const diaD = goal.dia_d ? new Date(goal.dia_d) : null;
  const daysLeft = diaD ? Math.max(0, Math.ceil((diaD - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  // Chart data preparation (Cumulative Sum)
  let cumulative = initialValue;
  const chartData = transactions.map(t => {
     if (t.tipo === 'adicao') cumulative += parseFloat(t.valor);
     if (t.tipo === 'retirada') cumulative -= parseFloat(t.valor);
     return {
       date: new Date(t.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
       saldo: cumulative,
       timestamp: new Date(t.created_at).getTime()
     };
  });
  
  // Add first point if missing
  if (chartData.length === 0 || transactions.length > 0 && new Date(transactions[0].created_at).getTime() > new Date(goal.created_at).getTime()) {
    chartData.unshift({
      date: new Date(goal.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      saldo: initialValue,
      timestamp: new Date(goal.created_at).getTime()
    });
  }

  // Preenche pelo menos até hoje para o gráfico não ficar esquisito caso haja poucas movimentações
  if (chartData.length > 0) {
     const lastTx = chartData[chartData.length-1];
     if (lastTx.timestamp < new Date().setHours(0,0,0,0)) {
        chartData.push({
          date: 'Hoje',
          saldo: cumulative,
          timestamp: Date.now()
        });
     }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-slate-900 p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
           <div className="flex items-center gap-4">
             <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400">
               <ArrowLeft size={24} />
             </button>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">{goal.categoria || 'Objetivo'}</span>
                 {goal.plano && (
                   <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest flex flex-row items-center gap-1">
                      <Rocket size={10} /> Plano {goal.plano}
                   </span>
                 )}
               </div>
               <h1 className="text-2xl md:text-3xl font-black font-poppins text-gray-900 dark:text-white">{goal.titulo}</h1>
             </div>
           </div>
           
           <div className="flex flex-row items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl flex items-center gap-2 font-bold shadow-sm">
                 <Trophy size={18} /> Nível {level} - {levelNames[level-1]}
              </div>
              <button className="p-2.5 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors tooltip" title="Editar Meta">
                <Edit2 size={18} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Esquerda: Gráficos e Resumo */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Level Tracker Visual */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-poppins font-bold text-gray-900 dark:text-white">Sua Jornada</h3>
                    <span className="text-primary-600 dark:text-primary-400 font-bold">{percentage.toFixed(1)}% Completo</span>
                 </div>
                 
                 <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-slate-700 -translate-y-1/2 rounded-full"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-400 to-amber-400 -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    
                    <div className="relative flex justify-between">
                       {[1,2,3,4,5].map(step => (
                         <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 z-10 transition-colors ${
                               level >= step 
                                ? 'bg-primary-500 border-white dark:border-slate-800 text-white shadow-md' 
                                : 'bg-gray-200 dark:bg-slate-600 border-white dark:border-slate-800 text-transparent'
                            }`}>
                               {level >= step && <CheckCircle size={14} />}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-2 uppercase">{levelNames[step-1]}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Status Numérico Vertical */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center justify-center">
                    <span className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Valor Inicial</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1">R$ {initialValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex gap-1 items-center"><TrendingUp size={12}/> Guardado</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">+R$ {totalAdded.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center justify-center">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex gap-1 items-center"><TrendingDown size={12}/> Retirado</span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">-R$ {totalRemoved.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center justify-center">
                    <span className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Valor Atual</span>
                    <span className="text-xl font-black text-primary-600 dark:text-primary-400">R$ {currentTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                 </div>
              </div>

              {/* Gráfico Recharts */}
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-6">Gráfico de Crescimento</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4AA150" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4AA150" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Saldo']}
                      />
                      <Area type="monotone" dataKey="saldo" stroke="#4AA150" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
           </div>

           {/* Direita: Ações Rápidas, Dia D e Histórico */}
           <div className="space-y-6">
              
              {/* Dia D Panel */}
              <div className="bg-primary-900 dark:bg-slate-800 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary-800 dark:bg-slate-700 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                 <h3 className="text-primary-200 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={16}/> Dia D Acionável</h3>
                 <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-black">{daysLeft}</span>
                    <span className="text-primary-200 dark:text-slate-400 mb-1">dias restantes</span>
                 </div>
                 <p className="text-sm text-primary-100 dark:text-slate-300 leading-relaxed max-w-[200px]">
                    {percentage >= 100 ? "Missão Cumprida! Parabéns!" : `Faltam R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits:2})} para bater a meta oficial.`}
                 </p>
                 <div className="mt-6 flex justify-between items-center text-xs text-primary-200 dark:text-slate-400 border-t border-primary-800 dark:border-slate-700 pt-4">
                    <span>Lembrete:</span>
                    <span className="font-bold">{diaD ? diaD.toLocaleDateString('pt-BR') : 'Não definido'}</span>
                 </div>
              </div>

              {/* Ações */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
                 <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-4">Movimentar</h3>
                 
                 {!isAddingMode && !isRemovingMode ? (
                   <div className="space-y-3">
                     <button onClick={() => setIsAddingMode(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 outline-none text-white py-4 rounded-2xl font-bold font-poppins transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Plus size={20} /> Guardar Dinheiro
                     </button>
                     <button onClick={() => setIsRemovingMode(true)} className="w-full bg-gray-50 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-gray-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 outline-none py-3 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50">
                        <Minus size={18} /> Resgatar Valor
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex justify-between items-center">
                         <h4 className={`font-bold ${isAddingMode ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {isAddingMode ? 'Novo Aporte' : 'Resgate Excepcional'}
                         </h4>
                         <button onClick={() => { setIsAddingMode(false); setIsRemovingMode(false); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                      </div>
                      
                      <div className="space-y-3">
                         <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Qual o valor?</label>
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                               <input 
                                 type="number" 
                                 value={transAmount}
                                 onChange={(e) => setTransAmount(e.target.value)}
                                 className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all font-bold"
                                 placeholder="0.00"
                               />
                            </div>
                         </div>
                         
                         {isRemovingMode && (
                           <div className="animate-in fade-in duration-300">
                              <label className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-1">Motivo do Saque (Obrigatório)</label>
                              <input 
                                type="text" 
                                value={transMotive}
                                onChange={(e) => setTransMotive(e.target.value)}
                                className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white transition-all"
                                placeholder="E.g. Emergência médica, imprevisto..."
                              />
                           </div>
                         )}

                         <button 
                            onClick={() => handleTransaction(isAddingMode ? 'adicao' : 'retirada')}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
                               isAddingMode ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                            }`}
                         >
                            Confirmar
                         </button>
                      </div>
                   </div>
                 )}
              </div>

              {/* Histórico Recente */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
                 <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-4">Extrato da Meta</h3>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {transactions.length === 0 ? (
                       <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Nenhuma movimentação registrada.</p>
                    ) : (
                       transactions.slice().reverse().map((t, idx) => (
                         <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{t.tipo === 'adicao' ? 'Aporte' : 'Resgate'}</span>
                               <span className="text-xs text-gray-500 dark:text-slate-400">{new Date(t.created_at).toLocaleDateString('pt-BR')} {t.motivo ? `- ${t.motivo}` : ''}</span>
                            </div>
                            <span className={`font-bold ${t.tipo === 'adicao' ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {t.tipo === 'adicao' ? '+' : '-'} R$ {(parseFloat(t.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                         </div>
                       ))
                    )}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
