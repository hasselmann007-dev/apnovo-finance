import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, CheckCircle, Flame, Clock, Award, X, TrendingUp, Trophy, Heart, Rocket, Zap } from 'lucide-react';
import GoalWizardModal from './GoalWizardModal';
import { supabase } from '../lib/supabase';

export default function GoalsTab({ session }) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const [form, setForm] = useState({
    titulo: '',
    valor_objetivo: '',
    prazo: '1 mês',
  });

  const [progressForm, setProgressForm] = useState({ id: null, valorExtra: '' });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setGoals(data);
      } else {
        // Fallback for first time users
        setGoals([
           { id: 'mock-1', titulo: 'Guardar para reserva de emergência', valor_objetivo: 2000, progresso: 500, prazo: '4 meses', status: 'em_andamento' },
           { id: 'mock-2', titulo: 'Reduzir o uso do cartão de crédito', valor_objetivo: 0, progresso: 0, prazo: '60 dias', status: 'em_andamento', hideProgressBar: true }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const cleanValor = parseFloat(form.valor_objetivo) || 0;
    
    // Quick validation
    if (!form.titulo) return;

    try {
      const payload = {
        user_id: session.user.id,
        titulo: form.titulo,
        valor_objetivo: cleanValor,
        progresso: editingGoal ? editingGoal.progresso : 0,
        prazo: form.prazo,
        status: 'em_andamento',
        hideProgressBar: cleanValor === 0
      };

      if (editingGoal && editingGoal.id && !String(editingGoal.id).startsWith('mock')) {
        const { error } = await supabase.from('metas_financeiras').update(payload).eq('id', editingGoal.id);
        if (!error) {
          setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...payload } : g));
        }
      } else {
        // Inserting new
        const { data, error } = await supabase.from('metas_financeiras').insert(payload).select().single();
        if (!error && data) {
           setGoals([...goals.filter(g => !String(g.id).startsWith('mock')), data]);
        } else if (error) {
           // Provide basic fallback if db isn't properly configured yet to not break UI
           const newMock = { id: `mock-${Date.now()}`, ...payload };
           setGoals([...goals.filter(g => !String(g.id).startsWith('mock')), newMock]);
        }
      }
      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleWizardSave = async (goalData) => {
    try {
      const payload = {
        user_id: session.user.id,
        ...goalData
      };

      const { data, error } = await supabase.from('metas_financeiras').insert(payload).select().single();
      if (!error && data) {
         setGoals([...goals.filter(g => !String(g.id).startsWith('mock')), data]);
      } else if (error) {
         // Provide basic fallback if db isn't properly configured yet to not break UI
         const newMock = { id: `mock-${Date.now()}`, ...payload };
         setGoals([...goals.filter(g => !String(g.id).startsWith('mock')), newMock]);
      }
      setIsWizardOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateProgress = async (e) => {
      e.preventDefault();
      const extra = parseFloat(progressForm.valorExtra) || 0;
      if (extra <= 0) return;

      const goal = goals.find(g => g.id === progressForm.id);
      if (!goal) return;

      const currentProg = parseFloat(goal.progresso) || 0;
      const targetObj = parseFloat(goal.valor_objetivo) || 0;
      const newProgress = currentProg + extra;
      const status = newProgress >= targetObj && targetObj > 0 ? 'concluida' : 'em_andamento';

      try {
        if (!String(goal.id).startsWith('mock')) {
            await supabase.from('metas_financeiras').update({ progresso: newProgress, status }).eq('id', goal.id);
        }
        setGoals(goals.map(g => g.id === goal.id ? { ...g, progresso: newProgress, status } : g));
        closeProgressModal();
      } catch (err) {
          console.error(err);
      }
  };

  const deleteGoal = async (id) => {
      if (window.confirm("Deseja mesmo remover esta meta?")) {
          if (!String(id).startsWith('mock')) {
              await supabase.from('metas_financeiras').delete().eq('id', id);
          }
          setGoals(goals.filter(g => g.id !== id));
      }
  };

  const startEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      titulo: goal.titulo,
      valor_objetivo: goal.valor_objetivo.toString(),
      prazo: goal.prazo
    });
    setIsModalOpen(true);
  };

  const openProgressModal = (goal) => {
      setProgressForm({ id: goal.id, valorExtra: '' });
      setIsProgressModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setForm({ titulo: '', valor_objetivo: '', prazo: '1 mês' });
  };

  const closeProgressModal = () => {
      setIsProgressModalOpen(false);
      setProgressForm({ id: null, valorExtra: '' });
  };

  if (loading) return <div className="text-center p-10 font-poppins text-gray-500 dark:text-gray-400 font-bold">Carregando metas...</div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden">
         {/* Kept hidden as Dashboard.jsx now has the header */}
      </header>

      {/* Gamification Top Panel */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-slate-800 dark:to-slate-900 rounded-[32px] p-6 lg:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary-700/20 border border-primary-500/30 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 w-full">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm border border-white/20 shrink-0 relative">
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-bounce">Novo</div>
            <Zap size={40} className="text-amber-400 fill-amber-400" />
          </div>
          <div>
            <span className="text-primary-100 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1 block">Seu Desempenho</span>
            <h2 className="text-2xl lg:text-3xl font-black font-poppins flex items-center justify-center sm:justify-start gap-2">
               Nível 3 <span className="text-amber-400">Bronze</span>
            </h2>
            <p className="text-primary-100 dark:text-slate-300 mt-2 text-sm leading-relaxed max-w-lg">
              Você está focado! Continue guardando para subir de nível e desbloquear novas conquistas exclusivas na plataforma.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0 text-center min-w-[120px]">
             <span className="text-primary-200 dark:text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Sua Ofensiva</span>
             <span className="text-2xl font-black flex items-center justify-center gap-1">4 <Flame size={20} className="text-orange-400 fill-orange-400" /></span>
             <span className="text-[10px] text-primary-200/70 block mt-1 uppercase">Dias seguidos</span>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0 text-center min-w-[120px]">
             <span className="text-primary-200 dark:text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">XP Atual</span>
             <span className="text-2xl font-black text-amber-400">125 <span className="text-sm font-bold text-amber-400/80">xp</span></span>
             <div className="w-full bg-black/20 rounded-full h-1 mt-2">
                <div className="bg-amber-400 h-1 rounded-full w-[45%]"></div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
           const valorObj = parseFloat(goal.valor_objetivo) || 0;
           const prog = parseFloat(goal.progresso) || 0;
           const percent = valorObj > 0 ? Math.min(100, (prog / valorObj) * 100) : 0;
           const isCompleted = goal.status === 'concluida' || percent >= 100;

           return (
             <div key={goal.id} onClick={() => navigate(`/metas/${goal.id}`)} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden group cursor-pointer">
               {!goal.hideProgressBar && (
                 <div className="absolute top-0 left-0 h-1 bg-gray-100 dark:bg-slate-700 w-full">
                    <div className="h-full bg-primary-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                 </div>
               )}
               
               <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}`}>
                    {isCompleted ? <Trophy size={24} /> : <Target size={24} />}
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                     <Clock size={12} /> {goal.prazo}
                   </span>
                   {goal.plan_type && (
                     <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                       <Rocket size={10} /> Plano {goal.plan_type === 'aggressive' ? 'Agressivo' : 'Confortável'}
                     </span>
                   )}
                 </div>
               </div>
               
               <h3 className="text-xl font-poppins font-bold text-gray-900 dark:text-white mb-2 leading-tight pr-4">
                 {goal.titulo}
               </h3>

               {!goal.hideProgressBar ? (
                 <div className="mt-4 mb-2">
                   <div className="flex justify-between text-sm font-bold mb-2">
                     <span className={isCompleted ? "text-amber-500 dark:text-amber-400" : "text-primary-600 dark:text-primary-400"}>R$ {prog.toLocaleString('pt-BR')}</span>
                     <span className="text-gray-400 dark:text-slate-400">R$ {valorObj.toLocaleString('pt-BR')}</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 rounded-full ${isCompleted ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-primary-500'}`} style={{ width: `${percent}%` }}></div>
                   </div>
                   <p className="text-xs text-gray-400 dark:text-slate-400 mt-2 font-medium">
                     {isCompleted ? '🎉 Parabéns! Meta alcançada!' : `Continue avançando, você já tem ${percent.toFixed(0)}% garantido!`}
                   </p>
                 </div>
               ) : (
                 <div className="mt-4 mb-2 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/30 p-3 rounded-xl border border-primary-100 dark:border-primary-800">
                    <Flame size={18} className="animate-pulse" />
                    Manter o foco hoje para concluir a tarefa.
                 </div>
               )}
               
               <div className="pt-4 mt-auto border-t border-gray-50 dark:border-slate-700 flex items-center justify-between transition-opacity">
                  <div className="flex gap-2">
                      <button onClick={() => startEdit(goal)} className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Editar</button>
                      <button onClick={() => deleteGoal(goal.id)} className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Excluir</button>
                  </div>
                  
                  {!goal.hideProgressBar && !isCompleted && (
                    <button onClick={() => openProgressModal(goal)} className="bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-primary-400 p-2 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 group-hover:animate-bounce" title="Adicionar Progresso">
                        <Plus size={18} strokeWidth={3} />
                    </button>
                  )}
                  {isCompleted && (
                     <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-xl" title="Meta Concluída">
                        <CheckCircle size={18} strokeWidth={3} />
                     </div>
                  )}
               </div>
             </div>
           );
        })}
        
        {/* Create new Goal Card Hint */}
        <div onClick={() => setIsWizardOpen(true)} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-slate-700 shadow-sm flex flex-col hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/20 dark:hover:bg-primary-900/20 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer items-center justify-center text-center min-h-[220px] group">
           <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-full shadow-sm text-gray-400 dark:text-slate-400 mb-4 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
             <Plus size={32} />
           </div>
           <h3 className="font-poppins font-bold text-gray-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Criar Nova Caixinha</h3>
           <p className="text-sm text-gray-400 dark:text-slate-400 mt-2">Dê o primeiro passo para sua próxima grande conquista financeira.</p>
        </div>
      </div>

      <GoalWizardModal 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onSave={handleWizardSave} 
      />

      {/* Modal Nova/Editar Meta legacy */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="text-2xl font-poppins font-black text-primary-700 dark:text-white flex items-center gap-3">
                        <Target size={28} /> {editingGoal ? 'Editar Caixinha' : 'Nova Caixinha'}
                    </h3>
                    <button onClick={closeModal} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors shadow-sm"><X size={24} /></button>
                </div>

                <form onSubmit={handleSaveGoal} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Título da Meta</label>
                        <input
                            type="text"
                            value={form.titulo}
                            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                            placeholder="Ex: Reserva de Emergência, Viagem..."
                            className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Objetivo (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.valor_objetivo}
                                onChange={(e) => setForm({ ...form, valor_objetivo: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-black text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 text-lg"
                            />
                            <span className="text-[9px] text-gray-400 ml-1 mt-1 block">Deixe 0 para criar metas de hábitos.</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Prazo / Duração</label>
                            <select
                                value={form.prazo}
                                onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 appearance-none"
                            >
                                <option>1 mês</option>
                                <option>3 meses</option>
                                <option>6 meses</option>
                                <option>1 ano</option>
                                <option>Sem prazo fixo</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary-600 text-white py-5 rounded-[20px] font-poppins font-black text-lg transition-all shadow-xl shadow-primary-600/20 hover:bg-primary-700 hover:-translate-y-1"
                    >
                        {editingGoal ? 'Salvar Alterações' : 'Criar Caixinha'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Modal Adicionar Progresso */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700 text-center">
                <div className="bg-primary-50/50 dark:bg-slate-700/50 p-6 flex justify-between">
                    <div className="w-24"></div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-slate-600 -mb-12 z-10 mx-auto">
                        <TrendingUp size={32} strokeWidth={2.5} />
                    </div>
                    <div className="w-24 text-right">
                        <button onClick={closeProgressModal} className="p-2 text-gray-400 hover:text-rose-500"><X size={20} /></button>
                    </div>
                </div>

                <form onSubmit={handleUpdateProgress} className="p-8 pt-10 space-y-6">
                    <div>
                        <h4 className="font-poppins font-black text-xl text-primary-700 dark:text-white mb-1">Ótimo avanço!</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Quanto você guardou hoje para essa meta?</p>
                    </div>

                    <div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary-300 dark:text-primary-500 text-xl">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={progressForm.valorExtra}
                                onChange={(e) => setProgressForm({ ...progressForm, valorExtra: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-12 pr-4 outline-none font-black text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 text-2xl"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary-600 text-white py-4 rounded-2xl font-poppins font-black text-lg transition-all shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:scale-[1.02] active:scale-95"
                    >
                        Depositar
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
