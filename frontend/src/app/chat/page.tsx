'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatQuery, ChatResponse } from '@/lib/api';
import { 
  BotMessageSquare, 
  User, 
  Send, 
  Sparkles, 
  Link as LinkIcon,
  HelpCircle,
  Cpu
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  relevantDocs?: { name: string; file_type: string }[];
}

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your AI Career Copilot. I can query your entire digital identity, skills, projects, and certificates. What would you like to know?",
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await sendChatQuery(textToSend);
      const botMessage: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: response.answer,
        relevantDocs: response.relevant_documents,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: "I'm sorry, I encountered an error connecting to the AI Search Agent. Make sure the backend is running.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const quickPrompts = [
    "Show my AI certificates",
    "Show projects using Python",
    "Which internship required React?",
    "Show timeline events before 2025"
  ];

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
          Semantic Agent
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-1">
          Smart Retrieval RAG
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask natural language questions over your uploaded documents and get verified answers with citations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* Quick Prompts Panel */}
        <div className="lg:col-span-1 glass-card p-6 rounded-3xl h-fit space-y-4 bg-slate-950/20">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-200">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider">Suggested Queries</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className="text-left p-3 rounded-xl bg-slate-900/55 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700/80 text-xs text-slate-300 transition-all duration-200"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="lg:col-span-3 glass-card rounded-3xl flex flex-col overflow-hidden h-[65vh] border border-slate-800">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#090e19]/40">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 max-w-3xl ${
                    isBot ? '' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                    isBot 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-slate-800 border-slate-750 text-slate-300'
                  }`}>
                    {isBot ? <Cpu className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-3 p-4 rounded-2xl border text-sm leading-relaxed ${
                    isBot 
                      ? 'bg-slate-900/80 border-slate-800/80 text-slate-200' 
                      : 'bg-gradient-to-r from-emerald-500/10 to-blue-500/5 border-emerald-500/20 text-slate-100'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Cited Documents */}
                    {msg.relevantDocs && msg.relevantDocs.length > 0 && (
                      <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                          Cited Sources
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.relevantDocs.map((doc, docIdx) => (
                            <span 
                              key={docIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] rounded-lg text-slate-400 font-mono"
                            >
                              <LinkIcon className="h-3 w-3" />
                              {doc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-4 max-w-md">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                  <Cpu className="h-4 w-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(query); }}
            className="p-4 bg-[#0c111e]/90 border-t border-slate-800 flex gap-3 items-center"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask your AI Career Copilot..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-emerald-500/30 focus:outline-none placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`p-3 rounded-xl transition-all ${
                loading || !query.trim()
                  ? 'bg-slate-900 text-slate-600 border border-slate-850'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
