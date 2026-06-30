"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Download, Lock, CheckCircle, Package } from "lucide-react";

export default function CosmeticsStore() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"FREE" | "PREMIUM">("FREE");
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const freeCapes = Array.from({ length: 8 }, (_, i) => `free-cape-${i + 1}`);
  const premiumCapes = Array.from({ length: 6 }, (_, i) => `premium-cape-${i + 1}`);

  useEffect(() => {
    const fetchProfile = async () => {
      const uuid = localStorage.getItem("ryoiki_uuid");
      if (!uuid) {
        router.push("/");
        return;
      }
      try {
        const res = await fetch(`/api/profile/${uuid}`);
        if (res.ok) {
          const data = await res.json();
          setOwnedCosmetics(data.owned_cosmetics || []);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleClaim = async (capeId: string) => {
    setClaiming(capeId);
    try {
      const token = localStorage.getItem("ryoiki_token");
      const res = await fetch("/api/cosmetics/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cosmeticId: capeId })
      });
      if (res.ok) {
        const data = await res.json();
        setOwnedCosmetics(data.owned_cosmetics);
      } else {
        alert("Failed to claim cape.");
      }
    } catch (err) {
      alert("An error occurred.");
    } finally {
      setClaiming(null);
    }
  };

  const getCapeName = (id: string) => {
    return id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
      {/* Background Glow */}
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
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Cosmetics Store</h1>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Customize your character</p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 bg-white/5 hover:bg-white/15 text-white border border-white/10 px-5 py-2.5 rounded-xl transition-all font-semibold">
            <Home size={18} />
            Dashboard
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 gap-4">
          <button 
            onClick={() => setActiveTab("FREE")}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === "FREE" ? "bg-white text-black shadow-lg" : "bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10"}`}
          >
            Free Capes
          </button>
          <button 
            onClick={() => setActiveTab("PREMIUM")}
            className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${activeTab === "PREMIUM" ? "bg-white text-black shadow-lg" : "bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10"}`}
          >
            <Lock size={16} />
            Premium
          </button>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {(activeTab === "FREE" ? freeCapes : premiumCapes).map(capeId => {
            const isOwned = ownedCosmetics.includes(capeId);
            const isPremium = activeTab === "PREMIUM";

            return (
              <motion.div 
                key={capeId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card bg-black/40 border border-white/10 p-4 rounded-3xl flex flex-col items-center justify-between group overflow-hidden relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500 pointer-events-none" />
                
                <h3 className="text-lg font-bold mb-4 z-10 text-center">{getCapeName(capeId)}</h3>
                
                <div className="w-full h-48 bg-white/5 rounded-2xl mb-4 flex items-center justify-center p-2 border border-white/5 group-hover:border-white/20 transition-all z-10 overflow-hidden relative">
                  <img 
                    src={`/capes/${activeTab.toLowerCase()}/${capeId}-sample.png`} 
                    alt={capeId} 
                    className="h-full object-cover" 
                    style={{ imageRendering: "pixelated" }} 
                  />
                </div>

                {isPremium ? (
                  <button disabled className="w-full bg-white/10 text-gray-400 py-3 rounded-xl font-bold border border-white/10 flex items-center justify-center gap-2 z-10 cursor-not-allowed">
                    <Lock size={16} /> Premium Only
                  </button>
                ) : isOwned ? (
                  <button disabled className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 z-10 opacity-70">
                    <CheckCircle size={16} /> Owned
                  </button>
                ) : (
                  <button 
                    onClick={() => handleClaim(capeId)}
                    disabled={claiming === capeId}
                    className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    {claiming === capeId ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Download size={16} /> Get Now</>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Owned Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-black/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-lg mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">My Collection</h2>
          <p className="text-gray-400 mb-6 font-medium">Cosmetics you own will automatically sync to your Ryoiki Launcher.</p>

          {ownedCosmetics.length === 0 ? (
            <div className="w-full bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
              <Package size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 font-bold">You don't own any cosmetics yet.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {ownedCosmetics.map(capeId => {
                const folder = capeId.startsWith("free") ? "free" : "premium";
                return (
                  <div key={capeId} className="flex-shrink-0 w-32 bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                    <img 
                    src={`/capes/${folder}/${capeId}-sample.png`}
                      alt={capeId} 
                      className="w-full h-24 object-cover rounded-xl mb-3" 
                      style={{ imageRendering: "pixelated" }} 
                    />
                    <p className="text-xs font-bold text-center w-full truncate">{getCapeName(capeId)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
