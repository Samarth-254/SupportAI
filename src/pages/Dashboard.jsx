import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  History,
  LogOut,
  UploadCloud,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileIcon,
  MessageSquare,
  RefreshCw,
  Edit2,
  UserCheck,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const normalizeItem = (item) => ({
  ...item,
  id: item?._id || item?.id
});

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [qas, setQas] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qaSearch, setQaSearch] = useState('');
  const [showQaModal, setShowQaModal] = useState(false);
  const [editingQa, setEditingQa] = useState(null);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleAuthError = (err) => {
    if (err?.status === 401) {
      api.auth.logout();
      navigate('/admin-login', { replace: true });
      return true;
    }

    if (err?.status === 403) {
      navigate('/', { replace: true });
      return true;
    }

    return false;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [docsRes, qasRes, chatsRes, usersRes] = await Promise.all([
        api.documents.list(),
        api.qa.list(),
        api.chat.getHistory(),
        api.auth.getTotalUsers()
      ]);

      setDocuments((docsRes.data || []).map(normalizeItem));
      setQas((qasRes.data || []).map(normalizeItem));
      setChats((chatsRes.data || []).map(normalizeItem));

      if (usersRes?.success) {
        setTotalUsers(usersRes.count || 0);
      }
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Error loading dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = api.auth.getCurrentUser();

    if (!api.auth.isAuthenticated()) {
      navigate('/admin-login', { replace: true });
      return;
    }

    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!qaSearch.trim()) {
      fetchData();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.qa.list(qaSearch.trim());
        setQas((res.data || []).map(normalizeItem));
      } catch (err) {
        if (!handleAuthError(err)) {
          console.error(err);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [qaSearch]);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/admin-login', { replace: true });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    clearMessages();
    setUploading(true);

    try {
      await api.documents.upload(file);
      setSuccess(`Document "${file.name}" uploaded and processed successfully.`);
      const docsRes = await api.documents.list();
      setDocuments((docsRes.data || []).map(normalizeItem));
      await fetchData();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to upload document.');
      }
    } finally {
      setUploading(false);
    }
  };

  const onFileSelectChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteDocument = async (id, filename) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"? This will also delete all associated knowledge chunks.`
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.documents.delete(id);
      setSuccess(`Document "${filename}" deleted successfully.`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to delete document.');
      }
    }
  };

  const handleOpenCreateQa = () => {
    setEditingQa(null);
    setQaQuestion('');
    setQaAnswer('');
    setShowQaModal(true);
  };

  const handleOpenEditQa = (qa) => {
    setEditingQa(qa);
    setQaQuestion(qa.question || '');
    setQaAnswer(qa.answer || '');
    setShowQaModal(true);
  };

  const handleSaveQa = async (e) => {
    e.preventDefault();

    if (!qaQuestion.trim() || !qaAnswer.trim()) {
      alert('Please fill out both fields.');
      return;
    }

    clearMessages();

    try {
      if (editingQa) {
        const res = await api.qa.update(editingQa.id, qaQuestion.trim(), qaAnswer.trim());
        const updatedQa = normalizeItem(res.data);

        setQas((prev) =>
          prev.map((item) => (item.id === editingQa.id ? updatedQa : item))
        );
        setSuccess('Q&A pair updated successfully.');
      } else {
        const res = await api.qa.create(qaQuestion.trim(), qaAnswer.trim());
        const createdQa = normalizeItem(res.data);

        setQas((prev) => [createdQa, ...prev]);
        setSuccess('Q&A pair created successfully.');
      }

      setShowQaModal(false);
      setEditingQa(null);
      setQaQuestion('');
      setQaAnswer('');
    } catch (err) {
      if (!handleAuthError(err)) {
        alert(err.message || 'Failed to save Q&A pair.');
      }
    }
  };

  const handleDeleteQa = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this Q&A pair?');
    if (!confirmed) return;

    clearMessages();

    try {
      await api.qa.delete(id);
      setQas((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Q&A pair deleted.');
    } catch (err) {
      if (!handleAuthError(err)) {
        alert(err.message || 'Failed to delete Q&A pair.');
      }
    }
  };

  const handleClearChatHistory = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to wipe all chatbot interaction logs? This cannot be undone.'
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.chat.clearHistory();
      setChats([]);
      setSuccess('Chat history cleared.');
    } catch (err) {
      if (!handleAuthError(err)) {
        alert(err.message || 'Failed to clear chat logs.');
      }
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'qa':
        return 'bg-green-950/40 text-green-400 border border-green-500/20';
      case 'documents':
        return 'bg-brand-orange-950/30 text-brand-orange border border-brand-orange/20';
      default:
        return 'bg-zinc-800 text-gray-400 border border-zinc-700';
    }
  };

  const totalChunks = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.chunksCount || 0), 0),
    [documents]
  );

  const docCount = documents.length;
  const qaCount = qas.length;

  const uniqueSessions = useMemo(() => {
    return new Set(chats.map((chat) => chat.sessionId).filter(Boolean));
  }, [chats]);

  const totalChats = uniqueSessions.size;
  const totalMessages = chats.length;

  const sourceStats = useMemo(() => {
    return chats.reduce(
      (acc, chat) => {
        acc[chat.source] = (acc[chat.source] || 0) + 1;
        return acc;
      },
      { qa: 0, documents: 0, fallback: 0 }
    );
  }, [chats]);

  const pieData = [
    { name: 'Custom QA Pair', value: sourceStats.qa, color: '#22c55e' },
    { name: 'Document Search', value: sourceStats.documents, color: '#f97316' },
    { name: 'Unresolved Fallbacks', value: sourceStats.fallback, color: '#52525b' }
  ];

  const activityData = useMemo(() => {
    const activityMap = {};

    [...chats].reverse().forEach((chat) => {
      const date = new Date(chat.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      if (!activityMap[date]) {
        activityMap[date] = {
          date,
          total: 0,
          qa: 0,
          documents: 0,
          fallback: 0
        };
      }

      activityMap[date].total += 1;
      activityMap[date][chat.source] += 1;
    });

    return Object.values(activityMap);
  }, [chats]);

  const topWords = useMemo(() => {
    const wordsMap = {};
    const skipWords = ['what', 'how', 'why', 'when', 'this', 'that', 'with'];

    chats.forEach((c) => {
      const words = (c.question || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);

      words.forEach((w) => {
        if (w.length > 3 && !skipWords.includes(w)) {
          wordsMap[w] = (wordsMap[w] || 0) + 1;
        }
      });
    });

    return Object.entries(wordsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [chats]);

  const unresolvedQueries = useMemo(
    () => chats.filter((c) => c.source === 'fallback').slice(0, 5),
    [chats]
  );

  const authenticatedChats = chats.filter((c) => c.userId).length;
  const anonymousChats = totalMessages - authenticatedChats;
  const avgInteractions = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#070708] flex relative">
      {/* Sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-50 md:z-10 w-64 bg-brand-dark-950 border-r border-brand-dark-800 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 h-full`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-dark-900 border border-brand-orange/20 rounded-xl">
                <LayoutDashboard className="w-5 h-5 text-brand-orange" />
              </div>
              <span className="font-bold text-lg text-white">Bot Console</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-brand-dark-900 border border-brand-dark-850"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-brand-orange text-white shadow-[0_4px_12px_rgba(255,102,0,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-brand-dark-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => { setActiveTab('documents'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'documents'
                  ? 'bg-brand-orange text-white shadow-[0_4px_12px_rgba(255,102,0,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-brand-dark-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Knowledge Base
            </button>

            <button
              onClick={() => { setActiveTab('qa'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'qa'
                  ? 'bg-brand-orange text-white shadow-[0_4px_12px_rgba(255,102,0,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-brand-dark-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Custom QA
            </button>

            <button
              onClick={() => { setActiveTab('chats'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'chats'
                  ? 'bg-brand-orange text-white shadow-[0_4px_12px_rgba(255,102,0,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-brand-dark-900'
              }`}
            >
              <History className="w-4 h-4" />
              User Logs
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-brand-dark-800">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full border border-brand-orange/30 bg-brand-orange-950/20 flex items-center justify-center text-[11px] font-semibold text-brand-orange flex-shrink-0">
                {(api.auth.getCurrentUser()?.username || 'AD').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-gray-500 mb-0.5">Signed in</p>
                <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                  {api.auth.getCurrentUser()?.username || 'Admin'}
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
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070708]">
        <div className="p-4 md:p-8 pb-4">
          <header className="flex justify-between items-center pb-4 border-b border-brand-dark-800 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open menu"
                className="md:hidden p-2.5 text-gray-400 hover:text-white bg-brand-dark-900 border border-brand-dark-800 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white capitalize truncate">
                  {activeTab === 'qa'
                    ? 'Custom QA Manager'
                    : activeTab === 'chats'
                    ? 'User Logs'
                    : activeTab === 'documents'
                    ? 'Knowledge Base'
                    : 'Dashboard'}
                </h1>
                <p className="text-xs md:text-sm text-gray-400 truncate hidden sm:block">
                  Configure parameters and feed sources to support SupportAI chatbot agents.
                </p>
              </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-brand-dark-900 border border-brand-dark-800 rounded-xl hover:border-brand-orange/30 text-gray-400 hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </header>

          {error && (
            <div className="mt-6 mb-2 flex items-center gap-3 bg-red-950/30 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm animate-slide-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 mb-2 flex items-center gap-3 bg-green-950/30 border border-green-500/30 p-4 rounded-xl text-green-400 text-sm animate-slide-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="glow-card p-3 sm:p-6 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      Total Users
                    </p>
                    <p className="text-xl sm:text-3xl font-extrabold text-white mt-1 sm:mt-2">{totalUsers}</p>
                  </div>
                  <div className="p-2 sm:p-3.5 bg-brand-dark-950 border border-brand-dark-800 text-brand-orange rounded-xl flex-shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>

                <div className="glow-card p-3 sm:p-6 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      Documents
                    </p>
                    <p className="text-xl sm:text-3xl font-extrabold text-white mt-1 sm:mt-2">{docCount}</p>
                  </div>
                  <div className="p-2 sm:p-3.5 bg-brand-dark-950 border border-brand-dark-800 text-brand-orange rounded-xl flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>

                <div className="glow-card p-3 sm:p-6 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      Avg. Interac./Session
                    </p>
                    <p className="text-xl sm:text-3xl font-extrabold text-white mt-1 sm:mt-2">{avgInteractions}</p>
                  </div>
                  <div className="p-2 sm:p-3.5 bg-brand-dark-950 border border-brand-dark-800 text-brand-orange rounded-xl flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>

                <div className="glow-card p-3 sm:p-6 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      Total Chats
                    </p>
                    <p className="text-xl sm:text-3xl font-extrabold text-white mt-1 sm:mt-2">{totalChats}</p>
                  </div>
                  <div className="p-2 sm:p-3.5 bg-brand-dark-950 border border-brand-dark-800 text-brand-orange rounded-xl flex-shrink-0">
                    <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="glow-card p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">
                      Interaction Traffic — Last {activityData.length} Days
                    </h3>

                    {activityData.length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                            <XAxis
                              dataKey="date"
                              stroke="#52525b"
                              tick={{ fill: '#71717a', fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis
                              stroke="#52525b"
                              tick={{ fill: '#71717a', fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#18181b',
                                borderColor: '#27272a',
                                borderRadius: '0.75rem',
                                color: '#fff'
                              }}
                              itemStyle={{ color: '#d4d4d8' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="total"
                              name="Total Queries"
                              stroke="#f97316"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorTotal)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
                        Not enough data for chart.
                      </div>
                    )}
                  </div>

                  <div className="glow-card p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">
                      Answer Source Breakdown
                    </h3>

                    {chats.length > 0 ? (
                      <>
                        <div className="h-60 relative flex justify-center items-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: '#18181b',
                                  borderColor: '#27272a',
                                  borderRadius: '0.75rem',
                                  color: '#fff'
                                }}
                                itemStyle={{ color: '#d4d4d8' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">
                              {sourceStats.qa + sourceStats.documents}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                              Resolved
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {pieData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-gray-400">{item.name}</span>
                              </div>
                              <span className="text-white font-medium">
                                {item.value} ({chats.length > 0 ? Math.round((item.value / chats.length) * 100) : 0}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-60 flex items-center justify-center text-gray-500 text-sm">
                        Not enough data.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="glow-card p-6 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-red-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Unresolved Queries Log
                      </h3>
                      <span className="text-xs bg-red-950/50 text-red-500 px-2 py-1 rounded-full">
                        {sourceStats.fallback} total
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                      {unresolvedQueries.length > 0 ? (
                        unresolvedQueries.map((chat) => (
                          <div
                            key={chat.id}
                            className="bg-brand-dark-900 border border-brand-dark-700/50 p-3 rounded-lg flex flex-col gap-2"
                          >
                            <p className="text-sm text-gray-300 font-medium whitespace-pre-wrap">
                              {chat.question}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(chat.createdAt).toLocaleString()}
                            </p>
                            <button
                              onClick={() => {
                                setQaQuestion(chat.question || '');
                                setQaAnswer('');
                                setEditingQa(null);
                                setShowQaModal(true);
                                setActiveTab('qa');
                              }}
                              className="self-end text-[11px] font-bold text-green-400 bg-green-950/20 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors mt-1"
                            >
                              Add QA
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                          <CheckCircle2 className="w-8 h-8 mb-2 text-green-500/50" />
                          <p className="text-sm font-medium">No unresolved queries found!</p>
                          <p className="text-xs text-gray-600">
                            The bot is answering everything successfully.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glow-card p-6 flex flex-col h-[400px]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">
                      Trending Topics / Keywords
                    </h3>

                    <div className="flex-1 flex content-start flex-wrap gap-2 overflow-y-auto pr-2 custom-scrollbar">
                      {topWords.length > 0 ? (
                        topWords.map(([word, count]) => {
                          const sizeClass =
                            count > 10
                              ? 'text-2xl font-bold text-brand-orange'
                              : count > 5
                              ? 'text-lg font-semibold text-brand-orange/80'
                              : 'text-sm font-medium text-gray-400';

                          return (
                            <div
                              key={word}
                              className="bg-brand-dark-900/50 border border-brand-dark-800 px-3 py-1.5 rounded-xl flex items-center gap-2 m-1 transition-colors hover:border-brand-orange/50"
                            >
                              <span className={sizeClass}>{word}</span>
                              <span className="text-xs text-brand-dark-500 px-1.5 py-0.5 bg-brand-dark-950 rounded-md">
                                {count}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                          Not enough chat data to extract topics.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-8 animate-fade-in-up">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`glow-card border-2 border-dashed p-10 text-center cursor-pointer hover:bg-brand-dark-900/40 transition-all duration-300 ${
                  uploading
                    ? 'border-brand-orange/50 bg-brand-orange-950/10 pointer-events-none'
                    : 'border-brand-dark-700 hover:border-brand-orange/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelectChange}
                  accept=".pdf,.docx,.doc,.xlsx,.xls"
                  className="hidden"
                />

                {uploading ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin"></div>
                    <div>
                      <p className="font-semibold text-white">Uploading & Indexing Document...</p>
                      <p className="text-xs text-gray-400 mt-1">
                        This will upload to Cloudinary, parse the document text, and split it into chunks.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="p-4 bg-brand-dark-950 rounded-2xl border border-brand-dark-800 text-brand-orange">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Drag & drop your document here, or{' '}
                        <span className="text-brand-orange hover:underline">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports PDF, DOCX, DOC, or Excel spreadsheets • Max 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="glow-card overflow-hidden opacity-80">
                <div className="p-6 border-b border-brand-dark-800">
                  <h3 className="font-semibold text-white">Ingested Documents</h3>
                  <p className="text-xs text-gray-400">
                    Files powering your chatbot's retrieval context.
                  </p>
                </div>

                {documents.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                    <FileIcon className="w-8 h-8 text-gray-600" />
                    No documents uploaded yet. Upload a document above to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm text-gray-300">
                      <thead className="bg-[#0b0b0d] text-gray-400 font-medium text-xs border-b border-brand-dark-800">
                        <tr>
                          <th className="px-4 md:px-6 py-3 md:py-4">Filename</th>
                          <th className="px-4 md:px-6 py-3 md:py-4">Type</th>
                          <th className="px-4 md:px-6 py-3 md:py-4">Size</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-center">Chunks Ingested</th>
                          <th className="px-4 md:px-6 py-3 md:py-4">Upload Date</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-dark-850">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-brand-dark-900/30 transition-colors">
                            <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-white truncate max-w-[200px]">
                              <a
                                href={doc.cloudinaryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-brand-orange hover:underline inline-flex items-center gap-2"
                              >
                                <FileIcon className="w-4 h-4 flex-shrink-0 text-brand-orange/60" />
                                {doc.filename}
                              </a>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 bg-brand-dark-900 border border-brand-dark-800 rounded-md">
                                {doc.fileType}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400">{formatBytes(doc.fileSize)}</td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-center font-mono font-semibold text-brand-orange/80">
                              {doc.chunksCount}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 text-xs">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search Q&As..."
                    value={qaSearch}
                    onChange={(e) => setQaSearch(e.target.value)}
                    className="w-full bg-[#0d0d0f] border border-brand-dark-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all"
                  />
                </div>

                <button
                  onClick={handleOpenCreateQa}
                  className="w-full sm:w-auto glow-btn flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add QA Pair
                </button>
              </div>

              <div className="glow-card overflow-hidden">
                <div className="p-6 border-b border-brand-dark-800">
                  <h3 className="font-semibold text-white">Custom Knowledge Overrides</h3>
                  <p className="text-xs text-gray-400">
                    Defining direct response matches. When matched exactly, it bypasses the LLM query.
                  </p>
                </div>

                {qas.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                    <HelpCircle className="w-8 h-8 text-gray-600" />
                    No QA pairs match your filter or exist yet. Add one above.
                  </div>
                ) : (
                  <div className="divide-y divide-brand-dark-850">
                    {qas.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-brand-dark-900/10 transition-colors flex flex-col sm:flex-row justify-between items-start gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-brand-orange uppercase px-2 py-0.5 bg-brand-orange-950/20 border border-brand-orange/10 rounded-md">
                              Q
                            </span>
                            <h4 className="font-semibold text-white text-sm sm:text-base">
                              {item.question}
                            </h4>
                          </div>

                          <div className="flex items-start gap-2.5 pl-0.5">
                            <span className="text-xs font-bold text-gray-400 uppercase px-2 py-0.5 bg-brand-dark-950 border border-brand-dark-800 rounded-md flex-shrink-0">
                              A
                            </span>
                            <p className="text-gray-300 text-sm mt-0.5 whitespace-pre-wrap">
                              {item.answer}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 self-end sm:self-start">
                          <button
                            onClick={() => handleOpenEditQa(item)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-brand-dark-900 border border-transparent hover:border-brand-dark-700 rounded-lg transition-all duration-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQa(item.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-end w-full">
                <button
                  onClick={handleClearChatHistory}
                  disabled={chats.length === 0}
                  className="w-full sm:w-auto secondary-btn flex items-center justify-center gap-2 text-sm text-red-400 border-red-950/40 hover:bg-red-950/20 hover:border-red-500/30 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat History
                </button>
              </div>

              <div className="glow-card overflow-hidden opacity-80">
                <div className="p-6 border-b border-brand-dark-800">
                  <h3 className="font-semibold text-white">User Interaction Logs</h3>
                  <p className="text-xs text-gray-400">
                    Full audit log of incoming queries and bot resolutions.
                  </p>
                </div>

                {chats.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm">
                    No conversation logs available. Try talking to the chatbot first.
                  </div>
                ) : (
                  <div className="divide-y divide-brand-dark-850">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-4 md:p-6 space-y-3 hover:bg-brand-dark-900/10 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${getSourceBadgeColor(
                              chat.source
                            )}`}
                          >
                            {chat.source === 'qa'
                              ? 'Custom QA Pair'
                              : chat.source === 'documents'
                              ? 'Document Context'
                              : 'AI Fallback Response'}
                          </span>

                          <span className="text-xs text-gray-500">
                            {new Date(chat.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-white">
                            <span className="text-gray-500 mr-1">User</span>
                            {chat.question}
                          </p>
                          <p className="text-sm text-gray-300 pl-4 border-l-2 border-brand-orange/40 whitespace-pre-wrap">
                            <span className="text-gray-500 text-xs font-semibold block mb-1">Bot</span>
                            {chat.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showQaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-brand-dark-950 border border-brand-dark-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-brand-dark-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingQa ? 'Modify QA Pair' : 'Create Custom QA Override'}
              </h3>
              <button
                onClick={() => setShowQaModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveQa} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Question Trigger
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is your refund policy?"
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-brand-dark-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Custom Override Answer
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide the exact support response..."
                  value={qaAnswer}
                  onChange={(e) => setQaAnswer(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-brand-dark-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-dark-800">
                <button
                  type="button"
                  onClick={() => setShowQaModal(false)}
                  className="secondary-btn py-2 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="glow-btn py-2 text-sm">
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}