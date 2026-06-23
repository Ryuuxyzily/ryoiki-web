"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Lock, ArrowRight, ShieldCheck, Gamepad2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the captcha.");
      return;
    }
    
    setError("");
    setMsg("");
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password, turnstileToken }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        localStorage.setItem("ryoiki_token", data.token);
        localStorage.setItem("ryoiki_uuid", data.uuid);
        window.location.href = "/dashboard";
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password, turnstileToken }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMsg(data.message);
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("ryoiki_token", data.token);
      localStorage.setItem("ryoiki_uuid", data.uuid);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="glass-card w-full p-8 flex flex-col gap-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
          
          <div className="text-center flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            >
              <Gamepad2 size={32} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Ryoiki Network</h1>
            <p className="text-gray-400 text-sm font-medium">
              {step === "otp" 
                ? "We sent a code to your email" 
                : isLogin ? "Welcome back, player" : "Begin your journey"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}
            
            {msg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {msg}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "otp" ? (
              <motion.form 
                key="otp" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerify} 
                className="flex flex-col gap-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-gray-500 tracking-[0.2em] font-mono text-center" 
                    placeholder="• • • • • •" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
                    required 
                    maxLength={6}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? "Verifying..." : "Verify Account"}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key={isLogin ? "login" : "register"} 
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit} 
                className="flex flex-col gap-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-gray-500" 
                    placeholder={isLogin ? "Email or Username" : "Email Address"} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="relative group overflow-hidden"
                    >
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-gray-500" 
                        placeholder="Minecraft Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required={!isLogin} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-gray-500" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex justify-center mt-2">
                  <Turnstile 
                    siteKey="0x4AAAAAADpuwrlqKdeClsMc" 
                    onSuccess={(token) => setTurnstileToken(token)}
                    options={{ theme: 'dark' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === "form" && (
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setMsg("");
                }} 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </main>
  );
}
