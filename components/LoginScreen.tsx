
import React, { useState } from 'react';
import { Lock, User, LogIn, Database, Zap, Chrome } from 'lucide-react';
import { login } from '../services/authService';
import { UserAccount } from '../types';
import { DEFAULT_ADMIN } from '../services/db';
import { auth, googleProvider, signInWithPopup } from '../firebase';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(username, password);
    if (user) onLoginSuccess(user);
    else setError('Username atau password salah.');
  };

  const handleQuickAccess = () => {
    onLoginSuccess(DEFAULT_ADMIN);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLoginSuccess({
        username: user.displayName || user.email || 'User',
        password: '',
        role: 'user', // Default role, should be checked against db in a real app
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Google login error:", error);
      setError('Gagal login dengan Google.');
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-300 blur-[120px] rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-purple-100 w-full max-w-md rounded-3xl shadow-2xl shadow-purple-200/50 p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200">
             <Database className="w-8 h-8 text-tcm-primary" />
          </div>
          <h1 className="text-2xl font-black text-purple-950 uppercase tracking-tighter">TCM WuXing PRO</h1>
          <p className="text-purple-500 text-xs font-bold uppercase tracking-widest mt-1">Clinical Decision Support System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-purple-50/50 border border-purple-200 rounded-2xl py-4 pl-12 pr-4 text-purple-950 focus:border-tcm-primary focus:bg-white outline-none transition-all"
              placeholder="Username"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-purple-50/50 border border-purple-200 rounded-2xl py-4 pl-12 pr-4 text-purple-950 focus:border-tcm-primary focus:bg-white outline-none transition-all"
              placeholder="Password"
            />
          </div>
          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
          
          <button type="submit" className="w-full bg-tcm-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all">
             MASUK SISTEM
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-purple-100">
           <button 
             onClick={handleGoogleLogin}
             className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm mb-4"
           >
              <Chrome className="w-5 h-5 text-blue-500" /> LOGIN DENGAN GOOGLE
           </button>
           <button 
             onClick={handleQuickAccess}
             className="w-full flex items-center justify-center gap-2 py-4 bg-purple-100 border border-purple-200 text-tcm-primary font-black rounded-2xl hover:bg-tcm-primary hover:text-white transition-all group"
           >
              <Zap className="w-5 h-5 group-hover:animate-bounce" /> AKSES CEPAT (ADMIN LOKAL)
           </button>
           <p className="text-[10px] text-purple-400 text-center mt-4 uppercase font-black tracking-widest">Login Google diperlukan untuk sinkronisasi antar perangkat.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
