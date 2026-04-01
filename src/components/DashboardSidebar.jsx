import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LayoutDashboard, FileText, Target, Users, LogOut, TrendingUp, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardSidebar({ activeTab, setActiveTab, profile, session, handleLogout }) {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-8 flex flex-col font-sans relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="bg-primary-700 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-700/20">
          <TrendingUp size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none text-primary-700">
          <span className="text-xl font-poppins font-black tracking-tighter">FINANCE</span>
          <span className="text-[9px] font-poppins font-bold uppercase tracking-widest text-primary-500">ORGANIZER</span>
        </div>
      </div>

      <nav className="space-y-3 flex-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-poppins font-bold text-sm bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm"
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
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-poppins font-bold text-sm text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <FileText size={20} strokeWidth={2} /> Histórico
        </button>
        <button
          onClick={() => setActiveTab('investimentos')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-poppins font-bold text-sm transition-all ${activeTab === 'investimentos' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
        >
          <TrendingUp size={20} strokeWidth={2} /> Investimentos
        </button>
      </nav>

      <div className="mt-auto pt-8 flex flex-col gap-4">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between gap-3 px-5 py-3 rounded-2xl transition-all font-poppins font-bold text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
             {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />} 
             {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </div>
        </button>

        <div className="p-6 bg-primary-50 rounded-[24px] text-primary-700 shadow-inner border border-primary-100 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-poppins font-bold uppercase tracking-widest text-primary-500 mb-1">Bem-vindo(a),</p>
          <p className="text-lg font-poppins font-black leading-tight mb-3 line-clamp-1">{profile?.display_name || 'Usuário'}</p>
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-2 rounded-xl border border-primary-100/50 break-all text-gray-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
            {session.user.email}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex justify-center items-center gap-2 py-4 text-rose-500 font-poppins font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors text-sm"
        >
          <LogOut size={18} strokeWidth={2.5} /> Sair da Conta
        </button>
      </div>
    </aside>
  );
}
