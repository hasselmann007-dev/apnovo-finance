import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, TrendingUp } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Setup initial profile
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName || email.split('@')[0],
            meta_economia: 1000 // default goal
          }, { onConflict: 'id' });
        }
        
        setErrorMsg('Cadastro realizado! Verifique seu email caso necessário, ou faça login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-primary-700 dark:text-slate-100 transition-colors">
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden md:flex flex-col justify-center items-start w-1/2 p-20 bg-primary-700 text-white relative overflow-hidden">
        {/* Abstract Green Shapes for premium feel */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white text-primary-700 p-3 rounded-2xl shadow-xl">
               <TrendingUp size={32} strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-poppins font-black tracking-tight tracking-tighter">FINANCE</span>
              <span className="text-xl font-poppins font-semibold text-primary-100 uppercase tracking-widest">ORGANIZER</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-poppins font-bold mb-6 leading-tight">
            Smart Financial<br />
            <span className="text-primary-500">Organization</span> Solutions
          </h1>
          <p className="text-lg text-primary-100 font-medium max-w-md">
            Taking control of your finances has never been easier. Stay organized and achieve your financial goals.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-8 bg-[#F4F5F7] dark:bg-slate-900 selection:bg-primary-100 relative transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-primary-700/5 relative z-10 border border-gray-100 dark:border-slate-700 transition-colors">
          
          <div className="flex flex-col items-center mb-10 md:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-primary-700 text-white p-2.5 rounded-xl shadow-md">
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none text-primary-700 dark:text-white">
                <span className="text-2xl font-poppins font-black tracking-tighter">FINANCE</span>
                <span className="text-[10px] font-poppins font-bold uppercase tracking-widest">ORGANIZER</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-poppins font-black text-primary-700 dark:text-white mb-2">
              {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isSignUp ? 'Preencha seus dados para iniciar seu controle financeiro.' : 'Insira suas credenciais para acessar seu painel.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && (
              <div className={`p-4 rounded-2xl text-sm font-bold ${errorMsg.includes('realizado') ? 'bg-primary-50 text-primary-600' : 'bg-rose-50 text-rose-600'} animate-in fade-in`}>
                {errorMsg}
              </div>
            )}
            
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Seu Nome</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800" 
                    placeholder="Ex: João Silva" 
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800" 
                  placeholder="seu@email.com" 
                  required 
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center px-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha</label>
                {!isSignUp && (
                  <a href="/recuperar" className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors">Esqueceu a senha?</a>
                )}
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-primary-700 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800" 
                  placeholder="••••••••" 
                  required 
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-600 text-white font-poppins font-bold text-lg py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-700/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Começar Agora' : 'Acessar Meu Painel'}
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-slate-700">
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-gray-500 dark:text-gray-400 font-medium hover:text-primary-600 transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? ' : 'Ainda não é membro? '}
              <span className="font-bold text-primary-600">{isSignUp ? 'Fazer login' : 'Criar conta grátis'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
