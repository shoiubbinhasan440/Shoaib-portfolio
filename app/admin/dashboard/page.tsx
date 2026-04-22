'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    videos: 0,
    graphics: 0,
    categories: 0,
    views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [videos, graphics, categories, views] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact' }),
        supabase.from('graphics').select('id', { count: 'exact' }),
        supabase.from('categories').select('id', { count: 'exact' }),
        supabase.from('page_views').select('id', { count: 'exact' }),
      ]);

      setStats({
        videos: videos.count || 0,
        graphics: graphics.count || 0,
        categories: categories.count || 0,
        views: views.count || 0,
      });
      setLoading(false);
    }

    void load();
  }, []);

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  const statCards = [
    { label: 'মোট ভিডিও', value: stats.videos, icon: '🎬', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { label: 'মোট গ্রাফিক্স', value: stats.graphics, icon: '🎨', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
    { label: 'ক্যাটাগরি', value: stats.categories, icon: '📂', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
    { label: 'মোট ভিজিটর', value: stats.views, icon: '👁️', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ];

  const menuItems = [
    { label: 'ভিডিও ম্যানেজার', desc: 'ভিডিও যোগ, এডিট, ডিলিট করুন', icon: '🎬', href: '/admin/videos' },
    { label: 'গ্রাফিক্স ম্যানেজার', desc: 'ছবি আপলোড ও ম্যানেজ করুন', icon: '🎨', href: '/admin/graphics' },
    { label: 'Tutorial ম্যানেজার', desc: 'Tutorial যোগ ও এডিট করুন', icon: '🎓', href: '/admin/tutorials' },
    { label: 'ক্যাটাগরি ম্যানেজার', desc: 'ক্যাটাগরি যোগ ও এডিট করুন', icon: '📂', href: '/admin/categories' },
    { label: 'হোম পেজ এডিটর', desc: 'Hero, Showreel, Stats আপডেট করুন', icon: '🏠', href: '/admin/settings' },
    { label: 'নেভিগেশন এডিটর', desc: 'মেনু আইটেম ম্যানেজ করুন', icon: '🧭', href: '/admin/navigation' },
    { label: 'Visual Editor', desc: 'Website এর সব text, font, color এডিট করুন', icon: '✏️', href: '/admin/editor' },
    { label: 'পোর্টফোলিও দেখুন', desc: 'লাইভ সাইট দেখুন', icon: '🌐', href: '/' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top Bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">SF</div>
          <div>
            <div className="font-semibold text-sm">Admin Panel</div>
            <div className="text-xs text-gray-500">Md. Minhajul Hoque Portfolio</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          লগআউট
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">স্বাগতম! 👋</h1>
          <p className="text-gray-400 text-sm">এখান থেকে আপনার পোর্টফোলিও সাইট সম্পূর্ণ কন্ট্রোল করুন।</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`border rounded-xl p-4 ${card.color}`}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : card.value}
              </div>
              <div className="text-xs mt-1 opacity-80">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">কী করতে চান?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 text-left transition-all hover:bg-gray-800 group"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="font-medium text-sm mb-1 group-hover:text-blue-400 transition-colors">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Quick tip */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
          <span className="font-medium">💡 টিপস:</span> ভিডিও ম্যানেজার থেকে YouTube লিঙ্ক দিলেই পোর্টফোলিওতে অটো দেখাবে।
        </div>
      </div>
    </div>
  );
}
