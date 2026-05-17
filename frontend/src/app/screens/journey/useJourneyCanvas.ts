import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import type { Goal } from "@/lib/types";
import {
  INCOME_NODE_POS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_SPEED,
  slotToPos,
} from "./constants";

type Position = { x: number; y: number };

export function useJourneyCanvas(sortedGoals: Goal[]) {
  // Logical "home" slot per goal. Decoupled from current rendered position so dragging
  // a node off-grid doesn't break slot accounting.
  const slotByGoalId = useRef<Record<string, number>>({});

  // Lazy init: assign slots and home positions for every goal on first render.
  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    const init: Record<string, Position> = {};
    sortedGoals.forEach((g, i) => {
      slotByGoalId.current[g.id] = i;
      init[g.id] = slotToPos(i);
    });
    return init;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Stable — changes only when the SET of goal IDs changes, not sort order.
  const goalIdKey = sortedGoals.map((g) => g.id).sort().join(",");

  // Reconcile slots + positions when the set of goals changes (add/remove).
  // useLayoutEffect runs before paint so no flash.
  useLayoutEffect(() => {
    const liveIds = new Set(sortedGoals.map((g) => g.id));

    // Drop slot entries for deleted goals.
    for (const id of Object.keys(slotByGoalId.current)) {
      if (!liveIds.has(id)) delete slotByGoalId.current[id];
    }

    setPositions((prev) => {
      const next: Record<string, Position> = {};
      let changed = false;

      // Keep positions for live goals + the income node.
      for (const [id, pos] of Object.entries(prev)) {
        if (liveIds.has(id) || id === "income") next[id] = pos;
        else changed = true;
      }

      // Assign new goals to the lowest free slot.
      const taken = new Set(Object.values(slotByGoalId.current));
      let probe = 0;
      for (const g of sortedGoals) {
        if (slotByGoalId.current[g.id] !== undefined) continue;
        while (taken.has(probe)) probe++;
        slotByGoalId.current[g.id] = probe;
        taken.add(probe);
        next[g.id] = slotToPos(probe);
        changed = true;
        probe++;
      }

      return changed ? next : prev;
    });
    // goalIdKey is derived from sortedGoals — including sortedGoals would re-fire on sort change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalIdKey]);

  const getNodePos = useCallback(
    (id: string): Position => {
      if (positions[id]) return positions[id];
      if (id === "income") return INCOME_NODE_POS;
      const slot = slotByGoalId.current[id];
      return slot !== undefined ? slotToPos(slot) : slotToPos(0);
    },
    [positions],
  );

  const incomePos = positions["income"] ?? INCOME_NODE_POS;

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
      const nodePos = getNodePos(nodeId);
      if (rect) {
        setDragOffset({
          x: (pos.x - rect.left) / zoom - nodePos.x - panOffset.x,
          y: (pos.y - rect.top) / zoom - nodePos.y - panOffset.y,
        });
      }
    },
    [getNodePos, zoom, panOffset],
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

  // Native wheel listener — React's synthetic onWheel attaches passive by default,
  // which makes preventDefault a no-op (page would scroll while zooming).
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(ZOOM_MIN, prevZoom - e.deltaY * ZOOM_SPEED), ZOOM_MAX);
        setPanOffset((prevPan) => ({
          x: prevPan.x - (px / prevZoom - px / newZoom),
          y: prevPan.y - (py / prevZoom - py / newZoom),
        }));
        return newZoom;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Pan starts only when the bare canvas div (or its transparent SVG bg) is the target.
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.tagName === "svg" || target.tagName === "rect") {
      const pos = getPointerPosition(e);
      setIsPanning(true);
      setPanStart({ x: pos.x, y: pos.y });
    }
  }, []);

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
    handlePointerUp,
    handleCanvasPointerDown,
  };
}
