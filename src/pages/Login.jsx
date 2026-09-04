import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, ArrowRight, Loader2, Mail, Lock, User, CheckCircle2, ShieldCheck, 
  Sparkles, Zap, CreditCard, PieChart, Moon, Sun, Smartphone, Laptop, Eye, EyeOff, 
  Star, ChevronDown, Check, ArrowUpRight, Activity, Calendar, Terminal
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Auth state
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Default to Free Trial / Sign Up as requested
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Ref to smoothly scroll and focus on auth form
  const authFormRef = useRef(null);
  const nameInputRef = useRef(null);

  const scrollToAuth = (signupMode = true) => {
    setIsSignUp(signupMode);
    setErrorMsg('');
    if (authFormRef.current) {
      authFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (signupMode && nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 400);
    }
  };

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
            display_name: displayName.trim() || email.split('@')[0],
            meta_economia: 1000
          }, { onConflict: 'id' });
        }
        
        setErrorMsg('Cadastro realizado com sucesso! Verifique seu email caso necessário ou faça login para começar.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos. Verifique suas credenciais.' 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-primary-500/20 selection:text-primary-600 dark:selection:text-primary-400">
      
      {/* 1. TOP NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-[#0A0C10]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 md:px-16 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-primary-600 dark:bg-[#00f0ff] p-2 rounded-xl text-white dark:text-[#0A0C10] shadow-md shadow-primary-500/20">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">FINANCE</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-[#00f0ff]">ORGANIZER</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#apresentacao" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">O que é</a>
            <a href="#demonstracao" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Demonstração</a>
            <a href="#missao" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Objetivo</a>
            <a href="#recursos" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Diferenciais</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-150 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all active:scale-95"
              title="Alternar Tema Claro/Escuro"
              aria-label="Alternar Tema"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Quick CTA to Form */}
            <button
              onClick={() => scrollToAuth(false)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-150 dark:hover:bg-white/5 transition-all"
            >
              Já sou membro
            </button>

            <button
              onClick={() => scrollToAuth(true)}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-[#00f0ff] dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] font-black text-xs rounded-xl shadow-lg shadow-primary-500/15 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Testar Grátis</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION & INTEGRATED AUTH HUB */}
      <section id="apresentacao" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-8 md:px-16 overflow-hidden">
        
        {/* Background Ambient Lights */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-500/15 via-secondary-500/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Free Trial Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-wide animate-in fade-in">
              <Sparkles size={14} />
              <span>Teste Gratuito por 14 Dias • Acesso Completo Imediato</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Sua Vida Financeira Sob <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-[#00c0cc] to-secondary-500 dark:from-[#00f0ff] dark:to-[#a78bfa]">Controle Absoluto</span>, Sem Planilhas.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              O <strong>Finance Organizer</strong> é o organizador financeiro moderno feito para quem valoriza tempo. Controle gastos, faturas de múltiplos cartões, limites disponíveis e investimentos em uma interface rápida, limpa e 100% otimizada para celular.
            </p>

            {/* Quick Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Gráficos Donut interativos com filtro tátil</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Gestão real de cartões e faturas futuras</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Console de comandos por voz e texto ("/")</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Modo Claro e Modo Escuro nativos</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => scrollToAuth(true)}
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 dark:bg-[#00f0ff] dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] font-black text-sm rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Experimentar Grátis por 14 Dias</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#demonstracao"
                className="w-full sm:w-auto px-6 py-4 bg-slate-200/60 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-sm rounded-2xl border border-slate-300/50 dark:border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Activity size={18} className="text-primary-500" />
                <span>Ver Demonstração</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 flex items-center justify-center lg:justify-start gap-6 text-[11px] font-bold text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" /> Sem fidelidade
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={15} className="text-primary-500" /> Criptografia Supabase
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone size={16} className="text-secondary-500" /> iPhone & Android
              </span>
            </div>

          </div>

          {/* Right: INTEGRATED AUTHENTICATION HUB (Mesma tela para praticidade máxima) */}
          <div ref={authFormRef} className="lg:col-span-5 w-full">
            <div className="relative bg-white dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 dark:shadow-none transition-all">
              
              {/* Top Form Pill Switcher */}
              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${isSignUp ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <Sparkles size={14} />
                  <span>Teste Grátis (14D)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${!isSignUp ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <Lock size={14} />
                  <span>Entrar na Conta</span>
                </button>
              </div>

              {/* Form Title */}
              <div className="mb-5 text-left">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isSignUp ? 'Comece Seu Teste Gratuito' : 'Bem-vindo de Volta'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">
                  {isSignUp 
                    ? 'Acesso completo liberado por 14 dias sem necessidade de cartão agora.' 
                    : 'Acesse seu painel com segurança e retome seu controle financeiro.'}
                </p>
              </div>

              {/* Error/Success Banner */}
              {errorMsg && (
                <div className={`p-3.5 mb-4 rounded-xl text-xs font-bold ${errorMsg.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'} animate-in fade-in`}>
                  {errorMsg}
                </div>
              )}

              {/* Form Element */}
              <form onSubmit={handleAuth} className="space-y-4 text-left">
                
                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider pl-1">Seu Nome</label>
                    <div className="relative">
                      <input 
                        ref={nameInputRef}
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500 rounded-xl py-3.5 pl-4 pr-10 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all" 
                        placeholder="Ex: Danilo Silva" 
                        required={isSignUp}
                      />
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider pl-1">Seu Melhor Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500 rounded-xl py-3.5 pl-4 pr-10 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all" 
                      placeholder="seu@email.com" 
                      required 
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sua Senha</label>
                    {!isSignUp && (
                      <a href="/recuperar" className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors">
                        Esqueceu a senha?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500 rounded-xl py-3.5 pl-4 pr-10 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all" 
                      placeholder="••••••••" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 dark:bg-[#00f0ff] dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] font-black text-sm rounded-xl transition-all shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Iniciar Meu Teste de 14 Dias' : 'Acessar Meu Painel'}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Sub-note */}
              <div className="mt-5 text-center text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                {isSignUp ? (
                  <span>Já possui uma conta? <button type="button" onClick={() => { setIsSignUp(false); setErrorMsg(''); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Clique para entrar</button></span>
                ) : (
                  <span>Ainda não testou? <button type="button" onClick={() => { setIsSignUp(true); setErrorMsg(''); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Criar conta e testar 14 dias</button></span>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. DEMONSTRATIVE SHOWCASE (MOCKUP INTERATIVO DO APP) */}
      <section id="demonstracao" className="py-20 px-4 sm:px-8 md:px-16 bg-slate-100/50 dark:bg-white/2 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs font-black text-primary-600 dark:text-[#00f0ff] uppercase tracking-widest">Tecnologia Visual Avançada</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Veja o Finance Organizer em Ação
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
              Esqueça planilhas manuais e gráficos estáticos. Nossa interface foi concebida para oferecer visibilidade instantânea dos seus números em qualquer tela.
            </p>
          </div>

          {/* Interactive Mockup Container */}
          <div className="relative max-w-5xl mx-auto bg-white dark:bg-[#0A0C10] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden">
            
            {/* Mockup Browser/App Header Bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-150 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="ml-3 text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline-block">https://xbusiness.online/dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sincronizado em Tempo Real</span>
              </div>
            </div>

            {/* Mockup Body: 3 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Saldo & Donut */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Saldo Consolidado</span>
                  <PieChart size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">R$ 14.850,00</p>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ +22.4% em relação ao mês anterior</p>
                </div>
                {/* Visual Donut representation */}
                <div className="py-2 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-8 border-emerald-500 border-t-rose-500 border-r-[#8B5CF6] flex items-center justify-center relative">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">68% Saldo</span>
                  </div>
                </div>
                <div className="flex justify-around text-[10px] font-bold text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/5 pt-3">
                  <span className="text-emerald-500">● Receitas</span>
                  <span className="text-rose-500">● Despesas</span>
                  <span className="text-[#8B5CF6]">● Aportes</span>
                </div>
              </div>

              {/* Card 2: Faturas de Cartão */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Faturas & Limites</span>
                  <CreditCard size={18} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Cartão Black Platinum</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 2.450,80</p>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Limite Restante: <span className="text-slate-900 dark:text-white font-black">R$ 17.549,20</span></p>
                </div>
                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Uso do limite</span>
                    <span>12.2%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-500 to-[#8B5CF6] h-full w-[12.2%] rounded-full"></div>
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Fatura Fechada • Pagamento Agendado
                </div>
              </div>

              {/* Card 3: Console de Comandos Rápidos */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Lançamento por IA</span>
                  <Terminal size={18} className="text-[#00f0ff]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Comando Digitado</p>
                  <div className="bg-slate-200/60 dark:bg-[#0A0C10] p-3 rounded-xl font-mono text-xs font-bold text-primary-600 dark:text-[#00f0ff] mt-1 border border-slate-300/60 dark:border-white/10">
                    paguei 45 no mercado
                  </div>
                </div>
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Classificação:</span>
                    <span className="font-black text-rose-500">Despesa (Alimentação)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Valor computado:</span>
                    <span className="font-black text-slate-900 dark:text-white">R$ 45,00</span>
                  </div>
                </div>
                <div className="p-2.5 bg-primary-500/10 rounded-xl text-[10px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                  <Zap size={14} /> Lançado instantaneamente em 1 segundo
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. NOSSA MISSÃO E OBJETIVO */}
      <section id="missao" className="py-24 px-4 sm:px-8 md:px-16 relative">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-black text-primary-600 dark:text-[#00f0ff] uppercase tracking-widest">Nosso Propósito</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Por Que Criamos o Finance Organizer?
            </h2>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              A maioria das pessoas e empresas perde dinheiro não por falta de renda, mas por falta de clareza imediata sobre para onde o capital está escoando.
            </p>
            <p>
              Planilhas do Excel se tornam pesadas, lentas e impossíveis de usar pelo celular na correria do dia a dia. Por outro lado, aplicativos financeiros comuns estão repletos de anúncios, propagandas de empréstimos e funções confusas que ninguém usa.
            </p>
            <p>
              <strong>O nosso objetivo principal</strong> é entregar um cockpit financeiro de nível internacional: elegante, minimalista, ultra-rápido e determinístico. Uma ferramenta onde você abre o celular, digita ou clica em segundos e tem a certeza matemática de quanto sobrou, quanto deve e quanto pode investir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-primary-600 dark:text-[#00f0ff]">30 seg/dia</h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tempo médio necessário para registrar e manter o app 100% atualizado.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-emerald-500">Zero Anúncios</h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Foco total no seu dinheiro, sem distrações ou vendas invasivas de crédito.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-secondary-500">100% Mobile</h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Projetado sob medida para o iPhone e telas touch de qualquer resolução.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. DIFERENCIAIS E RECURSOS (GRID TECNOLÓGICO) */}
      <section id="recursos" className="py-20 px-4 sm:px-8 md:px-16 bg-slate-100/50 dark:bg-white/2 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-primary-600 dark:text-[#00f0ff] uppercase tracking-widest">Recursos & Benefícios</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tudo O Que Você Precisa Em Um Só Lugar
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
              Conheça as ferramentas desenvolvidas para colocar sua vida financeira no piloto automático.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PieChart size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Visual Analytics & Donut</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Gráficos Donut semi-hollow com saldo do mês centralizado no desktop e empilhado no mobile. Toque em qualquer fatia para filtrar as despesas na hora.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Gestão Real de Cartões</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Controle limites disponíveis, parcelamentos futuros automáticos e histórico de estornos atômicos com restauração segura de saldo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-[#00f0ff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Terminal size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Console de Comandos Rápidos</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Pressione "/" em qualquer tela e digite linguagem natural como "comprei pizza de 50". O sistema reconhece valores e categoriza na hora.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Otimizado para iPhone e Mobile</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Touch targets mínimos de 48px, seletor de mês nativo tátil invisível sem travamentos, barra inferior fixa e suporte total a gestos touch.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sun size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Versão Branca e Modo Escuro</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Dual-theme nativo: alterne quando desejar entre o tema escuro cibernético e a versão branca com tipografia slate de alto contraste.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Segurança e Privacidade</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Modo de privacidade com 1 clique para mascarar saldos em público. Isolamento RLS por usuário e armazenamento seguro em nuvem.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION FINAL (TESTE GRATUITO) */}
      <section className="py-24 px-4 sm:px-8 md:px-16">
        <div className="max-w-5xl mx-auto relative rounded-3xl bg-gradient-to-r from-primary-600 to-[#8B5CF6] dark:from-[#006970] dark:to-[#4c1d95] p-8 sm:p-14 text-white text-center shadow-2xl overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest">
              Comece Sem Risco
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Pronto Para Ter Controle Financeiro Definitivo?
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
              Crie sua conta em menos de 1 minuto e teste o Finance Organizer gratuitamente por 14 dias. Sem cartão de crédito antecipado e com suporte direto.
            </p>
            <div className="pt-2">
              <button
                onClick={() => scrollToAuth(true)}
                className="px-8 py-4 bg-white text-slate-950 font-black text-sm rounded-2xl shadow-xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
              >
                <span>Quero Meu Teste Grátis de 14 Dias</span>
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="text-[11px] text-white/70 font-bold">
              ✓ Cancelamento a qualquer momento • ✓ Acesso imediato no celular e computador
            </p>
          </div>

        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 px-4 sm:px-8 md:px-16 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-600 dark:bg-[#00f0ff] p-1.5 rounded-lg text-white dark:text-[#0A0C10]">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <span className="font-black text-slate-900 dark:text-white tracking-tight">FINANCE ORGANIZER</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">• xbusiness.online</span>
          </div>

          <div className="flex items-center gap-6 font-bold">
            <a href="#apresentacao" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Início</a>
            <a href="#missao" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Objetivo</a>
            <a href="#recursos" className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Diferenciais</a>
            <button onClick={() => scrollToAuth(false)} className="hover:text-primary-600 dark:hover:text-[#00f0ff] transition-colors">Entrar</button>
          </div>

          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} Finance Organizer. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
