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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, node: Node) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setDragging(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    const pos = getPointerPosition(e);
    if (rect) {
      setOffset({ x: pos.x - rect.left - node.x, y: pos.y - rect.top - node.y });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPointerPosition(e);
    if (dragging && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = pos.x - rect.left - offset.x - panOffset.x;
      const newY = pos.y - rect.top - offset.y - panOffset.y;
      setNodes(nodes.map(n => n.id === dragging ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      e.preventDefault();
      const dx = pos.x - panStart.x;
      const dy = pos.y - panStart.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setPanStart({ x: pos.x, y: pos.y });
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleCanvasPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement) === canvasRef.current || (e.target as HTMLElement).closest('svg')) {
      const pos = getPointerPosition(e);
      setIsPanning(true);
      setPanStart({ x: pos.x, y: pos.y });
    }
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
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4">
      <div
        ref={canvasRef}
        className="flex-1 rounded-2xl relative overflow-hidden"
        style={{
          backgroundColor: 'var(--background-solid)',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleCanvasPointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleCanvasPointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
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
                  x1={node.x + 80 + panOffset.x}
                  y1={node.y + 80 + panOffset.y}
                  x2={target.x + 80 + panOffset.x}
                  y2={target.y + 80 + panOffset.y}
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
            className="absolute cursor-pointer hover:scale-105"
            style={{
              left: node.x + panOffset.x,
              top: node.y + panOffset.y,
              width: 160,
              transition: dragging === node.id ? 'none' : 'transform 0.2s ease',
            }}
            onMouseDown={(e) => handlePointerDown(e, node)}
            onTouchStart={(e) => handlePointerDown(e, node)}
            onClick={() => handleNodeClick(node)}
          >
            <div
              className="p-4 rounded-2xl bento-card"
              style={{
                border: `2px solid ${getStatusColor(node.status)}`,
                boxShadow: `0 0 20px ${getStatusColor(node.status)}15, var(--shadow-md)`,
              }}
            >
              <div className="text-3xl mb-2">{node.emoji}</div>
              <div className="font-bold mb-1 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-body)' }}>{node.label}</div>
              <div className="text-2xl font-bold mb-2 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                ₹{(node.amount / 1000).toFixed(0)}K
              </div>
              <div className="text-xs mb-2 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>{node.progress}% complete</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${node.progress}%`, backgroundColor: getStatusColor(node.status) }}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          className="absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C' }}
        >
          <Plus size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      {selectedNode && (
        <div
          className="w-full md:w-80 rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 bento-card fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto z-30"
          style={{
            maxHeight: '50vh',
            overflowY: 'auto'
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Goal Details</h3>
            <button onClick={() => setSelectedNode(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] hover:bg-[var(--surface-hover)] transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="text-center py-6">
            <div className="text-6xl mb-3">{selectedNode.emoji}</div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{selectedNode.label}</h2>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: getStatusColor(selectedNode.status) }}>
              ₹{selectedNode.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--card-foreground)]">Progress</span>
              <span className="font-bold text-[var(--card-foreground)]">{selectedNode.progress}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${selectedNode.progress}%`, backgroundColor: getStatusColor(selectedNode.status) }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Saved</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{(selectedNode.amount * selectedNode.progress / 100).toFixed(0)}</div>
            </div>
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Remaining</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{(selectedNode.amount * (100 - selectedNode.progress) / 100).toFixed(0)}</div>
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

    </div>
  );
}
