/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  PieChart, 
  LogOut, 
  User as UserIcon,
  PlusCircle,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import Markdown from 'react-markdown';
import { cn, formatCurrency } from './lib/utils';

// --- Types ---
interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

interface Claim {
  id: number;
  policy_id: string;
  incident_type: string;
  incident_severity: string;
  total_claim_amount: number;
  fraud_score: number;
  fraud_explanation: string;
  status: 'pending' | 'flagged' | 'approved';
  created_at: string;
}

interface Stats {
  totalClaims: number;
  flaggedClaims: number;
  totalAmount: number;
  severityStats: { name: string; value: number }[];
  fraudTrend: { date: string; avg_score: number }[];
}

// --- Components ---

const Sidebar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = window.location.pathname;
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Claims', path: '/claims' },
    { icon: PlusCircle, label: 'New Claim', path: '/new-claim' },
  ];

  if (user.role === 'admin') {
    navItems.push({ icon: ShieldAlert, label: 'Fraud Analysis', path: '/analysis' });
  }

  return (
    <div className="w-64 bg-zinc-950 text-zinc-400 h-screen flex flex-col border-r border-zinc-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <ShieldAlert className="text-white w-5 h-5" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">SENTINEL</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              location === item.path 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "hover:bg-zinc-900 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.username}</p>
            <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) return <div className="p-8 text-zinc-500">Loading metrics...</div>;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">System Overview</h1>
        <p className="text-zinc-500 mt-1">Real-time fraud detection metrics and claim statistics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Claims', value: stats.totalClaims, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Flagged High Risk', value: stats.flaggedClaims, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Claim Value', value: formatCurrency(stats.totalAmount), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Fraud Score', value: `${Math.round(stats.fraudTrend.reduce((acc, curr) => acc + curr.avg_score, 0) / (stats.fraudTrend.length || 1))}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            Severity Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.severityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            Fraud Score Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.fraudTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="avg_score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewClaimForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    policy_id: '',
    incident_date: '',
    incident_type: 'Single Vehicle Collision',
    incident_severity: 'Minor Damage',
    authorities_contacted: 'Police',
    incident_state: 'NY',
    incident_city: 'New York',
    property_damage: 'NO',
    police_report_available: 'YES',
    total_claim_amount: '',
    injury_claim: '',
    property_claim: '',
    vehicle_claim: '',
    auto_make: '',
    auto_model: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });
      if (res.ok) {
        navigate('/claims');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Submit New Claim</h1>
        <p className="text-zinc-500 mt-1">Provide accurate details for AI-assisted fraud verification.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Policy ID</label>
            <input 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={formData.policy_id}
              onChange={e => setFormData({...formData, policy_id: e.target.value})}
              placeholder="e.env-123456"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Incident Date</label>
            <input 
              required
              type="date"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={formData.incident_date}
              onChange={e => setFormData({...formData, incident_date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Incident Type</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={formData.incident_type}
              onChange={e => setFormData({...formData, incident_type: e.target.value})}
            >
              <option>Single Vehicle Collision</option>
              <option>Multi-vehicle Collision</option>
              <option>Parked Car</option>
              <option>Vehicle Theft</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Incident Severity</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={formData.incident_severity}
              onChange={e => setFormData({...formData, incident_severity: e.target.value})}
            >
              <option>Minor Damage</option>
              <option>Total Loss</option>
              <option>Major Damage</option>
              <option>Trivial Damage</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900">Financial Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Total Claim Amount ($)</label>
              <input 
                required
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.total_claim_amount}
                onChange={e => setFormData({...formData, total_claim_amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Injury Claim ($)</label>
              <input 
                required
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.injury_claim}
                onChange={e => setFormData({...formData, injury_claim: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button 
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Claim...
              </>
            ) : (
              'Submit for AI Verification'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const ClaimsList = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        setClaims(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Claims Repository</h1>
          <p className="text-zinc-500 mt-1">Manage and audit all submitted insurance claims.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            placeholder="Search policy ID..."
            className="pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none w-64"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-bottom border-zinc-200">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Policy ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-zinc-900">{claim.policy_id}</td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{claim.incident_type}</td>
                <td className="px-6 py-4 text-zinc-900 font-medium">{formatCurrency(claim.total_claim_amount)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-20">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          claim.fraud_score > 70 ? "bg-red-500" : claim.fraud_score > 40 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${claim.fraud_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">{claim.fraud_score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    claim.status === 'flagged' ? "bg-red-50 text-red-600" : 
                    claim.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                    "bg-amber-50 text-amber-600"
                  )}>
                    {claim.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedClaim(claim)}
                    className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-900 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-zinc-900">Claim Analysis</h2>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full"
                >
                  <PlusCircle className="w-6 h-6 rotate-45 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div className={cn(
                  "p-6 rounded-2xl flex items-start gap-4",
                  selectedClaim.fraud_score > 70 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"
                )}>
                  {selectedClaim.fraud_score > 70 ? (
                    <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h3 className={cn("font-bold text-lg", selectedClaim.fraud_score > 70 ? "text-red-900" : "text-emerald-900")}>
                      {selectedClaim.fraud_score > 70 ? 'High Risk Detected' : 'Low Risk Claim'}
                    </h3>
                    <p className={cn("text-sm mt-1", selectedClaim.fraud_score > 70 ? "text-red-700" : "text-emerald-700")}>
                      AI Confidence Score: {selectedClaim.fraud_score}%
                    </p>
                  </div>
                </div>

                <section>
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">AI Explanation</h4>
                  <div className="prose prose-zinc max-w-none">
                    <Markdown>{selectedClaim.fraud_explanation}</Markdown>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">Incident Type</p>
                    <p className="font-semibold">{selectedClaim.incident_type}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">Severity</p>
                    <p className="font-semibold">{selectedClaim.incident_severity}</p>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <ShieldAlert className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Sentinel</h1>
          <p className="text-zinc-500 mt-2">Insurance Fraud Detection System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Username</label>
            <input 
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Password</label>
            <input 
              required
              type="password"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-zinc-50 font-sans">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsList />} />
            <Route path="/new-claim" element={<NewClaimForm />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
