"use client";

import { useState } from "react";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("Processing...");
    try {
      if (isLogin) {
        // Login
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        localStorage.setItem("ryoiki_token", data.token);
        localStorage.setItem("ryoiki_uuid", data.uuid);
        window.location.href = "/dashboard";
      } else {
        // Register (Step 1)
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMsg(data.message);
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Server error");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    }
  };

  return (
    <main className="flex flex-col items-center justify-center p-8 w-full max-w-md">
      <div className="card w-full p-8 flex flex-col gap-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Ryoiki Network</h1>
          <p className="text-gray-400 text-sm">
            {step === "otp" 
              ? "Verify your email to continue" 
              : isLogin ? "Sign in to your account" : "Create a new Ryoiki account"}
          </p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}
        {msg && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-md text-sm">{msg}</div>}

        {step === "otp" ? (
          <form key="otp" onSubmit={handleVerify} className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">OTP Code</label>
              <input type="text" className="input-field" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} required />
              <p className="text-xs text-gray-500 mt-2">Check the backend console for the OTP.</p>
            </div>
            <button type="submit" className="btn-primary mt-2">Verify Account</button>
          </form>
        ) : (
          <form key={isLogin ? "login" : "register"} onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">{isLogin ? "Email or Username" : "Email Address"}</label>
              <input type="text" className="input-field" placeholder="steve@minecraft.net" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-1 text-gray-300">Minecraft Username</label>
                <input type="text" className="input-field" placeholder="Steve" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary mt-2">
              {isLogin ? "Sign In" : "Register"}
            </button>
          </form>
        )}

        {step === "form" && (
          <div className="text-center mt-2">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-400 hover:text-white transition-colors">
              {isLogin ? "Need an account? Register here." : "Already have an account? Sign in."}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
