import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, Trash2, Edit3 } from 'lucide-react';

export default function OverviewTab({ transactions, totals, pieData, startEdit, deleteItem }) {
  const COLORS = ['#6BC270', '#E11D48', '#F59E0B', '#1C2D1A', '#8B5CF6', '#EC4899', '#06B6D4'];

  const economiaPercent = totals.receitas > 0 ? ((totals.saldo / totals.receitas) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-7 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-primary-100 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/20 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <ArrowUpCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Entradas</p>
          <p className="text-3xl font-poppins font-black text-gray-900 dark:text-white relative z-10">R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-7 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-rose-100 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-900/20 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <ArrowDownCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Saídas</p>
          <p className="text-3xl font-poppins font-black text-gray-900 dark:text-white relative z-10">R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-7 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm ring-2 ring-primary-500/10 relative overflow-hidden group hover:border-primary-200 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-bl-[100px] opacity-20 group-hover:opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <Wallet size={24} />
            </div>
            <span className={`text-xs font-poppins font-black px-3 py-1.5 rounded-xl ${totals.saldo >= 0 ? 'bg-primary-50 text-primary-600' : 'bg-rose-50 text-rose-600'}`}>
              {economiaPercent}% economizado
            </span>
          </div>
          <p className="text-sm font-poppins font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Saldo Atual</p>
          <p className={`text-3xl font-poppins font-black relative z-10 ${totals.saldo >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600 dark:text-rose-400'}`}>
            R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-poppins font-black text-gray-800 dark:text-white mb-8 flex items-center gap-2">
            <PieChart size={20} className="text-primary-600 dark:text-primary-400" /> Para onde vai o dinheiro?
          </h3>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                  >
                     {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold">Nenhum gasto cadastrado.</div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center text-center px-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="mx-auto bg-primary-50 dark:bg-slate-700 p-5 rounded-[24px] mb-6 shadow-inner ring-1 ring-primary-100 dark:ring-slate-600 relative z-10">
            <AlertCircle size={40} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-2xl font-poppins font-black text-gray-900 dark:text-white mb-4 relative z-10">Saúde das Finanças</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium relative z-10">
            {totals.saldo >= 0 ? (
              <>Parabéns! Você está com <b className="text-primary-700 dark:text-primary-300">saldo positivo</b> de <span className="text-primary-600 dark:text-primary-400 font-black">R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>. Organize suas próximas metas e mantenha o ritmo!</>
            ) : (
              <>Cuidado! Seu saldo está <span className="text-rose-600 dark:text-rose-400 font-black">negativo em R$ {Math.abs(totals.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>. Reveja seus gastos deste mês e ajuste a rota.</>
            )}
          </p>
        </div>
      </div>

      {/* Histórico Integrado (Transações) */}
      <div id="historico-table" className="bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
        <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30 dark:bg-slate-800/50">
          <h3 className="text-xl font-poppins font-black text-gray-800 dark:text-white">Histórico Recente</h3>
          <div className="flex gap-2">
            <span className="hidden md:inline-block px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest">+ Receitas</span>
            <span className="hidden md:inline-block px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">- Gastos</span>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {transactions.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-bold flex flex-col items-center">
              <Wallet size={48} className="text-gray-200 mb-4" />
              Nenhum lançamento encontrado ainda.
            </div>
          ) : (
            <table className="w-full text-left">
               <thead className="bg-gray-50/50 dark:bg-slate-700/50 text-gray-400 dark:text-slate-400 text-[10px] uppercase font-poppins font-black tracking-widest hidden md:table-header-group">
                 <tr>
                    <th className="px-8 py-6">Descrição</th>
                    <th className="px-8 py-6">Categoria</th>
                    <th className="px-8 py-6">Valor</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                 {transactions.map((t) => (
                    <tr key={t.id} className="group hover:bg-primary-50/30 dark:hover:bg-slate-700/30 transition-all flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-2 md:px-8 py-4 md:py-6">
                        <p className="font-poppins font-bold text-gray-800 dark:text-white">{t.descricao}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 font-medium">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <span className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-[11px] font-bold inline-block border border-gray-200 dark:border-slate-600">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6">
                        <p className={`font-poppins font-black text-lg md:text-md ${t.tipo === 'receita' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-slate-100'}`}>
                          {t.tipo === 'receita' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-2 md:px-8 py-2 md:py-6 md:text-right">
                        <div className="flex justify-start md:justify-end gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity mt-2 md:mt-0">
                          <button onClick={() => startEdit(t)} className="p-3 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-xl transition-colors bg-gray-50 dark:bg-slate-800 md:bg-transparent" title="Editar">
                             <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteItem(t.id)} className="p-3 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-colors bg-gray-50 dark:bg-slate-800 md:bg-transparent" title="Apagar">
                             <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                 ))}
               </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
