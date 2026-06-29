'use client';

import Link from 'next/link';
import { 
  Cpu, 
  ArrowRight, 
  Layers, 
  BrainCircuit, 
  Network, 
  CalendarRange, 
  BotMessageSquare,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: "AI Ingestion Worker",
      desc: "Converts messy PDFs, resumes, and certificates into clean Markdown using LlamaParse and local OCR.",
      icon: Layers,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Intelligent Categorization",
      desc: "Extracts skills, categories, levels, and career milestones using structured LLM outputs.",
      icon: BrainCircuit,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Neo4j Knowledge Graph",
      desc: "Draws semantic links between documents, technologies, and achievements to map your professional web.",
      icon: Network,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Journey Timeline",
      desc: "Chronologically compiles milestones with dates, categories, and direct links to the original verified sources.",
      icon: CalendarRange,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Smart Retrieval RAG",
      desc: "Ask natural language queries like 'Which projects did I build with React?' and get cited answers instantly.",
      icon: BotMessageSquare,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden text-slate-100 bg-[#080b11]">
      
      {/* Background Decorative Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-6xl w-full mx-auto px-6 py-16 md:py-24 space-y-20 z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse-glow">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
              National Hackathon Candidate
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
            Aegis AI Digital <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Identity System
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            The ultimate GraphRAG-powered career twin. Ingest resumes, certificates, and codebases. Turn raw folders into a searchable, connected semantic identity.
          </p>

          {/* Call to Action */}
          <div className="pt-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              LAUNCH IDENTITY APP
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-mono uppercase">
              System Capabilities
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
              Five autonomous agents working in synchronization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="glass-card p-6 rounded-3xl space-y-4 hover:translate-y-[-4px] transition-all duration-300">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-200">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack Info */}
        <div className="glass-card p-8 rounded-3xl text-center border border-slate-800/80 bg-slate-950/25 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Powered By Production Architecture
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-500">
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">Next.js 16</span>
            <span>•</span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">FastAPI</span>
            <span>•</span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">LangGraph</span>
            <span>•</span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">Qdrant DB</span>
            <span>•</span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">Neo4j Graph</span>
            <span>•</span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">LlamaParse</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#06090f] py-6 z-10">
        <div className="max-w-6xl w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>AEGIS ID // HACKATHON PROTOCODE</span>
          </div>
          <div>
            <span>© 2026 // ALL SYSTEM PROTOCOLS VERIFIED</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
