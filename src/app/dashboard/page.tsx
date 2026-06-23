"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const token = localStorage.getItem("ryoiki_token");
    const uuid = localStorage.getItem("ryoiki_uuid");
    if (!token || !uuid) {
      router.push("/");
      return;
    }

    fetch(`${API_URL}/api/profile/${uuid}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, [router, API_URL]);

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
      const res = await fetch(`${API_URL}/api/profile/skin`, {
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

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <main className="flex flex-col items-center p-8 w-full max-w-4xl mx-auto">
      
      <div className="flex justify-between items-center w-full mb-8">
        <h1 className="text-3xl font-bold">Ryoiki Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary">Log Out</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="card p-8 flex flex-col items-center gap-4 animate-fade-in">
          <div className="h-32 w-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 flex items-center justify-center relative">
            {profile.skin_url ? (
              <img src={profile.skin_url} alt="Skin" className="h-full object-cover pixelated" />
            ) : (
              <span className="text-gray-500">No Skin</span>
            )}
          </div>
          <h2 className="text-2xl font-bold">{profile.username}</h2>
          <p className="text-sm text-gray-400 text-center">
            Log in to the Ryoiki Launcher with your email and password to use this account in-game.
          </p>

          <input 
            type="file" 
            accept=".png" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleSkinUpload} 
          />
          <button 
            className="btn-primary w-full mt-4" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Custom Skin (.png)"}
          </button>
        </div>

        <div className="card p-8 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold border-b border-gray-800 pb-2">Cosmetics</h3>
          <p className="text-gray-400 text-sm">
            You can configure your unlocked cosmetics directly in the game client by pressing the Ryoiki Mod Menu bind (Right Shift).
          </p>
          <div className="bg-[#121212] rounded-md p-4 mt-4 border border-[#2e2e2e]">
            <p className="text-sm text-gray-300">
              When using the Ryoiki Launcher, your custom skin and cosmetics will be synchronized automatically to everyone else using the client!
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
