import React, { useState, useEffect } from 'react';
import { User, Shield, Key, LogOut, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsTab({ session, profile, handleLogout, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('user_avatar_color') || 'from-primary-500 to-secondary-500';
  });
  
  // Senha states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedbacks
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  const AVATAR_COLORS = [
    { name: 'Neon Gradient', class: 'from-primary-500 to-secondary-500' },
    { name: 'Emerald Wave', class: 'from-emerald-400 to-teal-600' },
    { name: 'Sunset Glow', class: 'from-orange-500 to-rose-500' },
    { name: 'Royal Purple', class: 'from-indigo-600 to-purple-600' },
    { name: 'Gold Sparkle', class: 'from-yellow-400 to-amber-600' },
    { name: 'Cool Ice', class: 'from-cyan-400 to-blue-600' }
  ];

  // Regex de força da senha
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ text: 'O nome de exibição não pode estar em branco.', type: 'error' });
      return;
    }

    setLoadingProfile(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          display_name: displayName.trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      localStorage.setItem('user_avatar_color', avatarColor);
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          display_name: displayName.trim()
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro ao atualizar o perfil. Tente novamente.', type: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setMessage({ text: 'A nova senha não atende a todos os requisitos de segurança.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'A confirmação de senha não confere.', type: 'error' });
      return;
    }

    setLoadingSecurity(true);
    setMessage({ text: '', type: '' });

    try {
      // O Supabase Auth lida com a alteração de senha segura com hashes no backend
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ text: 'Senha atualizada com sucesso!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setMessage({ text: `Erro ao atualizar senha: ${err.message}`, type: 'error' });
    } finally {
      setLoadingSecurity(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 max-w-4xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="text-primary-500" size={30} /> Perfil e Configurações
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">
            Gerencie suas informações cadastrais, preferências de tema e segurança de sua conta.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-3 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-400'}`}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel do Perfil */}
        <div className="bg-white dark:bg-white/5 border border-slate-150 dark:border-white/10 p-8 rounded-3xl shadow-sm shadow-indigo-500/5 dark:shadow-none space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
            <User className="text-primary-500" size={20} /> Informações Pessoais
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Visualização de Foto/Iniciais */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xl relative group`}>
                <span className="text-white font-black text-3xl">
                  {displayName ? displayName.slice(0, 2).toUpperCase() : 'US'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-bold">Personalize o Gradiente do seu Avatar</p>
              
              <div className="flex flex-wrap justify-center gap-2.5">
                {AVATAR_COLORS.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarColor(col.class)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${col.class} border-2 transition-all ${avatarColor === col.class ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Email (Não editável)</label>
              <input
                type="email"
                disabled
                value={session?.user?.email || ''}
                className="w-full bg-slate-100 dark:bg-white/2 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-xl font-bold outline-none text-sm cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nome de Exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-primary-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="w-full bg-primary-600 dark:bg-[#00f0ff] hover:bg-primary-700 dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] py-3.5 rounded-xl font-black transition-all hover:scale-[1.01] active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10"
            >
              {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Painel de Segurança (Redefinição de Senha) */}
        <div className="bg-white dark:bg-white/5 border border-slate-150 dark:border-white/10 p-8 rounded-3xl shadow-sm shadow-indigo-500/5 dark:shadow-none space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
            <Key className="text-primary-500" size={20} /> Segurança e Senha
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha de acesso"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-primary-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-primary-500 transition-all text-sm"
              />
            </div>

            {/* Requisitos de Senha */}
            <div className="p-4 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requisitos de Segurança:</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  {passwordCriteria.length ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-rose-500" />}
                  Mínimo 8 caracteres
                </span>
                <span className="flex items-center gap-1.5">
                  {passwordCriteria.uppercase ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-rose-500" />}
                  Letra Maiúscula
                </span>
                <span className="flex items-center gap-1.5">
                  {passwordCriteria.number ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-rose-500" />}
                  Um número (0-9)
                </span>
                <span className="flex items-center gap-1.5">
                  {passwordCriteria.special ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-rose-500" />}
                  Caractere Especial
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingSecurity || !isPasswordValid || newPassword !== confirmPassword}
              className={`w-full py-3.5 rounded-xl font-black transition-all hover:scale-[1.01] active:scale-95 text-sm flex items-center justify-center gap-2 ${loadingSecurity || !isPasswordValid || newPassword !== confirmPassword ? 'bg-slate-200 text-slate-400 dark:bg-white/5 dark:text-slate-600 border border-slate-350 dark:border-white/5 cursor-not-allowed' : 'bg-primary-600 dark:bg-[#00f0ff] hover:bg-primary-700 dark:hover:bg-[#00d8e6] text-white dark:text-[#0A0C10] shadow-lg shadow-primary-500/10'}`}
            >
              {loadingSecurity ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>
      </div>

      {/* Seção de Logout */}
      <div className="bg-rose-500/5 dark:bg-rose-500/2 border border-rose-550/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-rose-500">Encerrar Sessão</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Saia com segurança de sua conta para evitar acessos não autorizados.</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-rose-500/15"
        >
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>

    </div>
  );
}
