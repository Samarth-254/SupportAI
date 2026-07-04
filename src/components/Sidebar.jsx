import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  LogOut,
  ArrowRight,
  UserCheck,
  LogIn,
  Plus,
  X
} from 'lucide-react';

export default function Sidebar({
  user,
  pastSessions = [],
  currentSessionId,
  suggestions = [],
  loading,
  historyLoading = false,
  handleLogout,
  resetChat,
  loadSession,
  sendMessage,
  isOpen,
  onClose
}) {
  const navigate = useNavigate();

  return (
    <aside className={`fixed md:relative inset-y-0 left-0 z-50 md:z-10 w-72 flex-shrink-0 bg-brand-dark-950/95 md:bg-brand-dark-950/70 border-r border-brand-dark-800 flex flex-col overflow-hidden h-full transition-transform duration-300 ease-in-out transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:transform-none`}>
      <div className="p-5 border-b border-brand-dark-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-brand-orange flex-shrink-0" />
          <span className="font-bold text-sm text-white">SupportAI</span>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[10px] font-bold text-brand-orange px-2 py-0.5 bg-brand-orange-950/20 border border-brand-orange/20 rounded-md hover:bg-brand-orange/10 transition"
            >
              Admin
            </button>
          )}
          <button
            onClick={onClose}
            title="Close sidebar"
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-brand-dark-900 border border-brand-dark-850"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 flex-shrink-0">
        <button
          onClick={resetChat}
          className="w-full py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition shadow-[0_0_15px_rgba(255,87,34,0.3)]"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        {user ? (
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            {historyLoading ? (
              <div className="space-y-2 animate-pulse mt-2">
                <p className="text-xs font-semibold text-white mb-2 py-1">Recents</p>
                <div className="h-8 bg-brand-dark-900 border border-brand-dark-800 rounded-lg w-full"></div>
                <div className="h-8 bg-brand-dark-900 border border-brand-dark-800 rounded-lg w-11/12"></div>
                <div className="h-8 bg-brand-dark-900 border border-brand-dark-800 rounded-lg w-4/5"></div>
              </div>
            ) : pastSessions.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white mb-2 sticky top-0 py-1 bg-brand-dark-950/90 backdrop-blur-sm z-10">
                  Recents
                </p>
                <div className="space-y-0.5">
                  {pastSessions.map((sess) => (
                    <button
                      key={sess.id}
                      onClick={() => loadSession(sess)}
                      className={`w-full text-left text-[13px] px-2.5 py-2 rounded-lg transition-all truncate ${
                        currentSessionId === sess.id
                          ? 'bg-[#2A2B32] text-white'
                          : 'text-gray-300 hover:bg-[#2A2B32]/60 hover:text-white'
                      }`}
                    >
                      {sess.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center mt-4">No previous chats</div>
            )}
          </div>
        ) : (
          <div className="px-4 mb-4 flex-shrink-0">
            <div className="p-4 bg-brand-orange-950/10 border border-brand-orange/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                <h4 className="text-xs font-bold text-white">Save Chat History</h4>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Log in or register to save your questions and view previous conversations.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full glow-btn text-[11px] py-2 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In / Register
              </button>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="px-4 py-4 border-t border-brand-dark-800 flex-shrink-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Common Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => { sendMessage(q); onClose?.(); }}
                  disabled={loading}
                  className="text-left text-[11px] bg-[#0d0d0f] border border-brand-dark-800 hover:border-brand-orange/25 p-2 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2 group disabled:opacity-40"
                >
                  <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-brand-orange transition-colors flex-shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-brand-dark-800 flex-shrink-0 bg-brand-dark-900/20">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full border border-brand-orange/30 bg-brand-orange-950/20 flex items-center justify-center text-[11px] font-semibold text-brand-orange flex-shrink-0">
                {user.username?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-gray-500 mb-0.5">
                  {user?.role === 'admin' ? 'Admin session' : 'Signed in'}
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {user.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="ml-3 p-1.5 text-gray-500 hover:text-white transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Agent Online</span>
          </div>
        )}
      </div>
    </aside>
  );
}