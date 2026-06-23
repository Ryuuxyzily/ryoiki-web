"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, ShieldAlert, Ban, Star, Trash2, Home, Search, ShieldCheck } from "lucide-react";

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

  return <canvas ref={canvasRef} width={128} height={128} className="w-12 h-12 rounded-lg border border-white/20" />;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ryoiki_token");
    if (!token) {
      router.push("/");
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 403 || res.status === 401) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
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
        await fetchUsers();
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
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-[#0a0a0a] text-white">
      {/* Red Admin Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[30%] w-[40%] h-[40%] rounded-full bg-red-900/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center w-full mb-8 bg-black/60 border border-red-900/30 p-6 rounded-3xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30 text-red-500">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-50">Secret Admin Panel</h1>
              <p className="text-red-400/60 text-sm">Ryoiki Global Moderation Control</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-5 py-2.5 rounded-xl transition-all font-medium">
              <Home size={18} />
              Return
            </button>
          </div>
        </motion.div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-center">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-4xl font-bold">{users.length}</p>
          </div>
          
          <div className="md:col-span-2 glass-card bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-red-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* User Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-medium text-gray-400">Player</th>
                  <th className="p-4 font-medium text-gray-400">Email</th>
                  <th className="p-4 font-medium text-gray-400">Status & Role</th>
                  <th className="p-4 font-medium text-gray-400">Joined</th>
                  <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.uuid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <SkinHead skinUrl={user.skin_url || "https://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b"} />
                        <span className="font-bold">{user.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {user.isBanned ? (
                          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md border border-red-500/30 flex items-center gap-1"><Ban size={12}/> Banned</span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1"><ShieldCheck size={12}/> Active</span>
                        )}
                        {user.role === 'Founder' && <span className="text-yellow-400 text-xs font-bold flex items-center gap-1 mt-1"><Star size={12}/> Founder</span>}
                        {user.role === 'VIP' && <span className="text-purple-400 text-xs font-bold flex items-center gap-1 mt-1"><Star size={12}/> VIP</span>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        {user.role !== 'Founder' && (
                          <>
                            <button 
                              disabled={actionLoading === user.uuid}
                              onClick={() => handleAction(user.uuid, 'TOGGLE_VIP')}
                              title="Toggle VIP"
                              className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-colors"
                            >
                              <Star size={16} />
                            </button>
                            <button 
                              disabled={actionLoading === user.uuid}
                              onClick={() => handleAction(user.uuid, 'TOGGLE_BAN')}
                              title={user.isBanned ? "Unban" : "Ban"}
                              className={`p-2 rounded-lg transition-colors ${user.isBanned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white'}`}
                            >
                              <Ban size={16} />
                            </button>
                            <button 
                              disabled={actionLoading === user.uuid}
                              onClick={() => handleAction(user.uuid, 'DELETE')}
                              title="Delete Account"
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">No users found.</div>
            )}
          </div>
        </motion.div>

      </div>
    </main>
  );
}
