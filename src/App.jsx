import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ghost,
  History,
  Lock,
  LogIn,
  LogOut,
  PlusCircle,
  ShoppingBag,
  Star,
  Target,
  Trash2,
  User,
  Utensils,
  Wallet,
  WalletCards,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- Komponen Utilitas ---

const Card = ({ children, className = "", onClick, noScale = false }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[2.5rem] p-7 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all ${!noScale ? 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''} lg:hover:-translate-y-1 lg:hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const ProgressBar = ({ progress, colorClass = "bg-indigo-400" }) => {
  const safeProgress = isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 100);
  return (
    <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border-4 border-slate-900 p-1 shadow-inner">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
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
    const saved = localStorage.getItem('pennypal_active_user_v10');
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
      const savedTx = localStorage.getItem(`pennypal_v10_${currentUser.username}_transactions`);
      const savedGoals = localStorage.getItem(`pennypal_v10_${currentUser.username}_goals`);
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
      setGoals(savedGoals ? JSON.parse(savedGoals) : []);
    }
  }, [currentUser]);

  // Save User Data
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pennypal_v10_${currentUser.username}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`pennypal_v10_${currentUser.username}_goals`, JSON.stringify(goals));
    }
  }, [transactions, goals, currentUser]);

  const handleAuthAction = () => {
    setAuthError('');
    const normalizedUsername = authForm.username.trim();
    if (!normalizedUsername || !authForm.password) {
      setAuthError('Isi dulu ya, Sobat!');
      return;
    }

    const users = JSON.parse(localStorage.getItem('pennypal_users_v10') || '[]');

    if (authMode === 'register') {
      if (users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
        setAuthError('Nama ini sudah ada yang punya!');
        return;
      }
      const newUser = { username: normalizedUsername, password: authForm.password };
      users.push(newUser);
      localStorage.setItem('pennypal_users_v10', JSON.stringify(users));
      setCurrentUser(newUser);
      localStorage.setItem('pennypal_active_user_v10', JSON.stringify(newUser));
    } else {
      const user = users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase() && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('pennypal_active_user_v10', JSON.stringify(user));
      } else {
        setAuthError('Username atau password salah, hiks!');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pennypal_active_user_v10');
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
    if (transactions.length === 0) return { emoji: '🥚', color: 'bg-yellow-100', text: 'Halo! Mari mulai mencatat.', textColor: 'text-slate-900', tip: "Klik tombol '+' di bawah untuk mencatat transaksi pertamamu." };
    if (totalBalance < 0) return { emoji: '😵', color: 'bg-rose-100', text: 'Saldo minus! Ayo hemat!', textColor: 'text-rose-900', tip: "Waduh, pengeluaranmu lebih besar dari pemasukan nih!" };
    if (totalBalance < 500000) return { emoji: '😟', color: 'bg-amber-100', text: 'Dompet mulai tipis...', textColor: 'text-amber-900', tip: "Coba masak di rumah yuk untuk menghemat budget makan." };
    if (totalBalance > 5000000) return { emoji: '😎', color: 'bg-emerald-100', text: 'Lagi banyak uang nih!', textColor: 'text-emerald-900', tip: "Waktu yang tepat untuk mengisi alokasi tabungan impian." };
    return { emoji: '😊', color: 'bg-sky-100', text: 'Keuangan aman, Sobat!', textColor: 'text-sky-900', tip: "Jangan lupa sisihkan sedikit untuk dana darurat ya." };
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
      <div className="min-h-screen bg-[#FFE5D9] flex items-center justify-center p-6 font-fredoka overflow-hidden relative">
        <div className="absolute top-[-5%] left-[-5%] w-full h-full bg-[radial-gradient(#FFB38E_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-30" />
        
        <Card noScale className="w-full max-w-sm p-10 space-y-8 relative z-10">
          <div className="text-center space-y-4">
             <div className="p-6 bg-indigo-500 rounded-[2.5rem] shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] inline-block border-4 border-slate-900 transform transition-all">
                <Wallet className="text-white w-12 h-12" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">PennyPal</h1>
                <p className="text-[12px] font-black text-slate-800 uppercase tracking-[0.3em] mt-2">Kartun Keuanganmu</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-900 ml-4 tracking-widest">Username</label>
              <input 
                type="text" 
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                className="w-full p-5 bg-white rounded-2xl border-4 border-slate-900 focus:bg-indigo-50 outline-none font-bold transition-all text-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                placeholder="Namamu?"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-900 ml-4 tracking-widest">Password</label>
              <input 
                type="password" 
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full p-5 bg-white rounded-2xl border-4 border-slate-900 focus:bg-indigo-50 outline-none font-bold transition-all text-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                placeholder="Rahasia..."
              />
            </div>

            {authError && (
              <div className="bg-rose-100 border-4 border-slate-900 p-4 rounded-2xl">
                <p className="text-[11px] font-black text-rose-600 text-center uppercase tracking-wider">{authError}</p>
              </div>
            )}

            <button 
              onClick={handleAuthAction}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[14px] tracking-widest shadow-[6px_6px_0px_0px_rgba(99,102,241,1)] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:translate-y-[4px] active:shadow-none"
            >
              {authMode === 'login' ? <LogIn size={22} /> : <User size={22} />}
              {authMode === 'login' ? 'Gass Masuk!' : 'Daftar Sekarang'}
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
              className="px-8 py-3 text-[12px] font-black text-indigo-600 border-4 border-indigo-600 rounded-2xl hover:bg-white transition-all uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] active:translate-y-[2px] active:shadow-none"
            >
              {authMode === 'login' ? 'Daftar Baru' : 'Login Aja'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-32 overflow-x-hidden font-fredoka text-[15px]">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:32px_32px] -z-10" />

      <header className="p-7 md:p-10 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] border-4 border-slate-900 transition-transform">
            <Wallet className="text-white w-7 h-7 md:w-9 md:h-9" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-none uppercase outline-text text-slate-900">PennyPal</h1>
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mt-1">Smart Savings</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Halo, Sobat!</span>
              <span className="text-[16px] font-black text-slate-900">{currentUser.username}</span>
           </div>
           <button 
              onClick={handleLogout}
              className="p-4 bg-white border-4 border-slate-900 rounded-2xl hover:bg-rose-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none"
              title="Logout"
            >
              <LogOut size={22} className="text-slate-900" />
            </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-7 grid grid-cols-1 lg:grid-cols-12 gap-9 items-start">
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-7 sticky top-10">
          <Card noScale className="bg-yellow-100 border-slate-900 relative shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="absolute top-4 right-4 opacity-20">
              <Wallet size={26} className="text-slate-900" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <WalletCards size={18} className="text-slate-900" />
              <h4 className="font-black text-[12px] uppercase tracking-widest text-slate-900">Analisa Sobat</h4>
            </div>
            <p className="text-[14px] font-black leading-relaxed text-slate-900">
              {walletMood?.tip}
            </p>
          </Card>

          <Card noScale className="bg-white border-slate-900">
            <h4 className="font-black text-[12px] uppercase text-slate-900 mb-5 tracking-widest border-b-4 border-slate-900 pb-2 inline-block">Pencapaian</h4>
            <div className="grid grid-cols-3 gap-3">
              {badgeLogic.map((badge) => (
                <div 
                  key={badge.id} 
                  onClick={() => setSelectedBadge(badge)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 cursor-pointer border-4 border-slate-900 ${badge.unlocked ? 'bg-indigo-400' : 'bg-slate-100 opacity-30 grayscale'}`}
                >
                  {badge.unlocked ? badge.icon : <Lock size={18} className="text-slate-500" />}
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="lg:col-span-6 space-y-9">
          {activeTab === 'dashboard' && (
            <div className="space-y-9 animate-in fade-in slide-in-from-top-4 duration-700">
              <section>
                <Card className={`text-center py-14 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] border-slate-900 ${walletMood?.color}`}>
                  <div className="text-8xl md:text-9xl mb-7 transform group-hover:scale-105 transition-transform select-none drop-shadow-xl animate-wobble">
                    {walletMood?.emoji}
                  </div>
                  <h2 className={`text-4xl md:text-5xl font-black mb-1 ${walletMood?.textColor}`}>
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </h2>
                  <p className={`text-[17px] font-black uppercase tracking-widest ${walletMood?.textColor}`}>{walletMood?.text}</p>
                </Card>
              </section>

              <div className="grid grid-cols-2 gap-5 md:gap-7">
                <Card className="bg-emerald-400 border-slate-900">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowUpCircle className="mb-1 text-slate-900" size={24} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Debet</span>
                    <p className="font-black text-[16px] text-slate-900">Rp {totalStats.income.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
                <Card className="bg-rose-400 border-slate-900">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowDownCircle className="mb-1 text-slate-900" size={24} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Kredit</span>
                    <p className="font-black text-[16px] text-slate-900">Rp {totalStats.expense.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
              </div>

              <section className="space-y-5">
                <div className="flex justify-between items-center px-3">
                  <h3 className="font-black text-2xl flex items-center gap-3 uppercase tracking-tighter text-slate-900">
                    <Target className="w-8 h-8 text-slate-900" /> Target Impian
                  </h3>
                  <button 
                    onClick={() => { setModalType('goal'); setShowAddModal(true); }}
                    className="p-3 bg-indigo-500 border-4 border-slate-900 rounded-2xl hover:bg-indigo-600 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none"
                  >
                    <PlusCircle size={28} className="text-white" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  {goalsWithProgress.length === 0 ? (
                    <Card noScale className="text-center py-12 border-dashed border-4 border-slate-400 opacity-50 bg-transparent shadow-none translate-y-0 active:translate-y-0">
                      <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-700">Belum ada mimpi yang dicatat</p>
                    </Card>
                  ) : (
                    goalsWithProgress.map(goal => (
                      <Card key={goal.id} className="p-7 border-slate-900 relative bg-white border-l-[16px] border-l-indigo-500">
                        <div className="flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                               <div className="text-4xl bg-slate-100 w-16 h-16 flex items-center justify-center rounded-[1.5rem] border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                                {goal.icon}
                              </div>
                              <span className="font-black text-[20px] uppercase text-slate-900">{goal.title}</span>
                            </div>
                            <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="p-2 text-rose-500 hover:scale-125 transition-all">
                              <Trash2 size={24} />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <ProgressBar progress={(goal.current/goal.target)*100} colorClass="bg-indigo-500" />
                            <div className="flex justify-between text-[12px] font-black uppercase tracking-tighter text-slate-700">
                              <span className="text-indigo-700 font-black">Tersedia: Rp {goal.current.toLocaleString('id-ID')}</span>
                              <span className="text-slate-600">Tuju: Rp {goal.target.toLocaleString('id-ID')}</span>
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
              <h3 className="font-black text-3xl px-3 uppercase tracking-tighter text-slate-900">Arsip Keuangan</h3>
              <div className="flex overflow-x-auto gap-3 pb-3 no-scrollbar px-2">
                <button onClick={() => setSelectedMonthFilter('all')} className={`flex-shrink-0 px-8 py-4 rounded-2xl text-[12px] font-black uppercase transition-all border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${selectedMonthFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-900'}`}>Semua</button>
                {NAMA_BULAN.map((bulan, index) => (
                  <button key={bulan} onClick={() => setSelectedMonthFilter(index.toString())} className={`flex-shrink-0 px-8 py-4 rounded-2xl text-[12px] font-black uppercase transition-all border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${selectedMonthFilter === index.toString() ? 'bg-indigo-500 text-white' : 'bg-white text-slate-900'}`}>{bulan}</button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-400">
                    <Ghost className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 font-black uppercase tracking-widest text-[14px]">Kosong Melompong</p>
                  </div>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-5 p-6 bg-white rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-transform hover:scale-[1.02]">
                      <div className={`w-14 h-14 rounded-2xl border-4 border-slate-900 flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-300' : 'bg-rose-300'}`}>
                        {tx.category === 'makanan' ? <Utensils size={24} className="text-slate-900" /> : <ShoppingBag size={24} className="text-slate-900" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-[18px] uppercase leading-none mb-1 truncate text-slate-900">{tx.note}</h4>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-[16px] ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>Rp {tx.amount.toLocaleString('id-ID')}</p>
                        <button onClick={() => setTransactions(transactions.filter(t => t.id !== tx.id))} className="text-slate-500 hover:text-rose-600 mt-1 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-7 sticky top-10">
          <Card noScale className="bg-indigo-50 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="font-black text-[12px] uppercase text-slate-900 mb-5 flex items-center gap-2 border-b-4 border-slate-900/10 pb-2">Analisa Cepat</h4>
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-black text-slate-600 block mb-1 uppercase tracking-tighter">Rasio Hemat</span>
                <p className="text-4xl font-black text-slate-900">{totalStats.income > 0 ? Math.round(((totalStats.income - totalStats.expense) / totalStats.income) * 100) : 0}%</p>
              </div>
              <div className="p-5 bg-white/50 rounded-2xl border-4 border-slate-900/10">
                <span className="text-[10px] font-black text-slate-700 block mb-2 uppercase text-center tracking-widest">Beban Belanja</span>
                <ProgressBar progress={totalStats.income > 0 ? (totalStats.expense / totalStats.income) * 100 : 0} colorClass="bg-rose-400" />
              </div>
            </div>
          </Card>
          <div className="px-7 text-center">
            <p className="text-[12px] font-black uppercase tracking-[0.5em] mb-2 text-slate-900">PennyPal v10.2</p>
            <div className="flex justify-center gap-2 text-slate-900">
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" />
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 bg-white border-4 border-slate-900 rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] flex items-center justify-around px-7 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-500 hover:text-indigo-600'}`}>
          <Wallet size={28} />
          <span className="text-[10px] font-black uppercase tracking-widest">Beranda</span>
        </button>
        <button onClick={() => { setModalType('transaction'); setShowAddModal(true); }} className="w-16 h-16 bg-yellow-400 border-4 border-slate-900 rounded-3xl flex items-center justify-center text-slate-900 -mt-12 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:rotate-12 hover:bg-yellow-300 active:translate-y-1 active:shadow-none"><PlusCircle size={36} /></button>
        <button onClick={() => setActiveTab('riwayat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'riwayat' ? 'text-indigo-600 scale-110' : 'text-slate-500 hover:text-indigo-600'}`}>
          <History size={28} />
          <span className="text-[10px] font-black uppercase tracking-widest">Arsip</span>
        </button>
      </nav>

      {/* Modal Badges */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-7 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in">
           <Card noScale className="w-full max-w-xs p-9 text-center space-y-5 bg-white border-4 border-slate-900 relative shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] scale-in-center">
              <button onClick={() => setSelectedBadge(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-all hover:rotate-90 z-[210]"><X size={24}/></button>
              <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center text-6xl mb-3 border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] ${selectedBadge.unlocked ? 'bg-indigo-300' : 'bg-slate-100 opacity-50'}`}>{selectedBadge.unlocked ? selectedBadge.icon : <Lock size={36} className="text-slate-600" />}</div>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{selectedBadge.name}</h3>
              <p className="text-[14px] font-bold text-slate-700 leading-relaxed">{selectedBadge.desc}</p>
              <button onClick={() => setSelectedBadge(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest mt-5 hover:bg-indigo-600 active:translate-y-1 active:shadow-none">Mengerti!</button>
           </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-5 bg-slate-900/60 backdrop-blur-sm">
          <Card noScale className="bg-[#FDFBF7] w-full max-w-md rounded-[3rem] p-9 space-y-7 shadow-[16px_16px_0px_0px_rgba(15,23,42,1)] animate-in slide-in-from-bottom duration-300 border-4 border-slate-900 relative">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{modalType === 'transaction' ? 'Tambah Catatan ✨' : 'Target Baru 🎯'}</h3>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetForm(); }} 
                className="p-3 bg-white border-4 border-slate-900 rounded-full hover:bg-slate-100 transition-all relative z-[110] cursor-pointer"
              >
                <X size={24} className="text-slate-900" />
              </button>
            </div>
            {modalType === 'transaction' ? (
              <div className="space-y-5 relative z-[105]">
                <div className="flex gap-3 p-1.5 bg-slate-100 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-4 rounded-xl text-[12px] font-black uppercase transition-all ${formData.type === 'income' ? 'bg-emerald-400 text-white shadow-none' : 'text-slate-900'}`}>Debet</button>
                  <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-4 rounded-xl text-[12px] font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-rose-400 text-white shadow-none' : 'text-slate-900'}`}>Kredit</button>
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-slate-700 ml-4 mb-1 block tracking-widest">Tanggal</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    className="w-full p-6 bg-white rounded-2xl border-4 border-slate-900 focus:bg-indigo-50 outline-none font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900" 
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-slate-700 ml-4 mb-1 block tracking-widest">Nominal</label>
                  <span className="absolute left-6 top-[42px] font-black text-slate-900 text-xl">Rp</span>
                  <input type="text" placeholder="0" value={formatCurrencyInput(formData.amount)} onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-4xl font-black pl-16 p-7 bg-white rounded-3xl border-4 border-slate-900 focus:border-indigo-100 outline-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900" />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-slate-700 ml-4 mb-1 block tracking-widest">Keterangan</label>
                  <input type="text" placeholder=" " value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-6 bg-white rounded-2xl border-4 border-slate-900 outline-none font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900" />
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveTransaction(); }} 
                  className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl uppercase text-[12px] tracking-widest shadow-[6px_6px_0px_0px_rgba(99,102,241,1)] active:translate-y-[4px] active:shadow-none transition-all relative z-[110] cursor-pointer"
                >
                  Simpan ✨
                </button>
              </div>
            ) : (
              <div className="space-y-5 relative z-[105]">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-slate-700 ml-4 mb-1 block tracking-widest">Mimpi</label>
                  <input type="text" placeholder="Apa impianmu?" value={formData.goalTitle} onChange={(e) => setFormData({...formData, goalTitle: e.target.value})} className="w-full p-6 bg-white rounded-2xl border-4 border-slate-900 font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-slate-700 ml-4 mb-1 block tracking-widest">Harga</label>
                  <span className="absolute left-6 top-[42px] font-black text-slate-900 text-lg">Rp</span>
                  <input type="text" placeholder="Harga" value={formatCurrencyInput(formData.targetAmount)} onChange={(e) => setFormData({...formData, targetAmount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-3xl font-black pl-14 p-6 bg-white rounded-3xl border-4 border-slate-900 outline-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="grid grid-cols-7 gap-2.5 py-2">{GOAL_ICONS.map(icon => (<button key={icon} onClick={() => setFormData({...formData, goalIcon: icon})} className={`aspect-square flex items-center justify-center rounded-xl border-4 border-slate-900 transition-all ${formData.goalIcon === icon ? 'bg-yellow-300 scale-110 shadow-[4px_4px_0_rgba(15,23,42,1)]' : 'bg-white text-slate-900'}`}>{icon}</button>))}</div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveGoal(); }} 
                  className="w-full py-6 bg-indigo-500 text-white font-black rounded-3xl uppercase text-[12px] tracking-widest shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-[4px] active:shadow-none transition-all relative z-[110] cursor-pointer"
                >
                  Menabung! 🚀
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        body { font-family: 'Fredoka', sans-serif; background-color: #FDFBF7; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { display: none; }
        .scale-in-center { animation: scale-in-center 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        @keyframes scale-in-center { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes wobble { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .animate-wobble { animation: wobble 3s ease-in-out infinite; }
        .outline-text { -webkit-text-stroke: 1.5px #0f172a; }
        
        /* FIX: Menghapus area klik kalender yang meluap */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          color: transparent;
          cursor: pointer;
          height: 100%;
          width: 50px;
          position: absolute;
          right: 10px;
          top: 0;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}