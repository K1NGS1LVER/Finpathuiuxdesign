const fs = require('fs');
let c = fs.readFileSync('src/app/screens/Journey.tsx', 'utf8');

// 1. Add zoom state
c = c.replace(
  'const [panStart, setPanStart] = useState({ x: 0, y: 0 });',
  'const [panStart, setPanStart] = useState({ x: 0, y: 0 });\n  const [zoom, setZoom] = useState(1);'
);

// 2. Add handleWheel
const handleWheelStr = `
  const handleWheel = (e) => {
    // Zoom in/out with the wheel
    const zoomSpeed = 0.001;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      
      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(0.2, prevZoom - e.deltaY * zoomSpeed), 3);
        
        // Zoom around pointer
        setPanOffset((prevPan) => ({
          x: prevPan.x - (px / prevZoom - px / newZoom),
          y: prevPan.y - (py / prevZoom - py / newZoom),
        }));
        
        return newZoom;
      });
    }
  };
`;
c = c.replace('const handlePointerUp = () => {', handleWheelStr + '\n  const handlePointerUp = () => {');

// 3. Update pointer down
c = c.replace(
  '        x: pos.x - rect.left - nodePos.x - panOffset.x,\n        y: pos.y - rect.top - nodePos.y - panOffset.y,',
  '        x: (pos.x - rect.left) / zoom - nodePos.x - panOffset.x,\n        y: (pos.y - rect.top) / zoom - nodePos.y - panOffset.y,'
);

// 4. Update pointer move
c = c.replace(
  '      const newX = pos.x - rect.left - dragOffset.x - panOffset.x;\n      const newY = pos.y - rect.top - dragOffset.y - panOffset.y;',
  '      const newX = (pos.x - rect.left) / zoom - dragOffset.x - panOffset.x;\n      const newY = (pos.y - rect.top) / zoom - dragOffset.y - panOffset.y;'
);
c = c.replace(
  '      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));',
  '      setPanOffset((prev) => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));'
);

// 5. Update canvas div to include onWheel
c = c.replace(
  '        onMouseDown={handleCanvasPointerDown}',
  '        onWheel={handleWheel}\n        onMouseDown={handleCanvasPointerDown}'
);

// 6. Update SVG background pattern
c = c.replace(
  '<pattern\n              id="dots"\n              x="0"\n              y="0"\n              width="20"\n              height="20"\n              patternUnits="userSpaceOnUse"\n            >\n              <circle cx="1" cy="1" r="1" fill="var(--border)" />\n            </pattern>',
  '<pattern\n              id="dots"\n              x={panOffset.x * zoom}\n              y={panOffset.y * zoom}\n              width={20 * zoom}\n              height={20 * zoom}\n              patternUnits="userSpaceOnUse"\n            >\n              <circle cx={1 * zoom} cy={1 * zoom} r={1 * zoom} fill="var(--border)" />\n            </pattern>'
);

// 7. Update SVG lines to be in a <g>
const svgLineTarget = '{/* Connection lines from income to each goal */}';
c = c.replace(svgLineTarget, '<g transform={`scale(${zoom})`}>\n          ' + svgLineTarget);
c = c.replace('</svg>', '  </g>\n        </svg>');

// 8. Wrap nodes in a scaling div
const incomeNodeTarget = '{/* Income Root Node */}';
c = c.replace(incomeNodeTarget, '<div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>\n          {/* Income Root Node */}');
// Also we need to make sure the inner nodes accept pointer events, since the wrapper has pointer-events: none (to not block the canvas)
c = c.replace(
  'className="absolute cursor-pointer hover:scale-105"',
  'className="absolute cursor-pointer hover:scale-105 pointer-events-auto"'
);
// replace multiple occurrences
c = c.replace(
  /className="absolute cursor-pointer hover:scale-105"/g,
  'className="absolute cursor-pointer hover:scale-105 pointer-events-auto"'
);

// Close the wrapper div before empty state
const emptyStateTarget = '{/* Empty state */}';
c = c.replace(emptyStateTarget, '</div>\n\n        {/* Empty state */}');

fs.writeFileSync('src/app/screens/Journey.tsx', c);
console.log("Patched Journey.tsx!");
