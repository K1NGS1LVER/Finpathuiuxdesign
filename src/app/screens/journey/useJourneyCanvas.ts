import { useState, useRef, useCallback } from "react";
import type { Goal } from "../../../lib/types";

export function useJourneyCanvas(sortedGoals: Goal[]) {
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getNodePos = useCallback(
    (id: string, index: number) => {
      if (positions[id]) return positions[id];
      if (id === "income") return { x: 80, y: 200 };
      return {
        x: 350 + (index % 2) * 250,
        y: 80 + Math.floor(index / 2) * 200,
      };
    },
    [positions],
  );

  const incomePos = getNodePos("income", 0);

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(nodeId);
      const rect = canvasRef.current?.getBoundingClientRect();
      const pos = getPointerPosition(e);
      const nodePos =
        nodeId === "income"
          ? incomePos
          : getNodePos(
              nodeId,
              sortedGoals.findIndex((g) => g.id === nodeId),
            );
      if (rect) {
        setDragOffset({
          x: (pos.x - rect.left) / zoom - nodePos.x - panOffset.x,
          y: (pos.y - rect.top) / zoom - nodePos.y - panOffset.y,
        });
      }
    },
    [sortedGoals, incomePos, getNodePos, zoom, panOffset],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const pos = getPointerPosition(e);
      if (dragging && canvasRef.current) {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const newX = (pos.x - rect.left) / zoom - dragOffset.x - panOffset.x;
        const newY = (pos.y - rect.top) / zoom - dragOffset.y - panOffset.y;
        setPositions((prev) => ({ ...prev, [dragging]: { x: newX, y: newY } }));
      } else if (isPanning) {
        e.preventDefault();
        const dx = pos.x - panStart.x;
        const dy = pos.y - panStart.y;
        setPanOffset((prev) => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));
        setPanStart({ x: pos.x, y: pos.y });
      }
    },
    [dragging, isPanning, zoom, dragOffset, panOffset, panStart],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const zoomSpeed = 0.001;
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        setZoom((prevZoom) => {
          const newZoom = Math.min(Math.max(0.2, prevZoom - e.deltaY * zoomSpeed), 3);

          setPanOffset((prevPan) => ({
            x: prevPan.x - (px / prevZoom - px / newZoom),
            y: prevPan.y - (py / prevZoom - py / newZoom),
          }));

          return newZoom;
        });
      }
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target === canvasRef.current || target.closest("svg.canvas-bg")) {
        const pos = getPointerPosition(e);
        setIsPanning(true);
        setPanStart({ x: pos.x, y: pos.y });
      }
    },
    [],
  );

  return {
    canvasRef,
    positions,
    dragging,
    panOffset,
    zoom,
    isPanning,
    incomePos,
    getNodePos,
    handlePointerDown,
    handlePointerMove,
    handleWheel,
    handlePointerUp,
    handleCanvasPointerDown,
  };
}