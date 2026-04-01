import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ChevronRight, Send, Bot, User } from 'lucide-react';

export default function Chats({ session }) {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        id: Date.now() + 1, 
        text: `Entendi sua dúvida sobre ${selectedChat.title}. Como especialista IA, recomendo focar na organização e estratégia de ${selectedChat.id === 'investimentos' ? 'aportes mensais' : 'controle de orçamentos'} a longo prazo.`, 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };


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
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-slate-900 font-sans flex flex-col md:flex-row text-primary-700 dark:text-slate-100 relative transition-colors">
      <main className="flex-1 p-6 md:p-12 max-h-screen overflow-y-auto w-full max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Voltar ao Painel
        </button>

        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-700 dark:bg-primary-600 p-3 rounded-2xl text-white shadow-xl shadow-primary-700/20 dark:shadow-primary-900/40">
              <MessageSquare size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Comunidades IA</h1>
              <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">Converse com nossos especialistas em inteligência artificial.</p>
            </div>
          </div>
        </header>

        {!selectedChat ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500 mt-12">
            {CHATS.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-500 transition-all cursor-pointer group hover:-translate-y-1 flex flex-col items-start"
              >
                <div className="text-5xl mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-3xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                  {chat.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight">{chat.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 flex-1">{chat.description}</p>
                
                <button className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold w-full justify-between mt-auto group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                  <span>Acessar Chat</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col h-[600px] mt-8 relative overflow-hidden">
            <header className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="text-3xl bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm">{selectedChat.icon}</div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedChat.title}</h2>
                        <p className="text-xs font-bold text-primary-500 uppercase tracking-widest">Assistente IA Online</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setSelectedChat(null); setMessages([]); }}
                    className="p-3 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
            </header>

            <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-center mb-8">
                    <span className="bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase px-4 py-1.5 rounded-full tracking-widest">
                        Hoje
                    </span>
                </div>
                
                {/* Initial AI Welcome Message */}
                <div className="flex items-end gap-3 max-w-[80%]">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                        <Bot size={20} />
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-5 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-medium text-sm leading-relaxed">
                        Olá! Sou seu assistente IA para a comunidade de <strong className="text-primary-600 dark:text-primary-400">{selectedChat.title}</strong>. Como posso te ajudar a atingir suas metas financeiras hoje?
                    </div>
                </div>

                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300' : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'}`}>
                            {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`p-5 rounded-2xl shadow-sm font-medium text-sm leading-relaxed border ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none border-primary-500' : 'bg-white dark:bg-slate-700 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-bl-none border-gray-100'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-end gap-3 max-w-[80%]">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                            <Bot size={20} />
                        </div>
                        <div className="bg-white dark:bg-slate-700 p-5 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-slate-200 flex gap-1 items-center">
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex gap-4">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Escreva sua mensagem sobre ${selectedChat.title.toLowerCase()}...`}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 px-6 py-4 rounded-full outline-none focus:border-primary-500 transition-colors placeholder-gray-400 font-medium"
                />
                <button 
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white px-6 py-4 rounded-full shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 font-bold disabled:cursor-not-allowed"
                >
                    <Send size={20} /> Enviar
                </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
