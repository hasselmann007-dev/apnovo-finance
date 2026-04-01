import React from 'react';
import { Settings, FileText, UploadCloud } from 'lucide-react';

export default function ExtractsTab() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-6 rounded-full mb-6 relative">
            <Settings size={48} className="text-primary-600 dark:text-primary-400 animate-spin-slow" style={{ animationDuration: '3s' }} />
            <div className="absolute top-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
              <UploadCloud size={20} className="text-primary-500 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-primary-700 dark:text-white mb-4">Análise Automática de Extratos</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8 font-medium">
            Em breve! Você poderá importar seus extratos bancários em formatos PDF ou XLS. A IA "Finance Organizer" vai ler, categorizar e gerar relatórios instantâneos e encontrar gargalos financeiros para você.
          </p>

          <label className="relative border-2 border-dashed border-primary-200 dark:border-primary-900/50 hover:border-primary-400 rounded-2xl p-12 w-full max-w-2xl bg-primary-50/30 hover:bg-primary-50/60 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-100/20 dark:to-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <FileText size={48} className="text-primary-400 dark:text-primary-500 mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-transform" />
            <span className="font-black text-xl text-primary-700 dark:text-primary-400 mb-2 relative z-10">Arraste seu extrato para cá</span>
            <span className="font-bold text-gray-500 dark:text-slate-400 relative z-10">ou clique para selecionar (PDF/XLS)</span>
            <input type="file" className="hidden" disabled />
            <div className="mt-8 px-6 py-3 bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 font-bold rounded-xl shadow-sm border border-primary-100 dark:border-slate-600 relative z-10 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              Selecionar Arquivo
            </div>
            <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Em Desenvolvimento
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm min-h-[200px] flex items-center justify-center">
          <div className="text-center w-full">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md w-3/4 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md w-1/2 mx-auto animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm min-h-[200px] flex items-center justify-center">
           <div className="flex gap-4 items-end justify-center h-full w-full">
             <div className="w-12 h-24 bg-gray-200 dark:bg-slate-700 rounded-t-lg animate-pulse"></div>
             <div className="w-12 h-32 bg-gray-200 dark:bg-slate-700 rounded-t-lg animate-pulse"></div>
             <div className="w-12 h-16 bg-gray-200 dark:bg-slate-700 rounded-t-lg animate-pulse"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
