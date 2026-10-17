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
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  LifeBuoy,
  ShieldCheck,
  SendHorizontal,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATABASE: FaqItem[] = [
  // 1. Getting Started
  {
    id: 'faq-1',
    category: 'Getting Started',
    question: 'What is RoadVanta AI and how does it work?',
    answer: 'RoadVanta AI ("See Risks. Save Roads.") is an AI-powered municipal road safety platform. Citizens upload road photos, our Gemini Vision engine identifies surface defects (potholes, cracks, waterlogging), and verified reports are dispatched directly to local highway authorities for repair.',
  },
  // 2. AI Detection Studio
  {
    id: 'faq-2',
    category: 'AI Detection Studio',
    question: 'How does the AI Detection Studio analyze road images?',
    answer: 'When you upload an image, our multimodal Gemini Vision model evaluates pavement condition, detects hazards, provides bounding boxes, estimates severity (Low, Medium, High, Critical), calculates an engineering priority score, and generates safety precautions.',
  },
  // 3. Uploading Road Images
  {
    id: 'faq-3',
    category: 'Uploading Road Images',
    question: 'What image formats and file sizes are supported?',
    answer: 'RoadVanta accepts JPEG, PNG, and WebP images up to 10MB in size. For optimal detection accuracy, upload well-lit, clear daytime photos looking along the road surface.',
  },
  // 4. Reports and CRUD Operations
  {
    id: 'faq-4',
    category: 'Reports & CRUD Operations',
    question: 'Where are my reports saved and can I edit them?',
    answer: 'Reports are securely persisted in MongoDB Atlas with a redundant local store. You can view all reports under "Incident Reports", update titles or descriptions if you submitted them, and track their verification and repair progress.',
  },
  // 5. Live Map
  {
    id: 'faq-5',
    category: 'Live Map',
    question: 'Why does the map show hazards in specific cities?',
    answer: 'The Live Map displays verified incident reports across our active corridors (Indore, Kanpur, Lucknow, Unnao, and Varanasi). You can filter by priority, hazard type, or status, or use the top search bar to center on any landmark.',
  },
  // 6. Route Intelligence
  {
    id: 'faq-6',
    category: 'Route Intelligence',
    question: 'How does Route Hazard Intelligence calculate danger zones?',
    answer: 'Route Intelligence leverages real road geometries and Turf.js spatial corridor buffers to match all registered hazards within 6 km of highway routes like Kanpur–Lucknow, Lucknow–Unnao, and Kanpur–Varanasi, providing live hazard counts and ETAs.',
  },
  // 7. Dashboard and Safety Statistics
  {
    id: 'faq-7',
    category: 'Dashboard & Safety Statistics',
    question: 'Where do the safety dashboard statistics come from?',
    answer: 'National statistics are sourced from official Ministry of Road Transport and Highways (MoRTH) and Press Information Bureau (PIB) publications (2019–2026), alongside live operational data from active municipal reports.',
  },
  // 8. Report Status and Resolution Tracking
  {
    id: 'faq-8',
    category: 'Status & Resolution Tracking',
    question: 'What do the statuses "Submitted", "In Progress", and "Resolved" mean?',
    answer: '• Submitted: Hazard logged and awaiting municipal inspection.\n• In Progress: Dispatched to road works teams with assigned department and work crew.\n• Resolved: Repair completed with verification.',
  },
  // 9. Authority Portal
  {
    id: 'faq-9',
    category: 'Authority Portal',
    question: 'Who has access to the Authority Dashboard?',
    answer: 'Municipal engineers, PWD officers, and smart-city taskforce officials can log in with authority credentials to assign work orders, update repair statuses, and download official safety dossiers.',
  },
  // 10. Account and Authentication
  {
    id: 'faq-10',
    category: 'Account & Authentication',
    question: 'Can I report hazards anonymously?',
    answer: 'Yes! Toggle "Report Anonymously" on the reporting form to omit your name and email. An anonymous report receives full AI inspection and municipal verification.',
  },
  // 11. Troubleshooting
  {
    id: 'faq-11',
    category: 'Troubleshooting',
    question: 'Why did my image analysis fail or return an error?',
    answer: 'Common causes include non-road images, corrupt files, or transient API demand. Ensure the file is under 10MB and shows visible asphalt or road features, then try again.',
  },
  // 12. Data Privacy and Security
  {
    id: 'faq-12',
    category: 'Data Privacy & Security',
    question: 'How does RoadVanta protect user data and privacy?',
    answer: 'All API keys and credentials are strictly stored server-side. Coordinates are validated to prevent injection, and sensitive credentials never leak into client bundles.',
  },
];

const QUICK_PROMPTS = [
  'How do I report a road hazard?',
  'What does "In Progress" status mean?',
  'What are the official road safety statistics?',
  'How does Route Hazard Intelligence work?',
];

export const GeminiRoadAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'chat' | 'ticket'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Ticket form state
  const [ticketCategory, setTicketCategory] = useState('AI Detection Issue');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Chat state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello! I am RoadVanta Assistant ("See Risks. Save Roads."). I can help you report road hazards, explain repair workflows, or search our Help Centre. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

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
        throw new Error('Invalid response');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'RoadVanta Guidance:\n\n• Report Hazards: Click "Report Hazard" to submit photos with geo-coordinates.\n• Route Hazards: Check "Route Intelligence" for highway corridors.\n• Official 2025 Fatalities: 183,382 (MoRTH published).\n• For road emergencies, dial emergency services 112 directly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketDesc.trim()) {
      toast.error('Please provide your contact email and a description.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await api.post('/support', {
        category: ticketCategory,
        email: ticketEmail,
        name: ticketName,
        description: ticketDesc,
      });

      if (res.data?.success) {
        toast.success(`Support Ticket ${res.data.data.ticketId} Registered!`);
        setTicketEmail('');
        setTicketName('');
        setTicketDesc('');
        setActiveTab('faq');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit support request.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const filteredFaqs = FAQ_DATABASE.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg shadow-glow-cyan hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-heading font-bold text-xs"
        aria-label="Open Help Centre & AI Assistant"
      >
        {isOpen ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
        <span className="hidden sm:inline">{isOpen ? 'Close' : 'Help & AI'}</span>
      </button>

      {/* Slide-over Help Centre Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] z-50 rounded-2xl bg-rp-card-elevated border border-rp-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-rp-card to-rp-bg-secondary border-b border-rp-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rp-accent/20 border border-rp-accent/40 text-rp-accent">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xs text-rp-text">
                  RoadVanta Help Centre & Support
                </h3>
                <p className="text-[10px] text-rp-text-muted">
                  Knowledge Base, Diagnostics & AI Guidance
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-rp-text-muted hover:text-rp-text hover:bg-rp-card transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Nav Tabs */}
          <div className="flex border-b border-rp-border bg-rp-card/50 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'faq'
                  ? 'border-rp-accent text-rp-accent bg-rp-accent/5'
                  : 'border-transparent text-rp-text-muted hover:text-rp-text'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              FAQs & Guides
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-rp-accent text-rp-accent bg-rp-accent/5'
                  : 'border-transparent text-rp-text-muted hover:text-rp-text'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Ask AI Agent
            </button>
            <button
              onClick={() => setActiveTab('ticket')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'ticket'
                  ? 'border-rp-accent text-rp-accent bg-rp-accent/5'
                  : 'border-transparent text-rp-text-muted hover:text-rp-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Support Ticket
            </button>
          </div>

          {/* TAB 1: FAQ Knowledge Base */}
          {activeTab === 'faq' && (
            <div className="flex-1 flex flex-col p-3.5 overflow-hidden">
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-rp-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search articles, guides, or troubleshooting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-rp-bg border border-rp-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-rp-text-muted">
                    No matching articles found. Try another keyword or ask our AI Agent.
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExp = expandedFaq === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-xl border border-rp-border bg-rp-card p-3 transition-colors"
                      >
                        <button
                          onClick={() => setExpandedFaq(isExp ? null : faq.id)}
                          className="w-full text-left font-semibold text-rp-text flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] text-rp-accent font-bold block uppercase tracking-wider mb-0.5">
                            {faq.category}
                          </span>
                          <span className="text-xs font-medium text-rp-text flex-1">
                            {faq.question}
                          </span>
                          {isExp ? (
                            <ChevronUp className="w-4 h-4 text-rp-text-muted shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-rp-text-muted shrink-0" />
                          )}
                        </button>

                        {isExp && (
                          <div className="mt-2.5 pt-2.5 border-t border-rp-border/60 text-xs text-rp-text-secondary leading-relaxed whitespace-pre-wrap">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI Conversational Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Prompts */}
              <div className="p-2 border-b border-rp-border bg-rp-card/30 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-rp-card border border-rp-border hover:border-rp-accent/50 text-[10px] text-rp-text-secondary hover:text-rp-accent transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Messages */}
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

              {/* Chat Input */}
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
                    className="flex-1 bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text placeholder:text-rp-text-muted focus:outline-none focus:border-rp-accent"
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
              </div>
            </div>
          )}

          {/* TAB 3: Support Ticket Form */}
          {activeTab === 'ticket' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="font-heading font-bold text-xs text-rp-text mb-1">
                Submit Municipal Support Request
              </h4>
              <p className="text-[11px] text-rp-text-secondary mb-3">
                Have a data question or need priority verification? Submit a ticket below.
              </p>

              <form onSubmit={handleTicketSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-rp-text-muted mb-1">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  >
                    <option value="AI Detection Issue">AI Detection Issue</option>
                    <option value="Report Verification Request">Report Verification Request</option>
                    <option value="Route Intelligence Inquiry">Route Intelligence Inquiry</option>
                    <option value="Authority Dispatch Question">Authority Dispatch Question</option>
                    <option value="General Technical Support">General Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rp-text-muted mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="Citizen / Engineer Name"
                    className="w-full bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rp-text-muted mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rp-text-muted mb-1">
                    Problem Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Describe the issue or municipal inquiry..."
                    className="w-full bg-rp-bg border border-rp-border rounded-xl px-3 py-2 text-xs text-rp-text focus:outline-none focus:border-rp-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rp-accent to-cyan-500 text-rp-bg font-heading font-bold text-xs tracking-wide shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {submittingTicket ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-3.5 h-3.5" />
                  )}
                  {submittingTicket ? 'Submitting...' : 'Register Support Ticket'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GeminiRoadAssistant;
