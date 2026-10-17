import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'How do I report a road hazard?',
  'What does "Assigned" status mean?',
  'What are the official road safety statistics?',
  'How does the AI detection studio work?',
];

export const GeminiRoadAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello! I am your RoadVanta Assistant ("See Risks. Save Roads."). I can help you report road hazards, explain repair workflow statuses, or provide official road safety statistics. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-5).map((m) => ({
        role: m.sender === 'assistant' ? ('model' as const) : ('user' as const),
        parts: m.text,
      }));

      const res = await api.post('/assistant/chat', {
        message: query,
        history,
      });

      if (res.data?.success && res.data.data?.reply) {
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: res.data.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'RoadVanta Assistant:\n\n• To report a hazard, click "Report Hazard" in the navbar, pin coordinates on the map, and upload a photo.\n• Official 2025 India Road Fatalities: 183,382 (MoRTH publication).\n• For highway life emergencies, please dial emergency services 112 directly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
        >
          <Bot className="w-4 h-4" />
          <span>Ask RoadVanta AI</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-[400px] z-50 bg-rp-card-elevated/95 backdrop-blur-2xl border-2 border-rp-accent/50 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-3.5 bg-rp-bg-secondary border-b border-rp-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rp-accent to-cyan-400 flex items-center justify-center text-rp-bg shadow-glow-cyan">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-xs text-rp-text block leading-none">
                  RoadVanta Assistant
                </span>
                <span className="text-[10px] text-rp-accent block leading-none mt-1">
                  See Risks. Save Roads. • Gemini 3.8
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-rp-text-muted hover:text-rp-text hover:bg-rp-card transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-rp-bg/60 border-b border-rp-border/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-rp-card border border-rp-border hover:border-rp-accent/50 text-[10px] text-rp-text-secondary hover:text-rp-accent transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-rp-accent/20 border border-rp-accent/40 flex items-center justify-center text-rp-accent shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-medium rounded-tr-none'
                      : 'bg-rp-card border border-rp-border text-rp-text rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      m.sender === 'user' ? 'text-rp-bg/70' : 'text-rp-text-muted'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-rp-accent flex items-center justify-center text-rp-bg shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-rp-accent p-2 bg-rp-accent/10 rounded-xl border border-rp-accent/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>RoadVanta Assistant is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-rp-bg-secondary border-t border-rp-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about road reports, statuses, statistics..."
                className="flex-1 bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent transition-colors"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-rp-accent text-rp-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="text-[9px] text-rp-text-muted text-center mt-1.5">
              Empirical AI advice. For life-threatening highway emergencies, dial 112.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiRoadAssistant;
