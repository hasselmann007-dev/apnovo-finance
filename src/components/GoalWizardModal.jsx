import React, { useState } from 'react';
import { X, Target, Heart, TrendingDown, Shield, ShoppingCart, ArrowRight, ArrowLeft, CheckCircle, Flame, Rocket, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { id: 'reserva', title: 'Reserva de Emergência', icon: Shield, desc: 'Paz de espírito para imprevistos', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'divida', title: 'Quitar Dívidas', icon: TrendingDown, desc: 'Livre-se dos juros abusivos', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  { id: 'comprar', title: 'Comprar Específico', icon: ShoppingCart, desc: 'Carro, viagem, celular...', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'guardar', title: 'Guardar Dinheiro', icon: Target, desc: 'Investimentos, aposentadoria', color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400', border: 'border-primary-200 dark:border-primary-800' }
];

const MOTIVATIONS = [
  { id: 'seguranca', label: '🛡️ Segurança e Estabilidade' },
  { id: 'liberdade', label: '🕊️ Liberdade de Escolhas' },
  { id: 'prazer', label: '🏖️ Prazer e Realização' },
  { id: 'familia', label: '👨‍👩‍👧‍👦 Cuidar da Família' }
];

export default function GoalWizardModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    titulo: '',
    motive: '',
    valor_objetivo: '',
    monthly_capacity: '',
    plan_type: 'comfortable', // aggressive, comfortable, custom
    prazo: '12 meses',
    valor_inicial: ''
  });

  if (!isOpen) return null;

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = () => {
    // Calcular prazo caso seja diferente
    let prazoStr = formData.prazo;
    if (formData.plan_type === 'aggressive') prazoStr = '6 meses';
    if (formData.plan_type === 'comfortable') prazoStr = '12 meses';

    const newGoal = {
      titulo: formData.titulo || formData.category, // Default to category if title is empty
      valor_objetivo: parseFloat(formData.valor_objetivo) || 0,
      prazo: prazoStr,
      status: 'ativa',
      progresso: parseFloat(formData.valor_inicial) || 0,
      valor_inicial: parseFloat(formData.valor_inicial) || 0,
      hideProgressBar: false,
      motive: formData.motive,
      plan_type: formData.plan_type
    };

    onSave(newGoal);
  };

  const renderStepProgressBar = () => (
    <div className="flex justify-between items-center mb-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10 
            ${step >= i ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
            {step > i ? <CheckCircle size={14} /> : i}
          </div>
          {i < 5 && (
            <div className={`flex-1 h-1 mx-2 rounded-full transition-colors 
              ${step > i ? 'bg-primary-500' : 'bg-gray-100 dark:bg-slate-700'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 sm:px-10 sm:pt-10 pb-4 border-b border-gray-50 dark:border-slate-700/50 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-slate-800/90 z-20 backdrop-blur-sm">
          <div>
            <h3 className="text-2xl font-poppins font-black text-gray-900 dark:text-white flex items-center gap-3">
              <Rocket className="text-primary-500" size={28} /> Assistente de Metas
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Sua jornada gamificada para o sucesso.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:px-10 overflow-y-auto flex-1 custom-scrollbar">
          {renderStepProgressBar()}

          {/* STEP 1: Category */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">Qual o seu objetivo principal?</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium">Escolha uma categoria para começarmos a estruturar sua meta.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <div 
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.title })}
                    className={`cursor-pointer border-2 rounded-3xl p-5 transition-all flex items-start gap-4
                      ${formData.category === cat.title 
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' 
                        : 'border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-slate-800'}`}
                  >
                    <div className={`p-3 rounded-2xl ${cat.color}`}>
                      <cat.icon size={24} />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white mb-1">{cat.title}</h5>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Details & Motive */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Nome da Caixinha / Meta</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder={`Ex: ${formData.category || 'Minha Meta'}...`}
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 outline-none font-bold text-gray-900 dark:text-white transition-all text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Qual o valor total necessário?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary-400 text-xl">R$</span>
                  <input
                    type="number"
                    value={formData.valor_objetivo}
                    onChange={(e) => setFormData({ ...formData, valor_objetivo: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 pl-14 outline-none font-black text-gray-900 dark:text-white transition-all text-2xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Já tem algum valor guardado?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-lg">R$</span>
                  <input
                    type="number"
                    value={formData.valor_inicial}
                    onChange={(e) => setFormData({ ...formData, valor_inicial: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 pl-12 outline-none font-bold text-gray-900 dark:text-white transition-all text-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-3 block">Motivação Emocional</label>
                <div className="grid grid-cols-2 gap-3">
                  {MOTIVATIONS.map((mot) => (
                    <div 
                      key={mot.id}
                      onClick={() => setFormData({ ...formData, motive: mot.id })}
                      className={`cursor-pointer rounded-xl p-3 text-sm font-bold text-center transition-all border
                        ${formData.motive === mot.id 
                          ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700/50 shadow-sm' 
                          : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-700'}`}
                    >
                      {mot.label}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 text-center uppercase tracking-widest max-w-sm mx-auto">
                  Lembrar o "porquê" aumenta suas chances de sucesso em 42%!
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Diagnosis */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6 text-center pt-4">
              <div className="inline-flex p-4 bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400 rounded-full mb-4">
                <Target size={40} className="animate-pulse" />
              </div>
              <h4 className="text-xl font-poppins font-black text-gray-900 dark:text-white mb-2">Diagnóstico Rápido</h4>
              <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Para acumular os <strong className="text-primary-600 dark:text-primary-400">R$ {Math.max(0, parseFloat(formData.valor_objetivo || 0) - parseFloat(formData.valor_inicial || 0)).toLocaleString('pt-BR')}</strong> restantes, precisamos definir o seu <strong>"Ritmo de Poupança"</strong>. 
                Isso deve caber no seu bolso sem gerar estresse.
              </p>

              <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 mt-6 max-w-sm mx-auto text-left">
                 <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-4">Quanto você pode guardar/pagar por MÊS?</label>
                 <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary-400 text-lg">R$</span>
                  <input
                    type="number"
                    value={formData.monthly_capacity}
                    onChange={(e) => setFormData({ ...formData, monthly_capacity: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 focus:border-primary-500 rounded-2xl p-4 pl-12 outline-none font-bold text-gray-900 dark:text-white transition-all text-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Plan Recommendation */}
          {step === 4 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <h4 className="text-xl font-poppins font-black text-gray-900 dark:text-white mb-2">Escolha seu Caminho</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">Analisamos os números. Qual jornada faz mais sentido para você agora?</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Aggressive Plan */}
                <div 
                  onClick={() => setFormData({ ...formData, plan_type: 'aggressive' })}
                  className={`flex-1 cursor-pointer border-2 rounded-[24px] p-6 transition-all relative overflow-hidden group
                    ${formData.plan_type === 'aggressive' 
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 shadow-lg shadow-rose-500/10' 
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-700'}`}
                >
                  {formData.plan_type === 'aggressive' && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-[100px]"></div>}
                  <div className={`p-3 w-max rounded-xl mb-4 ${formData.plan_type === 'aggressive' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-500'}`}>
                    <Flame size={24} />
                  </div>
                  <h5 className="font-poppins font-black text-lg text-gray-900 dark:text-white mb-1">Agressivo</h5>
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Finaliza em ~6 Meses</p>
                  
                  <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                    R$ {((Math.max(0, parseFloat(formData.valor_objetivo || 0) - parseFloat(formData.valor_inicial || 0))) / 6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-400 font-medium">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                    Mais intensidade agora para colher frutos rápido. Exige foco total.
                  </p>
                </div>

                {/* Comfortable Plan */}
                <div 
                  onClick={() => setFormData({ ...formData, plan_type: 'comfortable' })}
                  className={`flex-1 cursor-pointer border-2 rounded-[24px] p-6 transition-all relative overflow-hidden group
                    ${formData.plan_type === 'comfortable' 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10' 
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                >
                  {formData.plan_type === 'comfortable' && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest py-1 px-3 rounded-bl-xl shadow-sm">
                      Recomendado
                    </div>
                  )}
                  <div className={`p-3 w-max rounded-xl mb-4 ${formData.plan_type === 'comfortable' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'}`}>
                    <Heart size={24} />
                  </div>
                  <h5 className="font-poppins font-black text-lg text-gray-900 dark:text-white mb-1">Confortável</h5>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Finaliza em ~12 Meses</p>
                  
                  <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                    R$ {((Math.max(0, parseFloat(formData.valor_objetivo || 0) - parseFloat(formData.valor_inicial || 0))) / 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-400 font-medium">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                    Um ritmo saudável que acomoda imprevistos sem te sufocar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation & Gamification Setup */}
          {step === 5 && (
            <div className="animate-in slide-in-from-right-4 duration-300 text-center py-6">
              <div className="relative w-32 h-32 mx-auto mb-6">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" className="stroke-gray-100 dark:stroke-slate-700" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" fill="none" className="stroke-primary-500 animate-[stroke-dashoffset_2s_ease-in-out_forwards]" strokeWidth="8" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="text-primary-500" size={40} />
                 </div>
              </div>
              
              <h4 className="text-3xl font-poppins font-black text-gray-900 dark:text-white mb-4">Tudo Pronto!</h4>
              <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
                Transformamos sua meta em uma jornada. 
                Cada avanço garantirá <strong>XP</strong>.
                Seu plano de {formData.plan_type === 'aggressive' ? '6' : '12'} meses está ativo!
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 text-left w-full max-w-sm mx-auto">
                 <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                 <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm block mb-1">Dica de Sucesso</span>
                    <span className="text-xs text-amber-600/80 dark:text-amber-500 font-medium">Lembre-se da sua motivação: o sentimento de conquista fará valer a pena.</span>
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:px-10 border-t border-gray-50 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/30">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all
              ${step === 1 
                ? 'opacity-0 pointer-events-none' 
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          
          <button 
            onClick={step === 5 ? handleCreate : nextStep}
            disabled={
              (step === 1 && !formData.category) ||
              (step === 2 && (!formData.titulo || !formData.valor_objetivo || !formData.motive)) ||
              (step === 3 && !formData.monthly_capacity) ||
              (step === 4 && !formData.plan_type)
            }
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
          >
            {step === 5 ? 'Iniciar Jornada' : 'Avançar'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Temporary inline trophy icon if missing
function Trophy(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  );
}
