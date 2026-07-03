import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LayoutDashboard, FileText, Target, Users, LogOut, TrendingUp, Moon, Sun, CreditCard, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardSidebar({ activeTab, setActiveTab, profile, session, handleLogout }) {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex w-full md:w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-8 flex-col font-sans relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="bg-primary-700 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-700/20">
          <TrendingUp size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none text-primary-700">
          <span className="text-xl font-black tracking-tighter">FINANCE</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-primary-500">ORGANIZER</span>
        </div>
      </div>

      <nav className="space-y-3 flex-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'dashboard' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
        >
          <LayoutDashboard size={20} strokeWidth={2.5} /> Visão Geral
        </button>
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setTimeout(() => {
                const el = document.getElementById('historico-table');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <FileText size={20} strokeWidth={2} /> Histórico
        </button>
        <button
          onClick={() => setActiveTab('investimentos')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'investimentos' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
        >
          <TrendingUp size={20} strokeWidth={2} /> Investimentos
        </button>
        <button
          onClick={() => setActiveTab('cartoes')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'cartoes' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
        >
          <CreditCard size={20} strokeWidth={2} /> Cartões
        </button>
        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'configuracoes' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
        >
          <Settings size={20} strokeWidth={2} /> Configurações
        </button>
      </nav>

      <div className="mt-auto pt-8 flex flex-col gap-3">
        {/* Alternar Tema */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400"
          title="Alternar Tema"
        >
          <span className="flex items-center gap-3">
            {isDarkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </span>
          <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-black uppercase text-gray-400">
            {isDarkMode ? 'Claro' : 'Escuro'}
          </span>
        </button>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors text-sm"
        >
          <LogOut size={20} strokeWidth={2} /> Sair da Conta
        </button>
      </div>
    </aside>
  );
}
