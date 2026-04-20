import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Node {
  id: string;
  x: number;
  y: number;
  emoji: string;
  label: string;
  amount: number;
  progress: number;
  status: 'complete' | 'in-progress' | 'not-started';
  connections: string[];
}

export default function Journey() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', x: 200, y: 150, emoji: '💼', label: 'Income', amount: 85000, progress: 100, status: 'complete', connections: ['2', '3'] },
    { id: '2', x: 450, y: 100, emoji: '🏍️', label: 'Dream Bike', amount: 120000, progress: 65, status: 'in-progress', connections: ['5'] },
    { id: '3', x: 450, y: 250, emoji: '🏖️', label: 'Goa Trip', amount: 50000, progress: 85, status: 'in-progress', connections: ['6'] },
    { id: '4', x: 200, y: 400, emoji: '💳', label: 'Clear Debt', amount: 45000, progress: 30, status: 'in-progress', connections: [] },
    { id: '5', x: 700, y: 100, emoji: '🏡', label: 'House Fund', amount: 500000, progress: 0, status: 'not-started', connections: [] },
    { id: '6', x: 700, y: 250, emoji: '💍', label: 'Wedding', amount: 300000, progress: 0, status: 'not-started', connections: [] },
  ]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - offset.x;
      const newY = e.clientY - rect.top - offset.y;
      setNodes(nodes.map(n => n.id === dragging ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const getStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'complete': return 'var(--lime)';
      case 'in-progress': return 'var(--amber)';
      case 'not-started': return 'var(--red)';
    }
  };

  const handleNodeClick = (node: Node) => {
    if (!dragging) {
      setSelectedNode(node);
    }
  };

  const handleComplete = (nodeId: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, status: 'complete' as const, progress: 100 } : n));
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      <div
        ref={canvasRef}
        className="flex-1 rounded-2xl relative overflow-hidden"
        style={{
          backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a18' : '#f0f4ff',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />

          {nodes.map(node =>
            node.connections.map(connId => {
              const target = nodes.find(n => n.id === connId);
              if (!target) return null;
              const locked = node.status !== 'complete';
              return (
                <line
                  key={`${node.id}-${connId}`}
                  x1={node.x + 80}
                  y1={node.y + 60}
                  x2={target.x + 80}
                  y2={target.y + 60}
                  stroke={locked ? 'var(--secondary)' : 'var(--lime)'}
                  strokeWidth="3"
                  strokeDasharray={locked ? '8,4' : '0'}
                  opacity={locked ? 0.5 : 0.8}
                />
              );
            })
          )}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute cursor-pointer transition-all hover:scale-105"
            style={{
              left: node.x,
              top: node.y,
              width: 160,
              animation: `float ${3 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
            onMouseDown={(e) => handleMouseDown(e, node)}
            onClick={() => handleNodeClick(node)}
          >
            <div
              className="p-4 rounded-2xl glass-card"
              style={{
                backgroundColor: getStatusColor(node.status) + '20',
                border: `2px solid ${getStatusColor(node.status)}`,
                boxShadow: document.documentElement.classList.contains('dark') && node.status !== 'not-started'
                  ? `0 0 20px ${getStatusColor(node.status)}60`
                  : `0 4px 12px ${getStatusColor(node.status)}30`,
              }}
            >
              <div className="text-3xl mb-2">{node.emoji}</div>
              <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-body)' }}>{node.label}</div>
              <div className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                ₹{(node.amount / 1000).toFixed(0)}K
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{node.progress}% complete</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${node.progress}%`, backgroundColor: getStatusColor(node.status) }}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          className="absolute top-4 right-4 w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C' }}
        >
          <Plus size={20} />
        </button>
      </div>

      {selectedNode && (
        <div
          className="w-80 rounded-2xl p-6 space-y-4 glass-card"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Goal Details</h3>
            <button onClick={() => setSelectedNode(null)} className="w-8 h-8 rounded-lg hover:bg-[--border] flex items-center justify-center">
              <X size={18} />
            </button>
          </div>

          <div className="text-center py-6">
            <div className="text-6xl mb-3">{selectedNode.emoji}</div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{selectedNode.label}</h2>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: getStatusColor(selectedNode.status) }}>
              ₹{selectedNode.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="font-bold">{selectedNode.progress}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${selectedNode.progress}%`, backgroundColor: getStatusColor(selectedNode.status) }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl glass">
              <div className="text-xs mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Saved</div>
              <div className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>₹{(selectedNode.amount * selectedNode.progress / 100).toFixed(0)}</div>
            </div>
            <div className="p-3 rounded-xl glass">
              <div className="text-xs mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Remaining</div>
              <div className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>₹{(selectedNode.amount * (100 - selectedNode.progress) / 100).toFixed(0)}</div>
            </div>
          </div>

          {selectedNode.status !== 'complete' && (
            <button
              onClick={() => handleComplete(selectedNode.id)}
              className="w-full py-3 rounded-lg font-bold transition-transform hover:scale-105"
              style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
