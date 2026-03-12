import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

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
          await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: displayName || email.split('@')[0],
            meta_economia: 1000 // default goal
          });
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-indigo-100">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-indigo-100/50">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-200 mb-6">
            <Wallet size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Danilo Cash</h1>
          <p className="text-gray-500 font-medium mt-2 text-center text-sm">
            Tome o controle do seu dinheiro hoje.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {errorMsg && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${errorMsg.includes('realizado') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} animate-in fade-in`}>
              {errorMsg}
            </div>
          )}
          
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Seu Nome</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-gray-800 transition-all focus:bg-white" 
                  placeholder="Ex: Danilo" 
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Email</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-gray-800 transition-all focus:bg-white" 
                placeholder="seu@email.com" 
                required 
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Senha</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-4 pr-10 outline-none font-bold text-gray-800 transition-all focus:bg-white" 
                placeholder="••••••••" 
                required 
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isSignUp ? 'Criar Minha Conta' : 'Acessar Meu Painel'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-gray-500 font-bold text-sm hover:text-indigo-600 transition-colors"
          >
            {isSignUp ? 'Já tenho uma conta. Entrar.' : 'Não tem conta? Criar agora.'}
          </button>
        </div>
      </div>
    </div>
  );
}
