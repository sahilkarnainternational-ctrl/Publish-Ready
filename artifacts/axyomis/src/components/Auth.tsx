import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Chrome, Loader2, AlertCircle, Globe2 } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, updateUserProfile } from '../services/firebase';

interface AuthProps {
  onSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');

  // Map Firebase error codes to human-friendly messages
  const getAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';
    if (code === 'auth/invalid-email') return 'Invalid email address. Please check and try again.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Incorrect email or password.';
    if (code === 'auth/user-not-found') return 'No account found. Please sign up first.';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Please log in.';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (code === 'auth/popup-blocked') return 'Sign-in popup blocked. Please allow popups or try again.';
    if (code === 'auth/popup-closed-by-user') return 'Sign-in popup closed. Please try again.';
    if (code === 'auth/network-request-failed') return 'Network error. Please check your connection and try again.';
    if (code === 'auth/unauthorized-domain') return 'Domain not authorized. Add this site to Firebase authorized domains.';
    if (msg?.includes('client is offline')) return 'Cannot connect to Firebase. Please check your internet connection.';
    return msg || 'Authentication failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        const user = await signUpWithEmail(email, password, name);
        await updateUserProfile(user.uid, { gender });
      }
      onSuccess?.();
    } catch (err: any) {
      setError(getAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      const code = err?.code || '';
      // Redirect fallback fires its own flow; no need to show error for popup-blocked
      if (code !== 'auth/popup-blocked' && code !== 'auth/popup-closed-by-user') {
        setError(getAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto relative group">
      {/* Background Decorative Globe Icon */}
      <div className="absolute -inset-24 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity">
        <Globe2 className="scale-75 blur-[2px]" />
      </div>

      <motion.div 
        layout
        className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-mono">
              Join the scientific community
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 mb-8">
            <button 
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mode === 'login' ? 'bg-white/5 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mode === 'signup' ? 'bg-white/5 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Signup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-[#16161a]/50 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all text-sm font-mono"
                  />
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${gender === 'male' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${gender === 'female' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                    >
                      Female
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#16161a]/50 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all text-sm font-mono"
            />

            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#16161a]/50 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all text-sm font-mono"
            />

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-[10px] bg-red-400/5 p-3 rounded-xl border border-red-400/10 flex items-center gap-2"
              >
                <AlertCircle className="w-3 h-3" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-4 shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-10 flex items-center justify-center">
            <div className="absolute w-full border-t border-white/5" />
            <span className="relative bg-[#0c0c0e] px-4 text-[9px] text-slate-600 uppercase tracking-[0.4em] font-black italic">OR</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/[0.03] border border-white/5 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center gap-3"
          >
            <Chrome className="w-4 h-4 text-blue-400" />
            Sign in with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

