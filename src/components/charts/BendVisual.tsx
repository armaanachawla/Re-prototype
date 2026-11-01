/** Simple side-view diagram of a bent knee. 0° = straight leg. */
export function BendVisual({ angle, previous, className = "" }: { angle: number; previous?: number | null; className?: string }) {
  const knee = { x: 120, y: 60 };
  const thigh = 100;
  const shin = 100;
  const rad = (d: number) => (d * Math.PI) / 180;
  const end = (deg: number) => ({ x: knee.x + shin * Math.cos(rad(deg)), y: knee.y + shin * Math.sin(rad(deg)) });
  const e = end(angle);
  const p = previous !== null && previous !== undefined ? end(previous) : null;
  const r = 34;
  const arcEnd = { x: knee.x + r * Math.cos(rad(angle)), y: knee.y + r * Math.sin(rad(angle)) };
  const large = angle > 180 ? 1 : 0;
  const mid = rad(angle / 2);
  return (
    <svg viewBox="0 0 260 180" className={className} role="img" aria-label={`Diagram of a knee bent to ${angle} degrees${p ? `, previously ${previous} degrees` : ""}`}>
      {/* straight-leg reference */}
      <line x1={knee.x} y1={knee.y} x2={knee.x + shin} y2={knee.y} stroke="#d3c7b6" strokeWidth="2" strokeDasharray="4 4" />
      <text x={knee.x + shin - 2} y={knee.y - 8} textAnchor="end" fontSize="11" fill="#776c61">0° straight</text>
      {/* previous */}
      {p ? <line x1={knee.x} y1={knee.y} x2={p.x} y2={p.y} stroke="#c9bdac" strokeWidth="10" strokeLinecap="round" opacity="0.6" /> : null}
      {/* thigh */}
      <line x1={knee.x - thigh} y1={knee.y} x2={knee.x} y2={knee.y} stroke="#4f6b53" strokeWidth="16" strokeLinecap="round" />
      {/* shin */}
      <line x1={knee.x} y1={knee.y} x2={e.x} y2={e.y} stroke="#4f6b53" strokeWidth="13" strokeLinecap="round" className="transition-all duration-700" />
      {/* angle arc */}
      <path d={`M${knee.x + r},${knee.y} A${r},${r} 0 ${large} 1 ${arcEnd.x},${arcEnd.y}`} fill="none" stroke="#9a4e31" strokeWidth="2" />
      <circle cx={knee.x} cy={knee.y} r="9" fill="#faf6ef" stroke="#4f6b53" strokeWidth="3" />
      <text x={knee.x + (r + 22) * Math.cos(mid)} y={knee.y + (r + 22) * Math.sin(mid) + 4} textAnchor="middle" fontSize="15" fontWeight="600" fill="#9a4e31">
        {angle}°
      </text>
      <text x={knee.x - thigh} y={knee.y - 16} fontSize="11" fill="#776c61">thigh</text>
      <text x={e.x + (e.x < knee.x ? -6 : 6)} y={e.y + 4} textAnchor={e.x < knee.x ? "end" : "start"} fontSize="11" fill="#776c61">shin</text>
    </svg>
  );
}
