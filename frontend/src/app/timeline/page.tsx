'use client';

import { useEffect, useState } from 'react';
import { 
  fetchTimeline, 
  fetchDocuments, 
  TimelineEvent, 
  Document 
} from '@/lib/api';
import { 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Sparkles, 
  Link as LinkIcon,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTimeline(), fetchDocuments()])
      .then(([timelineData, docData]) => {
        setEvents(timelineData);
        setDocuments(docData);
        if (timelineData.length > 0) {
          handleEventClick(timelineData[0], docData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleEventClick = (event: TimelineEvent, docList = documents) => {
    setSelectedEvent(event);
    if (event.document_id) {
      const match = docList.find(d => d.id === event.document_id);
      setSelectedDoc(match || null);
    } else {
      setSelectedDoc(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return Briefcase;
      case 'education': return GraduationCap;
      case 'award': return Award;
      case 'certification': return Sparkles;
      default: return Calendar;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20';
      case 'education': return 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20';
      case 'award': return 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20';
      case 'certification': return 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20';
      default: return 'from-slate-800 to-slate-900 text-slate-400 border-slate-700/50';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500/25 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-4 font-mono">ASSEMBLING TIMELINE CHRONOLOGY...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1 flex flex-col">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
          Chronological Engine
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-1">
          AI Career Timeline
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          A temporal mapping of your career milestones, certifications, and project accomplishments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Timeline Event List */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2 overflow-y-auto max-h-[70vh]">
          <div className="relative border-l-2 border-slate-800/80 ml-4 space-y-8 py-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                NO MILESTONES MAPPED
              </div>
            ) : (
              events.map((event) => {
                const Icon = getCategoryIcon(event.category);
                const colors = getCategoryColor(event.category);
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <div 
                    key={event.id} 
                    onClick={() => handleEventClick(event)}
                    className={`relative pl-8 group cursor-pointer transition-all ${
                      isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'
                    }`}
                  >
                    {/* Event Circle Dot */}
                    <div className={`absolute -left-[17px] top-1.5 h-8 w-8 rounded-full bg-[#080b11] flex items-center justify-center border transition-all duration-300 ${
                      isSelected 
                        ? 'border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-110' 
                        : 'border-slate-800 text-slate-500 group-hover:border-slate-700'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Event Box */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-slate-900/90 to-slate-950/80 border-slate-700/80 shadow-md' 
                        : 'bg-slate-900/20 border-slate-800/60 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border bg-gradient-to-r ${colors}`}>
                            {event.category}
                          </span>
                          <h3 className={`font-semibold text-sm mt-2 transition-colors ${
                            isSelected ? 'text-emerald-400' : 'text-slate-200'
                          }`}>
                            {event.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-slate-500 font-bold bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                          {event.event_year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-end mt-3 text-[10px] font-mono text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        VIEW DETAILS <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {selectedEvent ? (
            <div className="glass-card p-6 rounded-3xl space-y-6 flex-1 bg-gradient-to-b from-[#0e1320] to-[#0c101b]">
              {/* Event Title & Date */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  Milestone Details
                </span>
                <h3 className="text-lg font-bold text-slate-100 leading-tight">
                  {selectedEvent.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedEvent.event_date || `${selectedEvent.event_year}`}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 border border-slate-800/50 p-4 rounded-xl">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Linked Document */}
              {selectedDoc ? (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Verified Source Record
                  </span>
                  
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-200 font-medium truncate max-w-[180px]">
                          {selectedDoc.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded uppercase">
                        {selectedDoc.file_type}
                      </span>
                    </div>

                    {selectedDoc.summary && (
                      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2.5">
                        {selectedDoc.summary}
                      </p>
                    )}

                    {selectedDoc.skills.length > 0 && (
                      <div className="border-t border-slate-800/60 pt-2.5 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
                          Associated Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDoc.skills.map((skill) => (
                            <span 
                              key={skill.id}
                              className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] rounded text-slate-300 font-mono"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  No verification source attached to this event.
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl text-center py-12 text-slate-500 font-mono text-xs flex-1 flex items-center justify-center">
              SELECT AN EVENT TO VIEW DETAILS
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
