'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchSkillGraph, GraphData } from '@/lib/api';
import { Network, Info, Zap, HelpCircle } from 'lucide-react';

interface SimulatedNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimulatedEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [nodes, setNodes] = useState<SimulatedNode[]>([]);
  const [edges, setEdges] = useState<SimulatedEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<SimulatedNode | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<SVGSVGElement | null>(null);
  const dragNodeRef = useRef<string | null>(null);

  useEffect(() => {
    fetchSkillGraph()
      .then((data) => {
        setGraphData(data);
        
        // Initialize positions in a circle layout
        const width = 600;
        const height = 400;
        const simNodes: SimulatedNode[] = data.nodes.map((node, idx) => {
          const angle = (idx / data.nodes.length) * 2 * Math.PI;
          const radius = 120 + Math.random() * 40;
          return {
            ...node,
            x: width / 2 + radius * Math.cos(angle),
            y: height / 2 + radius * Math.sin(angle),
            vx: 0,
            vy: 0
          };
        });

        setNodes(simNodes);
        setEdges(data.edges);
        if (simNodes.length > 0) {
          setSelectedNode(simNodes[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Simple Force Directed Simulation Loop
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationFrameId: number;
    const width = 600;
    const height = 400;

    const tick = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));
        
        // 1. Repulsion (Charge) force between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            if (dist < 180) {
              const force = (180 - dist) * 0.08;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              
              // Push apart
              if (n1.id !== dragNodeRef.current) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2.id !== dragNodeRef.current) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 2. Attraction (Link/Spring) force along edges
        edges.forEach((edge) => {
          const sourceNode = nextNodes.find((n) => n.id === edge.source);
          const targetNode = nextNodes.find((n) => n.id === edge.target);
          if (sourceNode && targetNode) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Ideal spring length is 100px
            const desiredDist = 100;
            const k = 0.02; // Spring constant
            const force = (dist - desiredDist) * k;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (sourceNode.id !== dragNodeRef.current) {
              sourceNode.vx += fx;
              sourceNode.vy += fy;
            }
            if (targetNode.id !== dragNodeRef.current) {
              targetNode.vx -= fx;
              targetNode.vy -= fy;
            }
          }
        });

        // 3. Gravity/Center force
        const centerX = width / 2;
        const centerY = height / 2;
        nextNodes.forEach((node) => {
          if (node.id === dragNodeRef.current) return;
          
          node.vx += (centerX - node.x) * 0.005;
          node.vy += (centerY - node.y) * 0.005;

          // Apply velocity and damping
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.85; // Damping
          node.vy *= 0.85;
          
          // Boundaries
          node.x = Math.max(20, Math.min(width - 20, node.x));
          node.y = Math.max(20, Math.min(height - 20, node.y));
        });

        return nextNodes;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [edges, nodes.length]);

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    dragNodeRef.current = nodeId;
    const node = nodes.find(n => n.id === nodeId);
    if (node) setSelectedNode(node);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragNodeRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Convert client coordinates to SVG coordinates
    const svgX = ((e.clientX - rect.left) / rect.width) * 600;
    const svgY = ((e.clientY - rect.top) / rect.height) * 400;

    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === dragNodeRef.current ? { ...n, x: svgX, y: svgY, vx: 0, vy: 0 } : n
      )
    );
  };

  const handleMouseUpOrLeave = () => {
    dragNodeRef.current = null;
  };

  const getNodeColor = (label: string, isSelected: boolean) => {
    if (label === 'Skill') {
      return isSelected ? 'fill-purple-400 stroke-purple-300' : 'fill-purple-600 stroke-purple-500/40';
    } else if (label === 'Document') {
      return isSelected ? 'fill-blue-400 stroke-blue-300' : 'fill-blue-600 stroke-blue-500/40';
    } else {
      return isSelected ? 'fill-emerald-400 stroke-emerald-300' : 'fill-emerald-600 stroke-emerald-500/40';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500/25 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-4 font-mono">RENDERING RELATIONSHIP ENGINE...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1 flex flex-col">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
          Relationship Engine
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-1">
          Skill Knowledge Graph
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          An interactive, node-link graph mapping connections between your documents, skills, and career achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Interactive SVG Graph Area */}
        <div className="glass-card p-4 rounded-3xl lg:col-span-2 relative overflow-hidden flex items-center justify-center min-h-[450px] bg-slate-950/20">
          {/* Legend */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
              <span>DOCUMENTS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600"></span>
              <span>SKILLS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
              <span>MILESTONES</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <svg
            ref={containerRef}
            viewBox="0 0 600 400"
            className="w-full h-full max-h-[60vh] select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {/* Draw Relationship Lines (Edges) */}
            {edges.map((edge, idx) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <g key={edge.id || idx}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    className="stroke-slate-800/80 stroke-[1.5]"
                  />
                  {/* Label in middle of link */}
                  {edge.type && (
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 4}
                      className="fill-slate-600 text-[6px] font-mono text-center"
                      textAnchor="middle"
                    >
                      {edge.type}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const circleColor = getNodeColor(node.label, isSelected);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  className="cursor-grab active:cursor-grabbing group"
                >
                  {/* Outer Glow Ring on Selected */}
                  {isSelected && (
                    <circle
                      r="16"
                      className="fill-none stroke-emerald-400/40 stroke-2 animate-pulse-glow"
                    />
                  )}
                  {/* Core Node Circle */}
                  <circle
                    r="10"
                    className={`${circleColor} stroke-2 transition-all`}
                  />
                  {/* Node Label Text */}
                  <text
                    y="22"
                    className={`text-[8px] font-semibold font-mono text-center transition-all ${
                      isSelected ? 'fill-slate-100' : 'fill-slate-400 group-hover:fill-slate-200'
                    }`}
                    textAnchor="middle"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Properties Details Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {selectedNode ? (
            <div className="glass-card p-6 rounded-3xl space-y-6 flex-1 bg-gradient-to-b from-[#0e1320] to-[#0c101b]">
              {/* Node Title & Label */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${
                  selectedNode.label === 'Skill' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                  selectedNode.label === 'Document' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedNode.label}
                </span>
                <h3 className="text-lg font-bold text-slate-100 leading-tight">
                  {selectedNode.name}
                </h3>
              </div>

              {/* Properties list */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Metadata Attributes
                </span>

                <div className="space-y-3">
                  {Object.entries(selectedNode.properties).map(([key, val]) => (
                    <div 
                      key={key} 
                      className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4"
                    >
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{key}</span>
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[180px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action/Helper Tips */}
              <div className="p-4 bg-slate-900/20 border border-slate-800/60 rounded-2xl flex items-start gap-3 mt-4">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Drag nodes to adjust layout dynamically. Relationships are parsed by our **KG Builder Agent** in Neo4j.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl text-center py-12 text-slate-500 font-mono text-xs flex-1 flex items-center justify-center">
              SELECT A NODE TO VIEW METADATA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
