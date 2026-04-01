import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Lightbulb,
  Lock,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  Wallet,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- Komponen Utilitas ---

const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all active:scale-95 lg:active:scale-100 lg:hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] lg:hover:-translate-y-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
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

// --- Helper Fungsi ---
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
  // --- State Utama (Mulai dari KOSONG) ---
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('pennypal_v6_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('pennypal_v6_goals');
    return saved ? JSON.parse(saved) : [];
  });

  // State UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('transaction'); 
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date().getMonth().toString());
  const [selectedBadge, setSelectedBadge] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    amount: '', note: '', type: 'expense', category: 'makanan',
    date: new Date().toISOString().split('T')[0],
    targetAmount: '', goalTitle: '', goalIcon: '🎯'
  });

  useEffect(() => {
    localStorage.setItem('pennypal_v6_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pennypal_v6_goals', JSON.stringify(goals));
  }, [goals]);

  // --- Logika Kalkulasi ---
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

  // --- Logika Pencapaian (Badges) Dinamis ---
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
    if (transactions.length === 0) return { emoji: '🥚', color: 'bg-slate-100', text: 'Halo! Mari mulai mencatat.', textColor: 'text-slate-600', tip: "Klik tombol '+' di bawah untuk mencatat transaksi pertamamu hari ini!" };
    if (totalBalance < 0) return { emoji: '😵', color: 'bg-rose-100', text: 'Saldo minus! Ayo hemat!', textColor: 'text-rose-700', tip: "Hentikan semua pengeluaran non-primer sekarang juga." };
    if (totalBalance < 500000) return { emoji: '😟', color: 'bg-amber-100', text: 'Dompet mulai tipis...', textColor: 'text-amber-700', tip: "Coba masak di rumah untuk menghemat budget makan." };
    if (totalBalance > 5000000) return { emoji: '😎', color: 'bg-emerald-100', text: 'Lagi banyak uang nih!', textColor: 'text-emerald-700', tip: "Waktu yang tepat untuk menambah alokasi tabungan impian." };
    return { emoji: '😊', color: 'bg-sky-100', text: 'Keuangan aman, Sobat!', textColor: 'text-sky-700', tip: "Jangan lupa sedekah dan sisihkan untuk dana darurat." };
  }, [totalBalance, transactions.length]);

  // --- Handlers ---
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 pb-32 overflow-x-hidden font-fredoka">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-peach-100/30 rounded-full blur-[100px]" />
      </div>

      <header className="p-6 md:p-10 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 rotate-3">
            <Wallet className="text-white w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">PennyPal</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Smart Savings</p>
          </div>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border-2 border-indigo-50 p-1 shadow-sm overflow-hidden">
          <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buddy" alt="avatar" />
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Kolom Kiri: Sidebar Dinamis */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-10">
          {/* Perbaikan Warna Teks: Menggunakan teks gelap di atas latar terang untuk legibilitas maksimal */}
          <Card className="bg-indigo-50 border-indigo-100 text-slate-900 relative group border-2">
            <div className="absolute top-4 right-4 opacity-10">
              <Lightbulb size={24} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-500" />
              <h4 className="font-black text-[10px] uppercase tracking-wider text-indigo-600">Analisa Sobat</h4>
            </div>
            <p className="text-xs font-bold leading-relaxed text-slate-700">
              {walletMood.tip}
            </p>
          </Card>

          <Card className="bg-white border-2 border-indigo-50">
            <h4 className="font-black text-[10px] uppercase text-slate-400 mb-4 tracking-widest">Pencapaian Kamu</h4>
            <div className="grid grid-cols-3 gap-3">
              {badgeLogic.map((badge) => (
                <div 
                  key={badge.id} 
                  onClick={() => setSelectedBadge(badge)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all hover:scale-110 cursor-pointer border-2 ${badge.unlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100 opacity-30 grayscale'}`}
                >
                  {badge.unlocked ? badge.icon : <Lock size={16} className="text-slate-400" />}
                </div>
              ))}
            </div>
            <p className="text-[8px] font-black uppercase text-center mt-4 text-slate-300 tracking-tighter">Klik ikon untuk detail lencana</p>
          </Card>
        </aside>

        {/* Kolom Tengah: Konten Utama */}
        <main className="lg:col-span-6 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <section>
                <Card className={`text-center py-12 border-none shadow-2xl shadow-indigo-100/20 group ${walletMood.color}`}>
                  <div className="text-8xl md:text-9xl mb-6 transform group-hover:scale-105 transition-transform select-none">
                    {walletMood.emoji}
                  </div>
                  <h2 className={`text-4xl md:text-6xl font-black mb-1 ${walletMood.textColor}`}>
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </h2>
                  <p className={`text-sm md:text-base font-bold opacity-70 ${walletMood.textColor}`}>{walletMood.text}</p>
                  <div className="mt-6 flex justify-center gap-2">
                    <span className="px-3 py-1 bg-white/40 rounded-full text-[9px] font-black uppercase text-slate-600">{badgeLogic.filter(b => b.unlocked).length} Lencana Diraih</span>
                  </div>
                </Card>
              </section>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <Card className="bg-white border-emerald-100 border-b-8">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowUpCircle className="text-emerald-500 mb-1" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Pemasukan</span>
                    <p className="font-black text-slate-800 text-xs md:text-sm">Rp {totalStats.income.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
                <Card className="bg-white border-rose-100 border-b-8">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ArrowDownCircle className="text-rose-500 mb-1" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Pengeluaran</span>
                    <p className="font-black text-slate-800 text-xs md:text-sm">Rp {totalStats.expense.toLocaleString('id-ID')}</p>
                  </div>
                </Card>
              </div>

              {/* Target Tabungan Waterfall */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" /> Prioritas Tabungan
                  </h3>
                  <button 
                    onClick={() => { setModalType('goal'); setShowAddModal(true); }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {goalsWithProgress.length === 0 ? (
                    <Card className="text-center py-10 border-dashed border-2 border-slate-200 opacity-40">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada target impian</p>
                    </Card>
                  ) : (
                    goalsWithProgress.map(goal => (
                      <Card key={goal.id} className="p-6 border-l-8 border-l-indigo-400 relative bg-white">
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl shadow-inner">
                                {goal.icon}
                              </div>
                              <span className="font-black text-slate-800 text-base">{goal.title}</span>
                            </div>
                            <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="text-rose-200 hover:text-rose-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <ProgressBar progress={(goal.current/goal.target)*100} colorClass={goal.current >= goal.target ? "bg-emerald-400" : "bg-gradient-to-r from-indigo-400 to-indigo-600"} />
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-black text-2xl px-2 text-slate-900">Arsip Transaksi</h3>
              <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                <button 
                  onClick={() => setSelectedMonthFilter('all')}
                  className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedMonthFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  Semua
                </button>
                {NAMA_BULAN.map((bulan, index) => (
                  <button 
                    key={bulan}
                    onClick={() => setSelectedMonthFilter(index.toString())}
                    className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedMonthFilter === index.toString() ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    {bulan}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <History className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Data tidak ditemukan</p>
                  </div>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {tx.category === 'makanan' ? <Utensils size={20} /> : <ShoppingBag size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 text-sm truncate">{tx.note}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('id-ID')}
                        </p>
                        <button onClick={() => setTransactions(transactions.filter(t => t.id !== tx.id))} className="text-slate-200 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        {/* Kolom Kanan: Analisa Pengeluaran (Hanya Laptop Luas) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-10">
          <Card className="bg-white border-t-8 border-t-emerald-400">
            <h4 className="font-black text-[10px] uppercase text-slate-400 mb-4 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" /> Analisa Cepat
            </h4>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-tighter">Rasio Hemat</span>
                <p className="text-2xl font-black text-slate-800">
                  {totalStats.income > 0 ? Math.round(((totalStats.income - totalStats.expense) / totalStats.income) * 100) : 0}%
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter text-center">Gaya Hidup vs Gaji</span>
                <ProgressBar 
                  progress={totalStats.income > 0 ? (totalStats.expense / totalStats.income) * 100 : 0} 
                  colorClass={(totalStats.expense / totalStats.income) > 0.7 ? "bg-rose-400" : "bg-emerald-400"} 
                />
              </div>
            </div>
          </Card>

          <div className="px-6 text-center text-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">PennyPal v6.0</p>
          </div>
        </aside>
      </div>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl flex items-center justify-around px-6 z-50 border border-white/10">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <Wallet size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => { setModalType('transaction'); setShowAddModal(true); }}
          className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-indigo-600 -mt-10 shadow-xl transition-all hover:rotate-90 active:scale-90"
        >
          <PlusCircle size={30} />
        </button>
        <button onClick={() => setActiveTab('riwayat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'riwayat' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <History size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">Arsip</span>
        </button>
      </nav>

      {/* Modal Detail Lencana */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 text-center space-y-4 shadow-2xl scale-in-center border border-white/50">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-2 ${selectedBadge.unlocked ? 'bg-yellow-50' : 'bg-slate-100 opacity-50'}`}>
                {selectedBadge.unlocked ? selectedBadge.icon : <Lock size={32} className="text-slate-400" />}
              </div>
              <h3 className="text-2xl font-black text-slate-800">{selectedBadge.name}</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">{selectedBadge.desc}</p>
              <div className="pt-4">
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${selectedBadge.unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {selectedBadge.unlocked ? 'Sudah Diraih ✨' : 'Belum Terkunci 🔒'}
                </span>
              </div>
              <button onClick={() => setSelectedBadge(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-slate-800 transition-colors">Tutup</button>
           </div>
        </div>
      )}

      {/* Modal Input */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/50">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black uppercase tracking-tighter">{modalType === 'transaction' ? 'Tambah Catatan ✨' : 'Target Baru 🎯'}</h3>
              <button onClick={resetForm} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            {modalType === 'transaction' ? (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-white shadow text-rose-500' : 'text-slate-400'}`}>Keluar</button>
                  <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === 'income' ? 'bg-white shadow text-emerald-500' : 'text-slate-400'}`}>Masuk</button>
                </div>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-2 border-slate-50 focus:border-indigo-100 outline-none font-bold text-slate-800" />
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                  <input type="text" placeholder="0" value={formatCurrencyInput(formData.amount)} onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-3xl font-black pl-14 p-6 bg-white rounded-3xl border-2 border-slate-50 focus:border-indigo-100 outline-none shadow-inner text-slate-800" />
                </div>
                <input type="text" placeholder="Keterangan..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-2 border-slate-50 outline-none font-bold shadow-inner text-slate-800 placeholder:text-slate-300" />
                <button onClick={handleSaveTransaction} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all hover:bg-slate-800">Simpan ✨</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="text" placeholder="Judul Impian..." value={formData.goalTitle} onChange={(e) => setFormData({...formData, goalTitle: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-2 border-slate-50 font-bold shadow-inner text-slate-800 placeholder:text-slate-300" />
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                  <input type="text" placeholder="Harga" value={formatCurrencyInput(formData.targetAmount)} onChange={(e) => setFormData({...formData, targetAmount: e.target.value.replace(/[^0-9]/g, '')})} className="w-full text-2xl font-black pl-14 p-5 bg-white rounded-3xl border-2 border-slate-50 outline-none shadow-inner text-slate-800" />
                </div>
                <div className="grid grid-cols-7 gap-2 py-2">
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} onClick={() => setFormData({...formData, goalIcon: icon})} className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${formData.goalIcon === icon ? 'bg-indigo-50 border-indigo-400 scale-110 shadow-md' : 'bg-white border-slate-50 hover:bg-slate-50'}`}>{icon}</button>
                  ))}
                </div>
                <button onClick={handleSaveGoal} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700">Mulai Menabung! 🚀</button>
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
        @keyframes scale-in-center {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}