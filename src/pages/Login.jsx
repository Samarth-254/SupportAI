import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Lock,
  User,
  Terminal,
  AlertCircle,
  Sparkles,
  Database,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Bot,
  Clock3,
  Headphones
} from 'lucide-react';

export default function Login({ isAdminLogin = false }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = api.auth.getCurrentUser();

    if (!user) return;

    if (user.role === 'admin') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let res;

      if (isAdminLogin) {
        res = await api.auth.adminLogin(username.trim(), password);
      } else if (isRegistering) {
        res = await api.auth.register(username.trim(), password);
      } else {
        res = await api.auth.login(username.trim(), password);
      }

      const user = res.user;

      if (user?.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = isAdminLogin
    ? {
        title: 'Customer Query Replying Chatbot',
        description:
          'Manage knowledge sources, custom Q&A pairs, uploaded documents, and user query activity from one clean dashboard.',
        features: [
          {
            icon: <Database className="w-4 h-4 text-brand-orange" />,
            title: 'Manage Knowledge Sources',
            text: 'Upload and manage PDFs, DOC, DOCX, spreadsheets, and similar support files.'
          },
          {
            icon: <Sparkles className="w-4 h-4 text-brand-orange" />,
            title: 'Custom Q&A Control',
            text: 'Add, edit, and delete question-answer pairs for better reply quality.'
          },
          {
            icon: <BarChart3 className="w-4 h-4 text-brand-orange" />,
            title: 'Clean Admin Experience',
            text: 'View chatbot usage, uploaded content, and interactions in one place.'
          }
        ]
      }
    : {
        title: 'AI Support Assistant',
        description: isRegistering
          ? 'Create your account to save conversations and get help faster whenever you return.'
          : 'Get instant help, continue previous chats, and access support whenever you need it.',
        features: [
          {
            icon: <MessageSquare className="w-4 h-4 text-brand-orange" />,
            title: 'Saved Chat Sessions',
            text: 'Access your previous conversations anytime.'
          },
          {
            icon: <Clock3 className="w-4 h-4 text-brand-orange" />,
            title: 'Faster Support',
            text: 'Get quick answers to common customer questions in one place.'
          },
          {
            icon: <Headphones className="w-4 h-4 text-brand-orange" />,
            title: 'Always Available Help',
            text: 'Use the assistant whenever you need support, day or night.'
          }
        ]
      };

  return (
    <div className="h-screen overflow-hidden bg-[#070708] text-white">
      <div className="h-full grid lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col justify-between px-12 py-10 border-r border-brand-dark-800 bg-[#111112] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-16 w-64 h-64 bg-brand-orange-950/20 rounded-full blur-[110px]"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-orange-900/10 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_18px_rgba(255,102,0,0.08)] mb-6">
              {isAdminLogin ? (
                <Terminal className="w-7 h-7 text-brand-orange" />
              ) : (
                <Bot className="w-7 h-7 text-brand-orange" />
              )}
            </div>

            <div className="mb-8">
              <h1 className="text-4xl xl:text-[42px] font-bold tracking-tight leading-tight">
                {leftPanel.title}
              </h1>
              <p className="mt-4 text-base text-gray-300 leading-7 max-w-md">
                {leftPanel.description}
              </p>
            </div>

            <div className="space-y-6">
              {leftPanel.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-orange-950/20 border border-brand-orange/15 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1.5 text-gray-400 text-sm leading-6 max-w-md">
                      {feature.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-gray-500 leading-5 max-w-md">
            {isAdminLogin
              ? 'Built for managing uploaded sources, Q&A pairs, dashboard visibility, and chatbot quality.'
              : 'Built for customers who want fast, simple, and always-available support.'}
          </div>
        </div>

        <div className="relative flex items-center justify-center px-4 py-6 sm:px-6 lg:px-10 bg-[#f8f8f8] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            <div className="absolute top-16 left-10 w-72 h-72 bg-brand-orange/10 rounded-full blur-[110px]"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-orange/10 rounded-full blur-[110px]"></div>
          </div>

          <div className="w-full max-w-lg relative z-10">
            <div className="bg-white rounded-[28px] shadow-[0_20px_70px_rgba(0,0,0,0.12)] border border-black/5 p-6 sm:p-7 md:p-8">
              <div className="mb-6">
                <h2 className="text-3xl sm:text-[36px] font-bold tracking-tight text-[#111827] leading-tight">
                  {isAdminLogin
                    ? 'Admin Sign In'
                    : isRegistering
                    ? 'Create Account'
                    : 'Welcome Back'}
                </h2>
                <p className="text-gray-500 text-sm mt-2.5 leading-6">
                  {isAdminLogin
                    ? 'Sign in to manage documents, Q&A pairs, and chatbot operations'
                    : isRegistering
                    ? 'Create an account to store chat history and continue conversations later'
                    : 'Sign in to continue using your AI support assistant'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-3 rounded-2xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1f2937] block">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#eef1f6] border border-[#d8deea] text-[#111827] rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1f2937] block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#eef1f6] border border-[#d8deea] text-[#111827] rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl py-3.5 font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(255,102,0,0.22)]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isRegistering ? 'Registering...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegistering ? 'Sign Up' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {!isAdminLogin && (
                <div className="text-center mt-6 pt-5 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                    className="text-sm text-gray-500"
                  >
                    {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                    <span className="text-brand-orange font-semibold hover:text-brand-orange/80 transition-colors">
                      {isRegistering ? 'Sign In' : 'Sign Up'}
                    </span>
                  </button>
                </div>
              )}

              {isAdminLogin && (
                <p className="text-center text-xs text-gray-500 mt-5">
                  Demo credentials: <span className="text-brand-orange font-mono">admin</span> / <span className="text-brand-orange font-mono">admin123</span>
                </p>
              )}
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => navigate(isAdminLogin ? '/login' : '/admin-login')}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isAdminLogin ? 'Not an admin? Go to User Login' : 'Admin login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}