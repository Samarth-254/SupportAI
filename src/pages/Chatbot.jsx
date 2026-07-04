import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import { Send, Bot, Menu, LayoutDashboard } from 'lucide-react';

function getDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      {/* <div className="flex-1 h-px bg-brand-dark-800"></div> */}
      <span className="text-[10px] text-gray-500 bg-brand-dark-950 px-3 py-1 rounded-full border border-brand-dark-800 select-none">
        {label}
      </span>
      {/* <div className="flex-1 h-px bg-brand-dark-800"></div> */}
    </div>
  );
}

function injectDateSeparators(messages) {
  const result = [];
  let lastDateLabel = null;

  messages.forEach((msg) => {
    const label = getDateLabel(msg.timestamp);
    if (label !== lastDateLabel) {
      result.push({
        type: 'separator',
        label,
        id: `sep_${label}_${msg.id}`,
      });
      lastDateLabel = label;
    }
    result.push({ type: 'message', ...msg });
  });

  return result;
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: "Hey there! 👋 I'm your SupportAI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(`sess_${Date.now()}`);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const init = async () => {
      const isAuthed = api.auth.isAuthenticated();

      if (isAuthed) {
        const currentUser = api.auth.getCurrentUser();
        setUser(currentUser);
        setHistoryLoading(true);

        try {
          const res = await api.chat.getUserHistory();
          const logs = res.data || [];

          if (logs.length > 0) {
            const grouped = {};

            logs.forEach((log) => {
              const sid = log.sessionId || log._id;
              if (!grouped[sid]) grouped[sid] = [];
              grouped[sid].push(log);
            });

            const sessions = Object.keys(grouped).map((sid) => {
              const sessionLogs = grouped[sid].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );

              const latestCreatedAt =
                sessionLogs[sessionLogs.length - 1]?.createdAt || sessionLogs[0]?.createdAt;

              return {
                id: sid,
                title: sessionLogs[0].question,
                logs: sessionLogs,
                latestCreatedAt,
              };
            });

            const sortedSessions = sessions.sort(
              (a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt)
            );

            setPastSessions(sortedSessions);

            if (sortedSessions.length > 0) {
              const lastSession = sortedSessions[0];
              setCurrentSessionId(lastSession.id);

              const historyMsgs = [];
              lastSession.logs.forEach((item) => {
                historyMsgs.push({
                  id: `u_${item._id}`,
                  text: item.question,
                  sender: 'user',
                  timestamp: new Date(item.createdAt),
                });
                historyMsgs.push({
                  id: `b_${item._id}`,
                  text: item.answer,
                  sender: 'bot',
                  timestamp: new Date(item.createdAt),
                });
              });

              setMessages(historyMsgs);
            }
          }
        } catch (err) {
          console.error('History fetch error:', err.message);
        } finally {
          setHistoryLoading(false);
        }
      }
    };

    init();
  }, []);

  useEffect(() => {
    setSuggestions([
      'What is your refund policy?',
      'How long does shipping take?',
      'How can I contact support?',
    ]);
  }, []);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    if (!text) setInput('');

    const now = new Date();
    const uid = `u_${Date.now()}`;
    const bid = `b_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: uid,
        text: userText,
        sender: 'user',
        timestamp: now,
      },
    ]);

    setLoading(true);

    try {
      const res = await api.chat.query(userText, currentSessionId);
      const botTimestamp = new Date();

      setMessages((prev) => [
        ...prev,
        {
          id: bid,
          text: res.answer,
          sender: 'bot',
          timestamp: botTimestamp,
        },
      ]);

      if (user) {
        setPastSessions((prev) => {
          const existingIndex = prev.findIndex((s) => s.id === currentSessionId);

          if (existingIndex !== -1) {
            const updated = [...prev];
            const existing = updated[existingIndex];

            const updatedSession = {
              ...existing,
              title: existing.title || userText,
              latestCreatedAt: botTimestamp,
              logs: [
                ...existing.logs,
                {
                  question: userText,
                  answer: res.answer,
                  createdAt: botTimestamp,
                },
              ],
            };

            updated.splice(existingIndex, 1);
            return [updatedSession, ...updated];
          }

          return [
            {
              id: currentSessionId,
              title: userText,
              latestCreatedAt: botTimestamp,
              logs: [
                {
                  question: userText,
                  answer: res.answer,
                  createdAt: botTimestamp,
                },
              ],
            },
            ...prev,
          ];
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: bid,
          text: 'Something went wrong on my end. Please try again in a moment!',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setCurrentSessionId(`sess_${Date.now()}`);
    setMessages([
      {
        id: 'welcome',
        text: "Hey there! 👋 I'm your SupportAI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    const currentUser = api.auth.getCurrentUser();

    api.auth.logout();
    setUser(null);
    setPastSessions([]);
    resetChat();

    if (currentUser?.role === 'admin') {
      navigate('/admin-login', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);

    const historyMsgs = [];
    session.logs
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((item, i) => {
        const ts = new Date(item.createdAt || Date.now());

        historyMsgs.push({
          id: `su_${session.id}_${i}`,
          text: item.question,
          sender: 'user',
          timestamp: ts,
        });

        historyMsgs.push({
          id: `sb_${session.id}_${i}`,
          text: item.answer,
          sender: 'bot',
          timestamp: ts,
        });
      });

    setMessages(historyMsgs);
    setSidebarOpen(false);
  };

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderedItems = injectDateSeparators(messages);

  return (
    <div className="h-screen overflow-hidden bg-[#070708] text-gray-100 flex relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange-950/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-dark-900/30 rounded-full blur-[120px] pointer-events-none"></div>

      <Sidebar
        user={user}
        pastSessions={pastSessions}
        currentSessionId={currentSessionId}
        suggestions={suggestions}
        loading={loading}
        historyLoading={historyLoading}
        handleLogout={handleLogout}
        resetChat={resetChat}
        loadSession={loadSession}
        sendMessage={sendMessage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden z-10">
        <header className="flex-shrink-0 p-4 border-b border-brand-dark-800 bg-brand-dark-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              className="md:hidden p-2 text-gray-400 hover:text-white bg-brand-dark-900 border border-brand-dark-800 rounded-xl flex items-center justify-center"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Bot className="w-6 h-6 text-brand-orange flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-white text-sm">SupportAI</h2>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[11px] font-medium text-gray-400 px-2.5 py-1.5 bg-brand-dark-900 border border-brand-dark-800 rounded-xl hover:text-white hover:bg-brand-dark-850 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
              Go to Dashboard
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">
          {historyLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex flex-col items-start mr-auto max-w-[85%] md:max-w-[78%]">
                <div className="h-12 bg-brand-dark-900 border border-brand-dark-800 rounded-2xl rounded-bl-sm w-48 sm:w-64"></div>
                <div className="h-2 bg-brand-dark-900 rounded w-16 mt-2 ml-1"></div>
              </div>
              <div className="flex flex-col items-end ml-auto max-w-[85%] md:max-w-[78%]">
                <div className="h-10 bg-brand-orange/20 border border-brand-orange/10 rounded-2xl rounded-br-sm w-36 sm:w-48"></div>
                <div className="h-2 bg-brand-dark-900 rounded w-12 mt-2 mr-1"></div>
              </div>
              <div className="flex flex-col items-start mr-auto max-w-[85%] md:max-w-[78%]">
                <div className="h-14 bg-brand-dark-900 border border-brand-dark-800 rounded-2xl rounded-bl-sm w-56 sm:w-72"></div>
                <div className="h-2 bg-brand-dark-900 rounded w-20 mt-2 ml-1"></div>
              </div>
            </div>
          ) : (
            renderedItems.map((item) => {
            if (item.type === 'separator') {
              return <DateSeparator key={item.id} label={item.label} />;
            }

            return (
              <div
                id={item.id}
                key={item.id}
                className={`flex flex-col max-w-[85%] md:max-w-[78%] ${item.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${item.sender === 'user'
                    ? 'bg-brand-orange text-white rounded-br-sm shadow-[0_4px_14px_rgba(255,102,0,0.2)]'
                    : 'bg-brand-dark-900 border border-brand-dark-800 text-gray-100 rounded-bl-sm'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{item.text}</p>
                </div>
                <span className="text-[10px] text-gray-600 mt-1 px-1">
                  {fmtTime(item.timestamp)}
                </span>
              </div>
            );
          })
          )}

          {loading && (
            <div className="flex flex-col items-start max-w-[85%] md:max-w-[78%] mr-auto">
              <div className="bg-brand-dark-900 border border-brand-dark-800 px-4 py-3.5 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="flex-shrink-0 p-3 md:p-4 border-t border-brand-dark-800 bg-brand-dark-950/40">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={user ? 'Ask anything (saved to your history)...' : 'Ask anything...'}
              className="w-full bg-[#0d0d0f] border border-brand-dark-800 text-white rounded-2xl py-3.5 pl-4 md:pl-5 pr-12 md:pr-14 text-xs md:text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="absolute right-2.5 p-2 md:p-2.5 bg-brand-orange hover:bg-brand-orange-600 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-white transition-all duration-200 shadow-[0_2px_8px_rgba(255,102,0,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            Answers are sourced from uploaded knowledge documents and custom FAQs.
          </p>
        </footer>
      </main>
    </div>
  );
}