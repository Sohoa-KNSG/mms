import React, { useState } from 'react';
import { LogIn, Lock, User as UserIcon, AlertCircle, Loader2, ShieldCheck, Database } from 'lucide-react';
import { authService, UserSession } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !password) {
      setError('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await authService.login(userName, password);
    setLoading(false);

    if (result.success && result.data) {
      onLoginSuccess(result.data);
    } else {
      setError(result.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden industrial-grid-bg">
      {/* Glow background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-8 text-white text-center relative">
          <div className="w-20 h-20 max-w-[80px] max-h-[80px] bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/40 shadow-xl p-1.5 overflow-hidden" style={{ width: '80px', height: '80px' }}>
            <img 
              src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png" 
              alt="KNSG Logo" 
              className="w-full h-full object-contain" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight">MMS SMART FACTORY</h1>
          <p className="text-emerald-100 text-xs mt-1.5 font-medium">Hệ thống Quản lý Kho Vật tư & Chuỗi Cung Ứng</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-[11px] font-mono text-emerald-200">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>CSDL MMS (KNSG)</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xác thực người dùng</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bảo mật hệ thống</span>
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Đăng nhập không thành công</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mã nhân viên / Tên đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nhập mã nhân viên hoặc tên đăng nhập"
                disabled={loading}
                autoFocus
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối SQL Server...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright */}
      <footer className="mt-8 text-center text-xs text-slate-500">
        <p>© 2026 MMS Material Management System – Phiên bản Web React 19</p>
      </footer>
    </div>
  );
};
