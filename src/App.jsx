import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ShoppingBag, 
  Utensils, 
  TrendingUp, 
  Target,
  Award,
  X,
  History,
  Wallet,
  Trash2,
  Heart,
  Calendar,
  Sparkles,
  Lightbulb,
  Lock,
  LogOut,
  User,
  LogIn,
  WalletCards,
  Coins
} from 'lucide-react';

// --- Komponen Utilitas ---

const Card = ({ children, className = "", onClick, noScale = false }) => (
  <div 
    onClick={onClick}
    className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all ${!noScale ? 'active:scale-95' : ''} lg:active:scale-100 lg:hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] lg:hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const ProgressBar = ({ progress, colorClass = "bg-indigo-400" }) => {
  const safeProgress = isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100);
  return (
    <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-1 shadow-inner">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${colorClass}`} 
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
};

const formatCurrencyInput = (value) => {
  if (!value) return '';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  return new Intl.NumberFormat('id-ID').format(numberString);
};

const parseCurrencyRaw = (formattedValue) => {
  if (!formattedValue) return 0;
  return parseFloat(formattedValue.toString().replace(/[^0-9]/g, '')) || 0;
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const GOAL_ICONS = ['🏠', '🚗', '🎓', '💻', '🎮', '✈️', '💍', '🎁', '🛡️', '💰', '✨', '📦', '🌈', '🎨'];

// --- Aplikasi Utama ---

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pennypal_active_user_v8');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- Data State ---
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);

  // State UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('transaction'); 
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date().getMonth().toString());
  const [selectedBadge, setSelectedBadge] = useState(null);

  const [formData, setFormData] = useState({
    amount: '', note: '', type: 'expense', category: 'makanan',
    date: new Date().toISOString().split('T')[0],
    targetAmount: '', goalTitle: '', goalIcon: '🎯'
  });

  // Load User Data
  useEffect(() => {
    if (currentUser) {
      const savedTx = localStorage.getItem(`pennypal_v8_${currentUser.username}_transactions`);
      const savedGoals = localStorage.getItem(`pennypal_v8_${currentUser.username}_goals`);
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
      setGoals(savedGoals ? JSON.parse(savedGoals) : []);
    }
  }, [currentUser]);

  // Save User Data
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pennypal_v8_${currentUser.username}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`pennypal_v8_${currentUser.username}_goals`, JSON.stringify(goals));
    }
  }, [transactions, goals, currentUser]);

  const handleAuthAction = () => {
    setAuthError('');
    const normalizedUsername = authForm.username.trim();
    if (!normalizedUsername || !authForm.password) {
      setAuthError('Username & password harus diisi!');
      return;
    }

    const users = JSON.parse(localStorage.getItem('pennypal_users_v8') || '[]');

    if (authMode === 'register') {
      if (users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
        setAuthError('Username ini sudah terdaftar!');
        return;
      }
      const newUser = { username: normalizedUsername, password: authForm.password };
      users.push(newUser);
      localStorage.setItem('pennypal_users_v8', JSON.stringify(users));
      setCurrentUser(newUser);
      localStorage.setItem('pennypal_active_user_v8', JSON.stringify(newUser));
    } else {
      const user = users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase() && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('pennypal_active_user_v8', JSON.stringify(user));
      } else {
        setAuthError('Username atau password salah!');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pennypal_active_user_v8');
    setAuthForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  const totalStats = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const totalBalance = totalStats.income - totalStats.expense;

  const goalsWithProgress = useMemo(() => {
    let tempBalance = totalBalance;
    return goals.map(goal => {
      const allocated = Math.max(0, Math.min(tempBalance, goal.target));
      tempBalance -= allocated;
      return { ...goal, current: allocated };
    });
  }, [goals, totalBalance]);

  const filteredTransactions = useMemo(() => {
    if (selectedMonthFilter === 'all') return transactions;
    return transactions.filter(tx => new Date(tx.date).getMonth() === parseInt(selectedMonthFilter));
  }, [transactions, selectedMonthFilter]);

  const badgeLogic = useMemo(() => {
    const hasFinishedGoal = goalsWithProgress.length > 0 && goalsWithProgress.some(g => g.current >= g.target && g.target > 0);
    const isWealthy = totalBalance >= 10000000;
    const isDiligent = transactions.length >= 5;
    const isSaver = transactions.length > 0 && totalStats.expense < (totalStats.income * 0.5);

    return [
      { id: 'saver', name: 'Hemat Mania', icon: '🔥', desc: 'Pengeluaran di bawah 50% pendapatan.', unlocked: isSaver },
      { id: 'goal', name: 'Goal Crusher', icon: '💎', desc: 'Minimal 1 target impian tercapai 100%.', unlocked: hasFinishedGoal },
      { id: 'rich', name: 'Sultan Muda', icon: '🚀', desc: 'Saldo total menembus Rp 10 Juta.', unlocked: isWealthy },
      { id: 'active', name: 'Pencatat Rajin', icon: '🌟', desc: 'Mencatat minimal 5 transaksi.', unlocked: isDiligent },
      { id: 'safety', name: 'Siaga Satu', icon: '🛡️', desc: 'Memiliki target Dana Darurat.', unlocked: goals.some(g => g.title.toLowerCase().includes('darurat')) },
      { id: 'streak', name: 'Kilat Cuan', icon: '⚡', desc: 'Ada pemasukan di atas Rp 1 Juta.', unlocked: transactions.some(t => t.type === 'income' && t.amount >= 1000000) },
    ];
  }, [goalsWithProgress, totalBalance, transactions, totalStats, goals]);

  const walletMood = useMemo(() => {
    if (!currentUser) return null;
    if (transactions.length === 0) return { emoji: '🥚', color: 'bg-slate-100', text: 'Halo! Mari mulai mencatat.', textColor: 'text-slate-600', tip: "Selamat datang! Klik tombol '+' di bawah untuk mencatat transaksi pertamamu." };
    if (totalBalance < 0) return { emoji: '😵', color: 'bg-rose-100', text: 'Saldo minus! Ayo hemat!', textColor: 'text-rose-700', tip: "Waduh, pengeluaranmu lebih besar dari pemasukan nih!" };
    if (totalBalance < 500000) return { emoji: '😟', color: 'bg-amber-100', text: 'Dompet mulai tipis...', textColor: 'text-amber-700', tip: "Coba masak di rumah yuk untuk menghemat budget makan." };
    if (totalBalance > 5000000) return { emoji: '😎', color: 'bg-emerald-100', text: 'Lagi banyak uang nih!', textColor: 'text-emerald-700', tip: "Waktu yang tepat untuk mengisi alokasi tabungan impian." };
    return { emoji: '😊', color: 'bg-sky-100', text: 'Keuangan aman, Sobat!', textColor: 'text-sky-700', tip: "Jangan lupa sisihkan sedikit untuk dana darurat ya." };
  }, [totalBalance, transactions.length, currentUser]);

  const handleSaveTransaction = () => {
    const rawAmount = parseCurrencyRaw(formData.amount);
    if (!rawAmount || !formData.note) return;
    const newTx = {
      id: Date.now(), type: formData.type, category: formData.category,
      amount: rawAmount, note: formData.note, date: new Date(formData.date).toISOString()
    };
    setTransactions([newTx, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)));
    resetForm();
  };

  const handleSaveGoal = () => {
    const rawTarget = parseCurrencyRaw(formData.targetAmount);
    if (!formData.goalTitle || !rawTarget) return;
    const newGoal = { id: Date.now(), title: formData.goalTitle, target: rawTarget, icon: formData.goalIcon };
    setGoals([...goals, newGoal]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      amount: '', note: '', type: 'expense', category: 'makanan', 
      date: new Date().toISOString().split('T')[0],
      targetAmount: '', goalTitle: '', goalIcon: '🎯' 
    });
    setShowAddModal(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 font-fredoka overflow-hidden relative text-[15px]">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-peach-100/40 rounded-full blur-[120px] -z-10" />

        <Card noScale className="w-full max-w-sm p-11 space-y-9 shadow-2xl relative border-none bg-white/95 z-50">
          <div className="text-center space-y-4">
             <div className="p-5 bg-indigo-600 rounded-[2.2rem] shadow-xl shadow-indigo-100 inline-block rotate-3">
                <Wallet className="text-white w-11 h-11" />
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">PennyPal</h1>
             <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Smart Savings Mate</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Username</label>
              <input 
                type="text" 
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none font-bold transition-all text-slate-800"
                placeholder="Namamu?"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Password</label>
              <input 
                type="password" 
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none font-bold transition-all text-slate-800"
                placeholder="Kata sandi"
              />
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                <p className="text-[11px] font-black text-rose-500 text-center uppercase tracking-wider">{authError}</p>
              </div>
            )}

            <button 
              onClick={handleAuthAction}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[12px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {authMode === 'login' ? <LogIn size={20} /> : <User size={20} />}
              {authMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}
            </button>
          </div>

          <div className="text-center pt-2 relative z-[100]">
            <button 
              type="button"
              onMouseDown={(e) => { 
                e.preventDefault();
                setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                setAuthError(''); 
              }}
              className="px-7 py-3 text-[12px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors cursor-pointer bg-indigo-50/50 rounded-2xl"
            >
              {authMode === 'login' ? 'Belum punya akun? Daftar di sini!' : 'Sudah punya akun? Login di sini!'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 pb-32 overflow-x-hidden font-fredoka text-[15px]">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-peach-100/30 rounded-full blur-[100px]" />
      </div>

      <header className="p-7 md:p-10 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 rotate-3 transform hover:rotate-0 transition-transform">
            <Wallet className="text-white w-7 h-7 md:w-9 md:h-9" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">PennyPal</h1>
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Smart Savings</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halo, Sobat!</span>
              <span className="text-[16px] font-black text-slate-900">{currentUser.username}</span>
           </div>
           <button 
              onClick={handleLogout}
              className="p-4 bg-white border-2 border-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-7 grid grid-cols-1 lg:grid-cols-12 gap-9 items-start">
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-7 sticky top-10">
          <Card noScale className="bg-indigo-50 border-indigo-200 text-slate-900 relative border-2 shadow-inner">
            <div className="absolute top-4 right-4 opacity-20">
              <Wallet size={26} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <WalletCards size={18} className="text-indigo-500" />
              <h4 className="font-black text-[11px] uppercase tracking-widest text-indigo-700">Analisa Sobat</h4>
            </div>
            <p className="text-[14px] font-black leading-relaxed text-slate-900">
              {walletMood?.tip}
            </p>
          </Card>

          <Card noScale className="bg-white border-2 border-indigo-50">
            <h4 className="font-black text-[11px] uppercase text-slate-400 mb-5 tracking-widest">Pencapaian Kamu</h4>
            <div className="grid grid-cols-3 gap-3">
              {badgeLogic.map((badge) => (
                <div 
                  key={badge.id} 
                  onClick={() => setSelectedBadge(badge)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all hover:scale-110 cursor-pointer border-2 ${badge.unlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100 opacity-30 grayscale'}`}
                >
                  {badge.unlocked ? badge.icon : <Lock size={18} className="text-slate-400" />}
                </div>
              ))}
            </div>
            <p className="text-[9px] font-black uppercase text-center mt-5 text-slate-300 tracking-tighter italic px-2">Klik ikon untuk detail</p>
          </Card>
        </aside>

        <main className="lg:col-span-6 space-y-9">
          {activeTab === 'dashboard' && (
            <div className="space-y-9 animate-in fade-in slide-in-from-top-4 duration-700">
              <section>
                <Card className={`text-center py-14 border-none shadow-2xl shadow-indigo-100/20 group ${walletMood?.color}`}>
                  <div className="text-8xl md:text-9xl mb-7 transform group-hover:scale-105 transition-transform select-none">
                    {walletMood?.emoji}
                  </div>
                  <h2 className={`text-4xl md:text-5xl font-black mb-1 ${walletMood?.textColor}`}>
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </h2>
                  <p className={`text-[17px] font-bold opacity-70 ${walletMood?.textColor}`}>{walletMood?.text}</p>
                  <div className="mt-7 flex justify-center gap-2">
                    <span className="px-4 py-2 bg-white/40 rounded-full text-[11px] font-black uppercase text-slate-600 tracking-wider shadow-sm">
                      {badgeLogic.filter(b => b.unlocked).length} Lencana Diraih
                    </span>
                  </div>
                </Card>
              </section>

              <div className="grid grid-cols-2 gap-5 md:gap-7">
                <Card className="bg-white border-emerald-100 border-b-8">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowUpCircle className="text-emerald-500 mb-1" size={20} />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pemasukan</span>
                    <p className="font-black text-slate-800 text-[15px]">Rp {totalStats.income.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
                <Card className="bg-white border-rose-100 border-b-8">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowDownCircle className="text-rose-500 mb-1" size={20} />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pengeluaran</span>
                    <p className="font-black text-slate-800 text-[15px]">Rp {totalStats.expense.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
              </div>

              <section className="space-y-5">
                <div className="flex justify-between items-center px-3">
                  <h3 className="font-black text-xl flex items-center gap-3 text-slate-800">
                    <Target className="w-6 h-6 text-indigo-500" /> Prioritas Tabungan
                  </h3>
                  <button 
                    onClick={() => { setModalType('goal'); setShowAddModal(true); }}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors shadow-sm active:scale-90"
                  >
                    <PlusCircle size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  {goalsWithProgress.length === 0 ? (
                    <Card noScale className="text-center py-12 border-dashed border-2 border-slate-200 opacity-40 bg-transparent">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Belum ada target impian</p>
                    </Card>
                  ) : (
                    goalsWithProgress.map(goal => (
                      <Card key={goal.id} className="p-7 border-l-[10px] border-l-indigo-400 relative bg-white">
                        <div className="flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                               <div className="text-4xl bg-slate-50 w-14 h-14 flex items-center justify-center rounded-2xl shadow-inner border border-slate-100">
                                {goal.icon}
                              </div>
                              <span className="font-black text-slate-800 text-[18px]">{goal.title}</span>
                            </div>
                            <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="text-rose-200 hover:text-rose-500 transition-colors">
                              <Trash2 size={20} />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <ProgressBar progress={(goal.current/goal.target)*100} colorClass={goal.current >= goal.target ? "bg-emerald-400" : "bg-gradient-to-r from-indigo-400 to-indigo-600"} />
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                              <span>Tercakup: Rp {goal.current.toLocaleString('id-ID')}</span>
                              <span className={goal.current >= goal.target ? "text-emerald-500" : ""}>Target: Rp {goal.target.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-black text-3xl px-3 text-slate-900">Arsip Transaksi</h3>
              <div className="flex overflow-x-auto gap-3 pb-3 no-scrollbar">
                <button onClick={() => setSelectedMonthFilter('all')} className={`flex-shrink-0 px-7 py-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all shadow-md ${selectedMonthFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>Semua</button>
                {NAMA_BULAN.map((bulan, index) => (
                  <button key={bulan} onClick={() => setSelectedMonthFilter(index.toString())} className={`flex-shrink-0 px-7 py-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all shadow-md ${selectedMonthFilter === index.toString() ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{bulan}</button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-24 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <History className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-300 font-black uppercase text-[11px] tracking-widest">Data tidak ditemukan</p>
                  </div>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-5 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {tx.category === 'makanan' ? <Utensils size={24} /> : <ShoppingBag size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 text-[16px] truncate">{tx.note}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-[15px] ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>Rp {tx.amount.toLocaleString('id-ID')}</p>
                        <button onClick={() => setTransactions(transactions.filter(t => t.id !== tx.id))} className="text-slate-200 hover:text-rose-500 transition-colors active:scale-90 mt-1"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-7 sticky top-10">
          <Card noScale className="bg-white border-t-8 border-t-emerald-400 shadow-xl">
            <h4 className="font-black text-[11px] uppercase text-slate-400 mb-5 flex items-center gap-2 tracking-widest"><WalletCards size={16} className="text-emerald-500" /> Analisa Cepat</h4>
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-black text-slate-400 block mb-1 uppercase tracking-tighter">Rasio Hemat</span>
                <p className="text-3xl font-black text-slate-800">{totalStats.income > 0 ? Math.round(((totalStats.income - totalStats.expense) / totalStats.income) * 100) : 0}%</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-tighter text-center">Gaya Hidup vs Gaji</span>
                <ProgressBar progress={totalStats.income > 0 ? (totalStats.expense / totalStats.income) * 100 : 0} colorClass={(totalStats.expense / totalStats.income) > 0.7 ? "bg-rose-400" : "bg-emerald-400"} />
              </div>
            </div>
          </Card>
          <div className="px-7 text-center text-slate-200">
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">PennyPal v8.4</p>
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl flex items-center justify-around px-7 z-50 border border-white/10">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <Wallet size={26} />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => { setModalType('transaction'); setShowAddModal(true); }} className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 -mt-12 shadow-xl transition-all hover:rotate-90 active:scale-90"><PlusCircle size={34} /></button>
        <button onClick={() => setActiveTab('riwayat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'riwayat' ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <History size={26} />
          <span className="text-[9px] font-black uppercase tracking-widest">Arsip</span>
        </button>
      </nav>

      {/* Modal Badges */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-7 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-xs rounded-[3rem] p-9 text-center space-y-5 shadow-2xl scale-in-center border border-white/50 relative">
              <button onClick={() => setSelectedBadge(null)} className="absolute top-7 right-7 text-slate-300 hover:text-slate-600"><X size={24}/></button>
              <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center text-6xl mb-3 ${selectedBadge.unlocked ? 'bg-yellow-50 shadow-inner' : 'bg-slate-100 opacity-50'}`}>{selectedBadge.unlocked ? selectedBadge.icon : <Lock size={36} className="text-slate-400" />}</div>
              <h3 className="text-3xl font-black text-slate-800">{selectedBadge.name}</h3>
              <p className="text-[15px] font-bold text-slate-500 leading-relaxed">{selectedBadge.desc}</p>
              <div className="pt-5"><span className={`px-5 py-3 rounded-full text-[11px] font-black uppercase tracking-widest ${selectedBadge.unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{selectedBadge.unlocked ? 'Sudah Diraih ✨' : 'Belum Terkunci 🔒'}</span></div>
              <button onClick={() => setSelectedBadge(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest mt-5 hover:bg-indigo-600 transition-colors">Sip, Mengerti!</button>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-5 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-md rounded-[3rem] p-9 space-y-7 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/50">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">{modalType === 'transaction' ? 'Tambah Catatan ✨' : 'Target Baru 🎯'}</h3>
              <button onClick={resetForm} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={24} /></button>
            </div>
            {modalType === 'transaction' ? (
              <div className="space-y-5">
                <div className="flex gap-3 p-1.5 bg-slate-100 rounded-2xl">
                  <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-white shadow text-rose-500' : 'text-slate-400'}`}>Keluar</button>
                  <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase transition-all ${formData.type === 'income' ? 'bg-white shadow text-emerald-500' : 'text-slate-400'}`}>Masuk</button>
                </div>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-6 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-100 outline-none font-bold text-slate-800 shadow-sm" />
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">Rp</span>
                  <input type="text" placeholder="0" value={formatCurrencyInput(formData.amount)} onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-4xl font-black pl-16 p-7 bg-white rounded-3xl border-2 border-slate-100 focus:border-indigo-100 outline-none shadow-inner text-slate-800" />
                </div>
                <input type="text" placeholder="Keterangan..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-6 bg-white rounded-2xl border-2 border-slate-100 outline-none font-bold shadow-inner text-slate-800 placeholder:text-slate-300" />
                <button onClick={handleSaveTransaction} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-600">Simpan ✨</button>
              </div>
            ) : (
              <div className="space-y-5">
                <input type="text" placeholder="Judul Impian..." value={formData.goalTitle} onChange={(e) => setFormData({...formData, goalTitle: e.target.value})} className="w-full p-6 bg-white rounded-2xl border-2 border-slate-100 font-bold shadow-inner text-slate-800 placeholder:text-slate-300" />
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">Rp</span>
                  <input type="text" placeholder="Harga" value={formatCurrencyInput(formData.targetAmount)} onChange={(e) => setFormData({...formData, targetAmount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-3xl font-black pl-14 p-6 bg-white rounded-3xl border-2 border-slate-100 outline-none shadow-inner text-slate-800" />
                </div>
                <div className="grid grid-cols-7 gap-2.5 py-2">{GOAL_ICONS.map(icon => (<button key={icon} onClick={() => setFormData({...formData, goalIcon: icon})} className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${formData.goalIcon === icon ? 'bg-indigo-50 border-indigo-400 scale-110 shadow-md' : 'bg-white border-slate-50 hover:bg-slate-50'}`}>{icon}</button>))}</div>
                <button onClick={handleSaveGoal} className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700">Mulai Menabung! 🚀</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        body { font-family: 'Fredoka', sans-serif; background-color: #FDFBF7; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { display: none; }
        .scale-in-center { animation: scale-in-center 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        @keyframes scale-in-center { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
}