import React, { useState, useRef } from 'react';

const data = [
  { week: 'W1', speed: 45, accuracy: 72 },
  { week: 'W2', speed: 42, accuracy: 75 },
  { week: 'W3', speed: 38, accuracy: 78 },
  { week: 'W4', speed: 35, accuracy: 82 },
  { week: 'W5', speed: 33, accuracy: 85 },
  { week: 'W6', speed: 32, accuracy: 88 },
];

export default function TrendChart() {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const width = 560;
  const height = 280;
  const pad = { top: 35, right: 25, bottom: 40, left: 45 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const getX = (i) => pad.left + (i * cw / (data.length - 1));
  const getY = (val) => pad.top + ch - (val / 100) * ch;

  const speedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.speed)}`).join(' ');
  const accPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.accuracy)}`).join(' ');
  const speedArea = `${speedPath} L ${getX(data.length - 1)} ${pad.top + ch} L ${getX(0)} ${pad.top + ch} Z`;
  const accArea = `${accPath} L ${getX(data.length - 1)} ${pad.top + ch} L ${getX(0)} ${pad.top + ch} Z`;

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0, min = Infinity;
    data.forEach((_, i) => {
      const d = Math.abs(x - getX(i));
      if (d < min) { min = d; nearest = i; }
    });
    setHovered(nearest);
  };

  return (
    <div style={{ width: '100%', overflow: 'visible' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ overflow: 'visible' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E8E7E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3E8E7E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5F8FA3" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#5F8FA3" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="#FFFFFF" rx="8" />

        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={pad.left} y1={getY(v)} x2={width - pad.right} y2={getY(v)} stroke="#D6E0E5" strokeWidth="1" />
            <text x={pad.left - 8} y={getY(v) + 3} fill="#5F6F78" fontSize="9" textAnchor="end">{v}</text>
          </g>
        ))}

        {data.map((d, i) => (
          <text key={i} x={getX(i)} y={height - 12} fill="#5F6F78" fontSize="9" textAnchor="middle">{d.week}</text>
        ))}

        <path d={accArea} fill="url(#accGrad)" />
        <path d={speedArea} fill="url(#speedGrad)" />

        <path d={accPath} fill="none" stroke="#5F8FA3" strokeWidth="2" strokeOpacity="0.7" />
        <path d={speedPath} fill="none" stroke="#3E8E7E" strokeWidth="2.5" />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(d.speed)} r={hovered === i ? 5 : 3.5} fill="#3E8E7E" stroke="#FFFFFF" strokeWidth="2" className="transition-all" />
            <circle cx={getX(i)} cy={getY(d.accuracy)} r={hovered === i ? 4 : 3} fill="#5F8FA3" stroke="#FFFFFF" strokeWidth="2" className="transition-all" />
          </g>
        ))}

        {hovered !== null && (
          <g>
            <line x1={getX(hovered)} y1={pad.top} x2={getX(hovered)} y2={pad.top + ch} stroke="rgba(62,142,126,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x={getX(hovered) - 55} y={pad.top - 2} width="110" height="38" rx="6" fill="#FFFFFF" stroke="#D6E0E5" strokeWidth="1" />
            <text x={getX(hovered)} y={pad.top + 12} fill="#3E8E7E" fontSize="9" textAnchor="middle" fontWeight="600">{data[hovered].week}</text>
            <text x={getX(hovered)} y={pad.top + 24} fill="#5F6F78" fontSize="8" textAnchor="middle">{data[hovered].speed}s · {data[hovered].accuracy}%</text>
          </g>
        )}
      </svg>

      <div className="flex items-center gap-4 mt-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#3E8E7E' }} />
          <span className="text-xs" style={{ color: '#5F6F78' }}>Response Speed (sec)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ background: '#5F8FA3' }} />
          <span className="text-xs" style={{ color: '#5F6F78' }}>Accuracy (%)</span>
        </div>
      </div>
    </div>
  );
}