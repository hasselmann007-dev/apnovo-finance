import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wallet, LayoutDashboard, Users, Heart, MessageSquare, Plus, ArrowLeft } from 'lucide-react';

export default function CommunityUGC({ session }) {
    const navigate = useNavigate();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [form, setForm] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchTips();
    }, []);

    const fetchTips = async () => {
        setLoading(true);
        // We join with profiles to get the user's name
        const { data, error } = await supabase
            .from('community_tips')
            .select('*, profiles(display_name)')
            .order('created_at', { ascending: false });
        
        if (!error && data) setTips(data);
        setLoading(false);
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!form.title || !form.content) return;
        
        const { error } = await supabase.from('community_tips').insert({
            user_id: session.user.id,
            title: form.title,
            content: form.content
        });

        if (!error) {
            setIsPosting(false);
            setForm({ title: '', content: '' });
            fetchTips();
        }
    };

    const handleLike = async (tipId, currentLikes) => {
        const { error } = await supabase
            .from('community_tips')
            .update({ likes: currentLikes + 1 })
            .eq('id', tipId);
            
        if (!error) {
            setTips(tips.map(t => t.id === tipId ? { ...t, likes: currentLikes + 1 } : t));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="bg-indigo-600 dark:bg-indigo-500 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                        <Wallet size={24} />
                    </div>
                    <span className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Danilo Cash</span>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white`}
                    >
                        <LayoutDashboard size={20} /> Visão Geral
                    </button>
                    <button
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800`}
                    >
                        <Users size={20} /> Comunidade (UGC)
                    </button>
                </nav>

                <div className="mt-auto pt-6 text-sm text-gray-400 font-medium px-4">
                    Mostre como você organiza suas finanças e ajude outras pessoas a pouparem mais.
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-4 md:p-10 max-h-screen overflow-y-auto w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-2 md:hidden">
                            <ArrowLeft size={16} /> Voltar
                        </button>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Comunidade Viva</h2>
                        <p className="text-gray-500 dark:text-slate-400">Compartilhe suas metas e dicas financeiras de sucesso.</p>
                    </div>
                    <button
                        onClick={() => setIsPosting(!isPosting)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-7 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50 hover:-translate-y-0.5"
                    >
                        {isPosting ? <ArrowLeft size={20} /> : <Plus size={20} />} 
                        {isPosting ? 'Cancelar' : 'Compartilhar Dica'}
                    </button>
                </header>

                {isPosting && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm mb-8 animate-in slide-in-from-top-4">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Nova Postagem</h3>
                        <form onSubmit={handlePost} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest block mb-2">Qual seu título ou meta?</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold text-gray-900 dark:text-white"
                                    placeholder="Ex: Consegui juntar R$ 500 cortando iFood!"
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest block mb-2">Descreva os detalhes</label>
                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl p-4 outline-none resize-none min-h-[120px] text-gray-900 dark:text-white"
                                    placeholder="Explique para a galera como você fez essa organização..."
                                    value={form.content}
                                    onChange={e => setForm({...form, content: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40">
                                Publicar na Comunidade
                            </button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-10"><span className="text-gray-400 dark:text-slate-500 font-bold">Carregando fórum...</span></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tips.map(tip => (
                            <div key={tip.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                                <div className="mb-4 flex-1">
                                    <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2 leading-tight">{tip.title}</h4>
                                    <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-4">{tip.content}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-xs">
                                            {tip.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 dark:text-slate-400">
                                            {tip.profiles?.display_name || 'Anônimo'}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleLike(tip.id, tip.likes)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        <Heart size={16} className={tip.likes > 0 ? "fill-rose-600 dark:fill-rose-400" : ""} /> {tip.likes}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
