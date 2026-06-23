"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Skinview3d from "react-skinview3d";
import * as skinview3d from "skinview3d";
import { LogOut, Upload, Edit3, Save, X, Calendar, User } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  
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
    } catch (err) {
      alert("Failed to upload skin.");
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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-black text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center w-full mb-10"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Ryoiki Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-xl transition-all font-medium">
            <LogOut size={18} />
            Log Out
          </button>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* 3D Skin Viewer Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card w-full p-8 flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40 relative overflow-hidden"
          >
            {/* Ambient glow behind the character */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
              {profile.skin_url ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Skinview3d
                    skinUrl={profile.skin_url}
                    height={300}
                    width={200}
                    onReady={(viewer) => {
                      viewer.animation = new skinview3d.IdleAnimation();
                      viewer.autoRotate = true;
                      viewer.autoRotateSpeed = 0.5;
                    }}
                  />
                </div>
              ) : (
                <div className="h-[300px] w-full flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/20">
                  <User size={48} className="opacity-50" />
                  <span>No Skin Uploaded</span>
                </div>
              )}
            </div>

            <input 
              type="file" 
              accept=".png" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleSkinUpload} 
            />
            
            <button 
              className="w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Custom Skin (.png)
                </>
              )}
            </button>
          </motion.div>

          {/* User Details Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Username Section */}
            <div className="glass-card w-full p-8 flex flex-col gap-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
              <h3 className="text-gray-400 font-medium text-sm tracking-wider uppercase">Minecraft Identity</h3>
              
              <AnimatePresence mode="wait">
                {isEditingUsername ? (
                  <motion.form 
                    key="edit"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onSubmit={handleUpdateUsername}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="flex-1 bg-white/10 border border-indigo-500/50 text-white rounded-xl px-4 py-2 outline-none focus:bg-white/15 transition-all"
                        placeholder="New Username"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsEditingUsername(false)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSavingUsername || !newUsername.trim() || newUsername === profile.username}
                        className="p-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-50"
                      >
                        {isSavingUsername ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                      </button>
                    </div>
                    {editError && <span className="text-red-400 text-sm pl-1">{editError}</span>}
                  </motion.form>
                ) : (
                  <motion.div 
                    key="view"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 group hover:bg-white/10 hover:border-white/10 transition-all"
                  >
                    <span className="text-2xl font-bold">{profile.username}</span>
                    <button 
                      onClick={() => {
                        setNewUsername(profile.username);
                        setIsEditingUsername(true);
                        setEditError("");
                      }}
                      className="text-gray-500 group-hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                      title="Edit Username"
                    >
                      <Edit3 size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account Details Section */}
            <div className="glass-card w-full p-8 flex flex-col gap-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
              <h3 className="text-gray-400 font-medium text-sm tracking-wider uppercase">Account Details</h3>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </main>
  );
}
