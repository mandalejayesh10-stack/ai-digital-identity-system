'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UploadCloud, 
  CalendarRange, 
  Network, 
  BotMessageSquare,
  Cpu,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check local storage on mount
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Center', href: '/upload', icon: UploadCloud },
    { name: 'Career Journey', href: '/timeline', icon: CalendarRange },
    { name: 'Skill Graph', href: '/graph', icon: Network },
    { name: 'AI Career Chat', href: '/chat', icon: BotMessageSquare },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col h-screen sticky top-0 transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
          <Cpu className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-none tracking-wider text-slate-100 uppercase">
            Aegis ID
          </h1>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
            AI Identity
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/5 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/50 hover:bg-slate-850 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Toggle</span>
        </button>

        {/* System Status */}
        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-mono">SYSTEM READY</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">V1.0.0 // LOCAL ENGINE</p>
        </div>
      </div>
    </aside>
  );
}
