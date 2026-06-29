"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Upload, Edit3, Save, X, Calendar, User, Search, Shield, Users, Lock, Trash2, MessageSquare, ShieldAlert, Star, ShieldCheck } from "lucide-react";

const SkinHead = ({ skinUrl }: { skinUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = skinUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, 128, 128);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 128, 128);
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 128, 128);
    };
  }, [skinUrl]);

  return <canvas ref={canvasRef} width={128} height={128} className="rounded-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10" />;
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'community' | 'security'>('profile');
  
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  
  // Community Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("ryoiki_token");
    const uuid = localStorage.getItem("ryoiki_uuid");
    if (!token || !uuid) {
      router.push("/");
      return;
    }

    fetch(`/api/profile/${uuid}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("ryoiki_token");
    localStorage.removeItem("ryoiki_uuid");
    router.push("/");
  };

  const handleSkinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("skin", e.target.files[0]);

    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch(`/api/profile/skin`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfile({ ...profile, skin_url: data.skinUrl });
    } catch (err: any) {
      alert(`Failed to upload skin: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim() === profile.username) {
      setIsEditingUsername(false);
      return;
    }
    
    setEditError("");
    setIsSavingUsername(true);
    
    try {
      const token = localStorage.getItem("ryoiki_token");
      const uuid = localStorage.getItem("ryoiki_uuid");
      
      const res = await fetch(`/api/profile/update`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ uuid, newUsername })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfile({ ...profile, username: newUsername });
      setIsEditingUsername(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to update username");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) {
      setSearchError("Search must be at least 3 characters.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus("Updating...");
    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordStatus("Password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordStatus(""), 3000);
    } catch (err: any) {
      setPasswordStatus(`Error: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you absolutely sure you want to permanently delete your account? This cannot be undone!")) return;
    
    setDeleteStatus("Deleting...");
    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("Account successfully deleted.");
      handleLogout();
    } catch (err: any) {
      setDeleteStatus(`Error: ${err.message}`);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-monochrome-gradient text-white">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full border border-white/5 bg-white/5 blur-[100px]" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full border border-white/5 bg-white/5 blur-[120px]" 
        />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center w-full mb-8"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">Ryoiki Dashboard</h1>
          <div className="flex gap-3">
            {(profile?.role === 'Founder' || profile?.role === 'Mod' || profile?.email === 'chiragrathoreyu@gmail.com') && (
              <button 
                onClick={() => router.push('/admin')} 
                className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl transition-all font-semibold"
              >
                <ShieldAlert size={18} />
                Admin Panel
              </button>
            )}
            <a 
              href="https://discord.gg/qb2C7gRACu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl transition-all font-medium"
            >
              <MessageSquare size={18} />
              Discord
            </a>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-red-500/90 text-gray-300 hover:text-white border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-xl transition-all font-medium">
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <User size={16} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'community' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <Users size={16} /> Community
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <Shield size={16} /> Security
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
            >
              {/* Profile Card */}
              <div className="glass-card w-full p-8 flex flex-col items-center justify-center gap-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-48 h-48 bg-white/10 blur-[50px] rounded-full" />
                </div>
                <div className="relative z-10 w-full flex flex-col items-center">
                  <div className="h-[250px] w-full flex items-center justify-center p-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <SkinHead skinUrl={profile.skin_url || "https://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b"} />
                    </motion.div>
                  </div>
                </div>
                <input type="file" accept=".png" ref={fileInputRef} className="hidden" onChange={handleSkinUpload} />
                <button 
                  className="w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <><Upload size={18} /> Upload Custom Skin (.png)</>}
                </button>
              </div>

              {/* User Details */}
              <div className="flex flex-col gap-6">
                <div className="glass-card w-full p-8 flex flex-col gap-4 rounded-3xl">
                  <h3 className="text-gray-400 font-semibold text-xs tracking-[0.2em] uppercase">Minecraft Identity</h3>
                  <AnimatePresence mode="wait">
                    {isEditingUsername ? (
                      <motion.form key="edit" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onSubmit={handleUpdateUsername} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="flex-1 bg-black/50 border border-white/20 text-white rounded-xl px-4 py-2 outline-none focus:bg-white/5 focus:border-white transition-all" placeholder="New Username" autoFocus />
                          <button type="button" onClick={() => setIsEditingUsername(false)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
                          <button type="submit" disabled={isSavingUsername || !newUsername.trim() || newUsername === profile.username} className="p-3 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                            {isSavingUsername ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                          </button>
                        </div>
                        {editError && <span className="text-white text-sm pl-1">{editError}</span>}
                      </motion.form>
                    ) : (
                      <motion.div key="view" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-4 group hover:bg-white/5 hover:border-white/10 transition-all">
                        <span className="text-2xl font-bold tracking-tight text-white">{profile.username}</span>
                        <button onClick={() => { setNewUsername(profile.username); setIsEditingUsername(true); setEditError(""); }} className="text-gray-500 group-hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"><Edit3 size={18} /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="glass-card w-full p-8 flex flex-col gap-4 rounded-3xl">
                  <h3 className="text-gray-400 font-semibold text-xs tracking-[0.2em] uppercase">Account Details</h3>
                  <div className="flex flex-col gap-5 mt-2">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-white/20 transition-all"><User size={20} /></div>
                      <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Email Address</p><p className="font-medium text-white">{profile.email}</p></div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-white/20 transition-all"><Calendar size={20} /></div>
                      <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Member Since</p><p className="font-medium text-white">{formatDate(profile.createdAt)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div 
              key="community"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="glass-card w-full p-8 rounded-3xl"
            >
              <h2 className="text-2xl font-bold mb-6 tracking-tight text-white">User Search</h2>
              <form onSubmit={handleSearchUsers} className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for users by exact username..."
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-white/30 focus:bg-white/5 transition-all"
                  />
                </div>
                <button type="submit" disabled={isSearching} className="bg-white hover:bg-gray-200 text-black px-8 py-3.5 rounded-xl transition-all font-semibold disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
              
              {searchError && <p className="text-white mb-4 text-sm bg-white/10 p-3 rounded-lg border border-white/20 inline-block">{searchError}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {searchResults.map(user => (
                  <motion.div whileHover={{ y: -5 }} key={user.uuid} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-6 hover:bg-white/5 transition-all shadow-lg hover:border-white/20">
                    <SkinHead skinUrl={user.skin_url || "https://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b"} />
                    <div className="text-center w-full">
                      <p className="font-bold text-lg text-white mb-2">
                        {user.username}
                      </p>
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        {user.role === 'Founder' && <span className="bg-white text-black font-bold text-xs px-3 py-1 rounded flex items-center justify-center gap-1 w-full"><Star size={12}/> FOUNDER</span>}
                        {user.role === 'Mod' && <span className="bg-white/20 text-white border border-white/30 font-semibold text-xs px-3 py-1 rounded flex items-center justify-center gap-1 w-full"><ShieldCheck size={12}/> MODERATOR</span>}
                        {user.role === 'VIP' && <span className="bg-white/10 text-white border border-white/20 font-semibold text-xs px-3 py-1 rounded flex items-center justify-center gap-1 w-full"><Star size={12}/> VIP</span>}
                        {user.isBanned && <span className="bg-red-500/20 text-red-100 border border-red-500/50 font-bold text-xs px-3 py-1 rounded w-full">BANNED</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 font-medium uppercase tracking-wider">Joined {formatDate(user.createdAt)}</p>
                    </div>
                  </motion.div>
                ))}
                {searchResults.length === 0 && !isSearching && searchQuery && !searchError && (
                  <p className="text-gray-400 col-span-full text-center py-12 font-medium">No users found matching "{searchQuery}"</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
            >
              {/* Change Password */}
              <div className="glass-card w-full p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/10"><Lock size={20} className="text-white" /></div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Change Password</h2>
                </div>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-white/30 focus:bg-white/5 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-white/30 focus:bg-white/5 transition-all" />
                  </div>
                  <button type="submit" className="mt-2 bg-white hover:bg-gray-200 text-black px-6 py-3.5 rounded-xl font-semibold transition-all">Update Password</button>
                  {passwordStatus && <p className={`text-sm p-3 rounded-lg border inline-block mt-2 ${passwordStatus.includes('Error') ? 'text-red-200 bg-red-900/30 border-red-500/30' : 'text-green-200 bg-green-900/30 border-green-500/30'}`}>{passwordStatus}</p>}
                </form>
              </div>

              {/* Delete Account */}
              <div className="glass-card w-full p-8 rounded-3xl border-red-500/30 bg-red-950/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-red-500/20 rounded-xl border border-red-500/30"><Trash2 size={20} className="text-red-400" /></div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Danger Zone</h2>
                </div>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">Once you delete your account, there is no going back. All cosmetics, progress, and data will be permanently erased. Please be certain.</p>
                <form onSubmit={handleDeleteAccount} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-2 block">Confirm Password</label>
                    <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required className="w-full bg-black/50 border border-red-500/30 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:bg-red-950/30 transition-all" />
                  </div>
                  <button type="submit" className="mt-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 hover:border-red-500 px-6 py-3.5 rounded-xl font-semibold transition-all">Permanently Delete Account</button>
                  {deleteStatus && <p className="text-sm text-red-200 bg-red-900/30 p-3 rounded-lg border border-red-500/30 mt-2">{deleteStatus}</p>}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
