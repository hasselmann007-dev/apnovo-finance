import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, ArrowRight, Loader2, TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecoverPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setMessage('');
    
    try {
      // Usando a rota local de redefinição caso haja uma, ou apenas envia o email de recuperação padrão do Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Volta para a raiz para fazer o login
      });
      
      if (error) throw error;
      
      setMessage('Link de recuperação enviado! Verifique sua caixa de entrada.');
      setEmail('');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-primary-700 dark:text-slate-200">
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden md:flex flex-col justify-center items-start w-1/2 p-20 bg-primary-700 dark:bg-slate-900 border-r border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10 w-full max-w-lg">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-100 font-bold hover:text-white transition-colors mb-12 bg-primary-600/30 px-4 py-2 rounded-xl backdrop-blur-sm w-max">
            <ArrowLeft size={16} /> Voltar ao Login
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-500 p-3 rounded-2xl shadow-xl">
               <TrendingUp size={32} strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-black tracking-tighter">FINANCE</span>
              <span className="text-xl font-semibold text-primary-100 uppercase tracking-widest">ORGANIZER</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Esqueceu sua<br />
            <span className="text-primary-500">Senha?</span>
          </h1>
          <p className="text-lg text-primary-100 font-medium max-w-md">
            Não se preocupe, te ajudaremos a recuperar o acesso ao seu painel financeiro rapidamente.
          </p>
        </div>
      </div>

      {/* Right Side - Recovery Form */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-8 bg-[#F4F5F7] dark:bg-slate-900 selection:bg-primary-100 relative">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl shadow-primary-700/5 relative z-10 border border-gray-100 dark:border-slate-700">
          
          <div className="flex flex-col mb-10 md:hidden relative pt-6">
            <Link to="/" className="absolute top-0 left-0 text-gray-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold flex items-center gap-1 transition-colors bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600 text-xs shadow-sm">
                <ArrowLeft size={14} /> Voltar
            </Link>
            <div className="flex items-center gap-3 mt-6 self-center">
              <div className="bg-primary-700 dark:bg-primary-600 text-white p-2.5 rounded-xl shadow-md">
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none text-primary-700 dark:text-white">
                <span className="text-2xl font-black tracking-tighter">FINANCE</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">ORGANIZER</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-primary-700 dark:text-white mb-2">
              Recuperação
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Insira o email associado à sua conta para enviarmos as instruções de redefinição de senha.
            </p>
          </div>

          <form onSubmit={handleRecover} className="space-y-5">
            {errorMsg && (
              <div className="p-4 rounded-2xl text-sm font-bold bg-rose-50 text-rose-600 animate-in fade-in">
                {errorMsg}
              </div>
            )}
            {message && (
              <div className="p-4 rounded-2xl text-sm font-bold bg-primary-50 text-primary-600 animate-in fade-in flex flex-col gap-2 border border-primary-100">
                {message}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider pl-2">Email cadastrado</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 dark:focus:border-primary-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800" 
                  placeholder="seu@email.com" 
                  required 
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-600 text-white font-bold text-lg py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-700/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  Enviar link de recuperação
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
