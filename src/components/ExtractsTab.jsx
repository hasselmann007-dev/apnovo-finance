import React from 'react';
import { Settings, FileText, UploadCloud } from 'lucide-react';

export default function ExtractsTab() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-6 rounded-full mb-6 relative">
            <Settings size={48} className="text-primary-600 dark:text-primary-400 animate-spin-slow" style={{ animationDuration: '3s' }} />
            <div className="absolute top-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
              <UploadCloud size={20} className="text-primary-500 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-2xl font-poppins font-black text-primary-700 dark:text-white mb-4">Análise Automática de Extratos</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8">
            Em breve! Poderá importar seus extratos bancários em formatos PDF ou XLS. A IA "Finance Organizer" vai ler, categorizar e gerar relatórios instantâneos e gargalos.
          </p>

          <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[24px] p-8 w-full max-w-2xl bg-gray-50/50 dark:bg-slate-700/50 flex flex-col items-center justify-center opacity-70 cursor-not-allowed">
            <FileText size={32} className="text-gray-400 dark:text-slate-500 mb-3" />
            <span className="font-bold text-gray-500 dark:text-slate-400">Arraste e solte o seu extrato (PDF/XLS)</span>
            <span className="text-xs text-gray-400 dark:text-slate-500 mt-2">Funcionalidade em desenvolvimento...</span>
            <button disabled className="mt-6 bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 font-bold px-6 py-3 rounded-xl">
              Selecionar Arquivo
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm min-h-[200px] flex items-center justify-center">
          <div className="text-center w-full">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md w-3/4 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md w-1/2 mx-auto animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm min-h-[200px] flex items-center justify-center">
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
