import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Settings, ChevronRight } from 'lucide-react';

export default function Chats({ session }) {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);

  const CHATS = [
    {
      id: 'investimentos',
      title: 'Investimentos',
      description: 'Dicas, análises de mercado e estratégias de diversificação com IA.',
      icon: '📈'
    },
    {
      id: 'ciclo-cartao',
      title: 'Como sair do ciclo de viver no cartão de crédito',
      description: 'Estratégias práticas e mentoria IA para quitar dívidas e organizar o orçamento.',
      icon: '💳'
    },
    {
      id: 'organizacao',
      title: 'Organização financeira e controle de gastos',
      description: 'Assistente IA focado no dia a dia, metas e economia familiar.',
      icon: '🎯'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans flex flex-col md:flex-row text-primary-700 relative">
      <main className="flex-1 p-6 md:p-12 max-h-screen overflow-y-auto w-full max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-800 font-poppins font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Voltar ao Painel
        </button>

        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-700 p-3 rounded-2xl text-white shadow-xl shadow-primary-700/20">
              <MessageSquare size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-poppins font-black text-gray-900 tracking-tight">Comunidades IA</h1>
              <p className="text-gray-500 font-medium mt-1">Converse com nossos especialistas em inteligência artificial.</p>
            </div>
          </div>
        </header>

        {!selectedChat ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500 mt-12">
            {CHATS.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer group hover:-translate-y-1 flex flex-col items-start"
              >
                <div className="text-5xl mb-6 bg-gray-50 p-4 rounded-3xl group-hover:bg-primary-50 transition-colors">
                  {chat.icon}
                </div>
                <h3 className="text-xl font-poppins font-black text-gray-900 mb-3 leading-tight">{chat.title}</h3>
                <p className="text-gray-500 text-sm mb-8 flex-1">{chat.description}</p>
                
                <button className="flex items-center gap-2 text-primary-600 font-poppins font-bold w-full justify-between mt-auto group-hover:text-primary-700">
                  <span>Acessar Chat</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm text-center animate-in zoom-in-95 duration-300 mt-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-bl-full opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-50 rounded-tr-full opacity-50"></div>
            
            <div className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="text-6xl mb-6">{selectedChat.icon}</div>
              <h2 className="text-3xl font-poppins font-black text-gray-900 mb-2">{selectedChat.title}</h2>
              <div className="h-1 w-24 bg-primary-200 rounded-full mb-12"></div>

              <div className="bg-primary-50 p-8 rounded-full mb-8 relative">
                <Settings size={64} className="text-primary-600 animate-spin-slow" style={{ animationDuration: '4s' }} />
              </div>
              <h3 className="text-2xl font-poppins font-black text-primary-700 mb-4">Assistência IA em Manutenção</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium">
                Nossos modelos de inteligência artificial estão sendo calibrados para oferecer as melhores respostas e estratégias para esta comunidade. Estará disponível em breve!
              </p>

              <button 
                onClick={() => setSelectedChat(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-poppins font-bold px-8 py-4 rounded-2xl transition-colors"
              >
                Voltar para Comunidades
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
