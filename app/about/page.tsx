'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const skills = [
    { name: 'Video Editing', level: 95, icon: '🎬' },
    { name: 'Color Grading', level: 90, icon: '🎨' },
    { name: 'Motion Graphics', level: 85, icon: '✨' },
    { name: 'Graphic Design', level: 88, icon: '🖌️' },
    { name: 'Poster Design', level: 92, icon: '📐' },
    { name: 'Logo Design', level: 80, icon: '💡' },
  ];

  const timeline = [
    { year: '2019', title: 'যাত্রা শুরু', desc: 'ভিডিও এডিটিং-এর প্রতি আগ্রহ জন্মায়, প্রথম প্রজেক্ট শুরু।' },
    { year: '2020', title: 'প্রথম ক্লায়েন্ট', desc: 'প্রথম পেশাদার ক্লায়েন্টের সাথে কাজ শুরু।' },
    { year: '2021', title: 'গ্রাফিক্স যোগ', desc: 'গ্রাফিক ডিজাইন স্কিল ডেভেলপ করা শুরু।' },
    { year: '2022', title: 'টিম গঠন', desc: 'নিজস্ব ছোট টিম তৈরি, বড় প্রজেক্টে কাজ।' },
    { year: '2023', title: 'বড় মাইলস্টোন', desc: '১০০+ সফল প্রজেক্ট সম্পন্ন।' },
    { year: '2024', title: 'নতুন উচ্চতা', desc: 'আন্তর্জাতিক ক্লায়েন্টদের সাথে কাজ শুরু।' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#ff6b35]">S</span>ayeed<span className="text-[#ff6b35]">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
            <Link href="/about" className="text-[#ff6b35]">About</Link>
            <Link href="/tutorial" className="hover:text-white transition-colors">Tutorial</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <Link href="/portfolio" className="px-4 py-2 bg-[#ff6b35] text-white text-sm rounded-full hover:bg-[#ff8555] transition-colors">
            Portfolio দেখুন
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#ff6b35]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff6b35]/3 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <p className="text-[#ff6b35] text-sm tracking-widest uppercase mb-4 font-medium">আমার সম্পর্কে</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                আমি একজন<br />
                <span className="text-[#ff6b35]">ক্রিয়েটিভ</span><br />
                ডিজাইনার
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                ভিডিও এডিটিং ও গ্রাফিক ডিজাইনে ৫+ বছরের অভিজ্ঞতা নিয়ে কাজ করছি। আমার লক্ষ্য প্রতিটি ক্লায়েন্টের স্বপ্নকে বাস্তবে রূপ দেওয়া।
              </p>
              <div className="flex gap-4">
                <Link href="/contact" className="px-6 py-3 bg-[#ff6b35] rounded-full text-sm font-medium hover:bg-[#ff8555] transition-colors">
                  যোগাযোগ করুন
                </Link>
                <Link href="/portfolio" className="px-6 py-3 border border-white/20 rounded-full text-sm font-medium hover:border-white/40 transition-colors">
                  কাজ দেখুন
                </Link>
              </div>
            </div>

            {/* Profile Card */}
            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                {/* Avatar placeholder */}
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#ff8555] flex items-center justify-center text-5xl mb-6 mx-auto">
                  👨‍🎨
                </div>
                <h2 className="text-2xl font-bold text-center mb-1">Sayeed Fahad</h2>
                <p className="text-[#ff6b35] text-center text-sm mb-6">Video Editor & Graphic Designer</p>

                <div className="grid grid-cols-3 gap-4 text-center border-t border-white/10 pt-6">
                  <div>
                    <div className="text-2xl font-bold text-[#ff6b35]">5+</div>
                    <div className="text-white/50 text-xs mt-1">বছরের অভিজ্ঞতা</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#ff6b35]">100+</div>
                    <div className="text-white/50 text-xs mt-1">প্রজেক্ট</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#ff6b35]">50+</div>
                    <div className="text-white/50 text-xs mt-1">ক্লায়েন্ট</div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-center">
                  {['YouTube', 'Instagram', 'Facebook'].map(s => (
                    <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{s}</span>
                  ))}
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ff6b35]/20 rounded-2xl blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#ff6b35]/10 rounded-full blur-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#ff6b35] text-sm tracking-widest uppercase mb-3 font-medium">দক্ষতা</p>
          <h2 className="text-4xl font-bold mb-12">আমার <span className="text-[#ff6b35]">স্কিলস</span></h2>
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#ff6b35]/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <span className="font-medium">{skill.name}</span>
                  </div>
                  <span className="text-[#ff6b35] font-bold">{skill.level}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff6b35] to-[#ff8555] rounded-full transition-all duration-1000"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#ff6b35] text-sm tracking-widest uppercase mb-3 font-medium">যাত্রা</p>
          <h2 className="text-4xl font-bold mb-12">আমার <span className="text-[#ff6b35]">গল্প</span></h2>
          <div className="relative">
            {/* Line */}
            <div className="absolute left-[39px] top-0 bottom-0 w-px bg-white/10 hidden md:block" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#ff6b35]/40 group-hover:bg-[#ff6b35]/5 transition-all flex items-center justify-center">
                    <span className="text-[#ff6b35] font-bold text-sm">{item.year}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 group-hover:border-[#ff6b35]/20 transition-colors">
                    <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#ff6b35] text-sm tracking-widest uppercase mb-3 font-medium">টুলস</p>
          <h2 className="text-4xl font-bold mb-12">যে সফটওয়্যার <span className="text-[#ff6b35]">ব্যবহার করি</span></h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Adobe Premiere Pro', 'After Effects', 'Photoshop', 'Illustrator', 'DaVinci Resolve', 'Canva', 'Figma', 'CapCut'].map(tool => (
              <div key={tool} className="px-5 py-3 bg-white/5 border border-white/10 rounded-full text-sm hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/5 transition-all cursor-default">
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">কাজ করতে <span className="text-[#ff6b35]">আগ্রহী?</span></h2>
          <p className="text-white/50 mb-8">আপনার প্রজেক্ট নিয়ে আলোচনা করতে যোগাযোগ করুন</p>
          <Link href="/contact" className="inline-block px-8 py-4 bg-[#ff6b35] rounded-full font-medium hover:bg-[#ff8555] transition-colors">
            যোগাযোগ করুন →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-white/30 text-sm">
        <p>© 2024 Sayeed Fahad. All rights reserved.</p>
      </footer>
    </div>
  );
}