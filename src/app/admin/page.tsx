"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, ShieldAlert, Ban, Star, Trash2, Home, Search, ShieldCheck, Shield } from "lucide-react";

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

  return <canvas ref={canvasRef} width={128} height={128} className="w-12 h-12 rounded-lg border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.05)]" />;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [myRole, setMyRole] = useState("User");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ryoiki_token");
    const uuid = localStorage.getItem("ryoiki_uuid");
    if (!token || !uuid) {
      router.push("/");
      return;
    }

    fetchUsers(token, uuid);
  }, []);

  const fetchUsers = async (token: string, uuid: string) => {
    try {
      const profileRes = await fetch(`/api/profile/${uuid}`);
      if (!profileRes.ok) {
        setErrorMsg("Failed to load profile.");
        setLoading(false);
        return;
      }
      
      const profileData = await profileRes.json();
      setMyRole(profileData.role || "User");

      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 403 || res.status === 401) {
        setErrorMsg("Forbidden. You must be a Founder or Moderator to view this page.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unknown error occurred.");
      setLoading(false);
    }
  };

  const handleAction = async (targetUuid: string, action: string) => {
    if (action === 'DELETE' && !confirm("Are you sure you want to PERMANENTLY delete this user?")) return;
    
    setActionLoading(targetUuid);
    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ action, targetUuid })
      });
      if (res.ok) {
        const token = localStorage.getItem("ryoiki_token") || "";
        const uuid = localStorage.getItem("ryoiki_uuid") || "";
        await fetchUsers(token, uuid);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err: any) {
      alert("Action failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-black text-white">
        <div className="w-full max-w-2xl relative z-10 mt-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center bg-black/80 border border-white/10 p-12 rounded-3xl backdrop-blur-xl text-center shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <ShieldAlert size={64} className="text-white mb-6" />
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Access Denied</h1>
            <p className="text-gray-400 mb-8">{errorMsg}</p>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl transition-all font-semibold">
              <Home size={18} />
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-monochrome-gradient text-white">
      {/* Monochrome Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[30%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center w-full mb-8 bg-black/60 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-white">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Control</h1>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Ryoiki Global Moderation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 bg-white/5 hover:bg-white/15 text-white border border-white/10 px-5 py-2.5 rounded-xl transition-all font-semibold">
              <Home size={18} />
              Return
            </button>
          </div>
        </motion.div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card bg-black/40 border border-white/10 p-6 rounded-3xl flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Total Users</p>
            <p className="text-4xl font-bold tracking-tight">{users.length}</p>
          </div>
          
          <div className="md:col-span-2 glass-card bg-black/40 border border-white/10 p-6 rounded-3xl flex flex-col justify-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-white/30 focus:bg-white/10 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* User Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/60 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-5 font-semibold text-xs text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="p-5 font-semibold text-xs text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="p-5 font-semibold text-xs text-gray-400 uppercase tracking-wider">Status & Role</th>
                  <th className="p-5 font-semibold text-xs text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="p-5 font-semibold text-xs text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.uuid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <SkinHead skinUrl={user.skin_url || "https://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b"} />
                        <span className="font-bold text-lg">{user.username}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-400 font-medium">{user.email}</td>
                    <td className="p-5">
                      <div className="flex flex-col gap-2 items-start">
                        {user.isBanned ? (
                          <span className="bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded border border-red-500/30 flex items-center gap-1.5 font-bold"><Ban size={12}/> BANNED</span>
                        ) : (
                          <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded border border-white/20 flex items-center gap-1.5 font-bold"><ShieldCheck size={12}/> ACTIVE</span>
                        )}
                        {user.role === 'Founder' && <span className="text-white bg-white/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Star size={12}/> FOUNDER</span>}
                        {user.role === 'Mod' && <span className="text-gray-300 bg-white/10 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><ShieldCheck size={12}/> MODERATOR</span>}
                        {user.role === 'VIP' && <span className="text-gray-400 bg-white/5 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Star size={12}/> VIP</span>}
                      </div>
                    </td>
                    <td className="p-5 text-gray-500 text-sm font-medium">{formatDate(user.createdAt)}</td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        {myRole === 'Founder' && user.role !== 'Founder' && (
                          <button 
                            disabled={actionLoading === user.uuid}
                            onClick={() => handleAction(user.uuid, 'TOGGLE_MOD')}
                            title="Toggle Moderator"
                            className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white hover:text-black border border-white/10 hover:border-white transition-all"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        {user.role !== 'Founder' && (
                          <>
                            <button 
                              disabled={actionLoading === user.uuid}
                              onClick={() => handleAction(user.uuid, 'TOGGLE_VIP')}
                              title="Toggle VIP"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white hover:text-black border border-white/10 hover:border-white transition-all"
                            >
                              <Star size={16} />
                            </button>
                            <button 
                              disabled={actionLoading === user.uuid}
                              onClick={() => handleAction(user.uuid, 'TOGGLE_BAN')}
                              title={user.isBanned ? "Unban" : "Ban"}
                              className={`p-2.5 rounded-xl border transition-all ${user.isBanned ? 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-black' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white'}`}
                            >
                              <Ban size={16} />
                            </button>
                          </>
                        )}
                        {myRole === 'Founder' && user.role !== 'Founder' && (
                          <button 
                            disabled={actionLoading === user.uuid}
                            onClick={() => handleAction(user.uuid, 'DELETE')}
                            title="Delete Account"
                            className="p-2.5 rounded-xl bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-medium">No users found.</div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
