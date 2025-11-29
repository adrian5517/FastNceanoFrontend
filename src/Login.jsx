import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { QrCode, User, Lock } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setError("");
        // Store token locally for authenticated requests
        try { localStorage.setItem('token', data.token); } catch (e) { console.warn('Could not store token', e); }
        if (onLoginSuccess) onLoginSuccess(data.token);
        // Navigate to dashboard / root
        navigate('/');
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05220F] to-[#0E3A1A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-6 relative"
      >
        {/* Radial gold highlight */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 bg-[radial-gradient(ellipse_at_center,#FFD84A33_0%,transparent_70%)] pointer-events-none" />
        {/* Thin gold top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FFD84A] via-[#F3C324] to-[#FFD84A] rounded-t-2xl" />
        <div className="flex flex-col items-center gap-2 mb-4">
          <QrCode className="text-[#F3C324] w-10 h-10 mb-1 drop-shadow" />
          <h1 className="text-white text-3xl md:text-4xl font-semibold tracking-tight">FastNCeano</h1>
          <h2 className="text-white/80 text-sm md:text-base text-center">QR Code Library Scanner • Naga College Foundation</h2>
          <span className="text-white/60 text-xs">Secure, real‑time library attendance and monitoring</span>
        </div>
        <div className="border-b border-white/10 mb-6" />
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="username" className="text-white/80 text-sm">Email or Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#094318] w-5 h-5" />
              <input
                id="username"
                type="text"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/20 text-[#094318] placeholder-[#3C5A29] border border-[#F3C324] focus:outline-none focus:ring-2 focus:ring-[#FFD84A]"
                placeholder="you@ncf.edu.ph"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-white/80 text-sm">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#094318] w-5 h-5" />
              <input
                id="password"
                type="password"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/20 text-[#094318] placeholder-[#3C5A29] border border-[#F3C324] focus:outline-none focus:ring-2 focus:ring-[#FFD84A]"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 rounded-xl font-medium bg-[#F3C324] text-[#15280D] hover:bg-[#FFD84A] active:bg-[#E6C12B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFD84A]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm">
          <button type="button" className="text-white/70 hover:text-white underline underline-offset-4">
            Forgot password?
          </button>
          <span className="text-white/50">© Naga College Foundation</span>
        </div>
      </motion.div>
    </div>
  );
}
