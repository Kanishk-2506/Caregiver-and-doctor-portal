import React, { useMemo, useRef, useState } from 'react';

/**
 * Daily accuracy trend. `records` = daily_records rows
 * ({ date, avg_accuracy, games_completed }), oldest first.
 */
export default function TrendChart({ records = [] }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const data = useMemo(
    () =>
      records.map((r) => ({
        label: new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        accuracy: r.avg_accuracy ?? 0,
        games: r.games_completed ?? 0,
      })),
    [records],
  );

  const width = 560;
  const height = 260;
  const pad = { top: 30, right: 25, bottom: 38, left: 42 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm" style={{ color: '#5F6F78' }}>
        Not enough history yet — complete a few more daily sets.
      </div>
    );
  }

  const getX = (i) => pad.left + (i * cw) / (data.length - 1);
  const getY = (val) => pad.top + ch - (val / 100) * ch;

  const accPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.accuracy)}`).join(' ');
  const accArea = `${accPath} L ${getX(data.length - 1)} ${pad.top + ch} L ${getX(0)} ${pad.top + ch} Z`;

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let min = Infinity;
    data.forEach((_, i) => {
      const d = Math.abs(x - getX(i));
      if (d < min) { min = d; nearest = i; }
    });
    setHovered(nearest);
  };

  return (
    <div style={{ width: '100%', overflow: 'visible' }}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: 'visible' }} onMouseMove={handleMove} onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E8E7E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3E8E7E" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="#FFFFFF" rx="8" />

        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.left} y1={getY(v)} x2={width - pad.right} y2={getY(v)} stroke="#E7E7E7" strokeWidth="1" />
            <text x={pad.left - 8} y={getY(v) + 3} fill="#5F6F78" fontSize="9" textAnchor="end">{v}</text>
          </g>
        ))}

        {data.map((d, i) => (
          <text key={i} x={getX(i)} y={height - 12} fill="#5F6F78" fontSize="9" textAnchor="middle">{d.label}</text>
        ))}

        <path d={accArea} fill="url(#accGrad)" />
        <path d={accPath} fill="none" stroke="#3E8E7E" strokeWidth="2.5" />

        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.accuracy)} r={hovered === i ? 5 : 3.5} fill="#3E8E7E" stroke="#FFFFFF" strokeWidth="2" className="transition-all" />
        ))}

        {hovered !== null && (
          <g>
            <line x1={getX(hovered)} y1={pad.top} x2={getX(hovered)} y2={pad.top + ch} stroke="rgba(62,142,126,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x={getX(hovered) - 58} y={pad.top - 4} width="116" height="40" rx="6" fill="#FFFFFF" stroke="#E7E7E7" strokeWidth="1" />
            <text x={getX(hovered)} y={pad.top + 10} fill="#3E8E7E" fontSize="9" textAnchor="middle" fontWeight="600">{data[hovered].label}</text>
            <text x={getX(hovered)} y={pad.top + 24} fill="#5F6F78" fontSize="8" textAnchor="middle">{data[hovered].accuracy}% · {data[hovered].games} games</text>
          </g>
        )}
      </svg>

      <div className="flex items-center gap-4 mt-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#3E8E7E' }} />
          <span className="text-xs" style={{ color: '#5F6F78' }}>Daily average accuracy (%)</span>
        </div>
      </div>
    </div>
  );
}
