'use client';

import { useState, useRef, useEffect } from 'react';

interface AiSuggestion {
  type: 'funnel' | 'opex' | 'both';
  year: number;
  funnelChanges?: Record<string, Record<string, number>>;
  opexChanges?: { masterFtePct?: number };
  explanation: string;
  confirmPrompt: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: AiSuggestion;
}

interface Props {
  selectedYear: number;
  onApplySuggestion: (suggestion: AiSuggestion) => void;
}

export default function ChatPanel({ selectedYear, onApplySuggestion }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: '你好！我是 Gazyva AI 助手。你可以让我模拟 Patient Funnel、反推目标营收参数、或设置 OPEX 预算。\n\n输入 **"帮助"** 查看所有可用指令。',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, currentYear: selectedYear }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, data]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ 请求失败，请重试。' },
      ]);
    }
    setLoading(false);
  };

  const handleApply = (suggestion: AiSuggestion) => {
    onApplySuggestion(suggestion);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '✅ 参数已成功填入看板！你可以在对应页面查看更新后的数据。' },
    ]);
  };

  const quickCommands = [
    '帮我模拟2028年LN的漏斗',
    '2029年目标营收500M',
    '帮助',
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-slate-700 rotate-0' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-blue-600 text-white px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <div className="font-bold text-sm">Gazyva AI 助手</div>
              <div className="text-[10px] text-blue-200">模拟 Patient Funnel · 反推参数 · 设置 OPEX</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                  {msg.suggestion && (
                    <button
                      onClick={() => handleApply(msg.suggestion!)}
                      className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      一键填入看板
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm">
                  <span className="animate-pulse">思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
              {quickCommands.map((cmd, i) => (
                <button key={i} onClick={() => { setInput(cmd); }}
                  className="flex-shrink-0 text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-full border border-slate-200 transition-colors whitespace-nowrap">
                  {cmd}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="输入指令，如：模拟2028年LN漏斗..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
