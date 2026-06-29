'use client';

import { useEffect, useState } from 'react';
import { 
  fetchDashboardStats, 
  DashboardStats 
} from '@/lib/api';
import { 
  ShieldCheck, 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  Calendar,
  AlertTriangle,
  Compass
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load dashboard data. Make sure the backend is running.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-emerald-500/25 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-4 font-mono">RETRIEVING IDENTITY CORE...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Connection Offline</h2>
        <p className="text-slate-400 text-sm max-w-md mt-2">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
          className="mt-6 px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono rounded-xl transition-all"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
            Active Digital Twin
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-1">
            Welcome back, Alex Developer
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
            Verified Profile
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Career Score */}
        <div className="glass-card p-6 rounded-2xl glow-emerald flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              AI Career Score
            </span>
            <h2 className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono">
              {stats.career_score}%
            </h2>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              SYSTEM COMPUTED
            </span>
          </div>
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* Documents */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Ingested Records
            </span>
            <h2 className="text-4xl font-extrabold text-slate-100 mt-2 font-mono">
              {stats.total_documents}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              PDF / URL / REPOS
            </span>
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Skills */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Verified Skills
            </span>
            <h2 className="text-4xl font-extrabold text-slate-100 mt-2 font-mono">
              {stats.total_skills}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              GRAPH MAPPED
            </span>
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300">
            <BrainCircuit className="h-6 w-6" />
          </div>
        </div>

        {/* Milestones */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Milestones
            </span>
            <h2 className="text-4xl font-extrabold text-slate-100 mt-2 font-mono">
              {stats.total_events}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              CHRONOLOGY EVENTS
            </span>
          </div>
          <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: AI Career Insights */}
        <div className="glass-card p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">AI Career Insights</h3>
              <p className="text-xs text-slate-400">Semantic parsing & pattern recognition</p>
            </div>
          </div>
          <ul className="space-y-4">
            {stats.insights.map((insight, idx) => (
              <li key={idx} className="flex gap-3 items-start text-sm text-slate-300">
                <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-emerald-400 shrink-0">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Missing Skills & Roadmap */}
        <div className="glass-card p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Growth & Roadmap</h3>
              <p className="text-xs text-slate-400">Skill gaps & strategic milestones</p>
            </div>
          </div>
          
          {/* Skill Gap */}
          <div className="space-y-3">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
              Suggested Skills to Acquire
            </span>
            <div className="flex flex-wrap gap-2">
              {stats.missing_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs rounded-lg text-slate-300 font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
              AI Career Roadmap
            </span>
            <div className="space-y-3">
              {stats.career_roadmap.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-center p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xs font-mono text-emerald-400 font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-8 rounded-3xl space-y-6">
        <h3 className="font-semibold text-slate-100 border-b border-slate-800/80 pb-4">
          Recent Activity Timeline
        </h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {stats.recent_activity.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== stats.recent_activity.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-[#080b11] ${
                        event.category === 'work' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' :
                        event.category === 'education' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                        event.category === 'certification' ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' :
                        'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}>
                        <Calendar className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-slate-200 font-semibold">{event.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-slate-500 font-mono">
                        {event.event_year}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
