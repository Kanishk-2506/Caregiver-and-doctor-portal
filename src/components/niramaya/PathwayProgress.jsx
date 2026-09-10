import React from 'react';
import { Check } from 'lucide-react';

// Mirrors data/games.ts in the patient app.
const GAME_TITLES = {
  'memory-flip': 'Memory Flow',
  'pattern-recognition': 'Pattern Recognition',
  'sequence-recall': 'Sequence Recall',
  'jigsaw-puzzle': 'Jigsaw Puzzle',
  'musical-sequence': 'Musical Sequence',
  'flow-free': 'Northeast Trails',
  'rule-switch': 'Rule Switch',
  'picture-recall': 'Picture Detection',
};
const GAME_ORDER = Object.keys(GAME_TITLES);

export default function PathwayProgress({ progress = [] }) {
  const byId = new Map(progress.map((p) => [p.game_id, p]));
  const nodes = GAME_ORDER.filter((id) => byId.has(id)).map((id) => {
    const p = byId.get(id);
    return {
      id,
      title: GAME_TITLES[id],
      level: p.level || 1,
      accuracy: p.best_accuracy || 0,
      completed: (p.level || 1) >= 3,
    };
  });

  if (nodes.length === 0) {
    return <p className="text-sm py-6 text-center" style={{ color: '#5F6F78' }}>No game sessions recorded yet.</p>;
  }

  const atMaxLevel = nodes.filter((n) => n.completed).length;
  const percentage = Math.round((atMaxLevel / nodes.length) * 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#E7E7E7" strokeWidth="7" />
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#3E8E7E" strokeWidth="7" strokeLinecap="round" strokeDasharray={dashArray} className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{percentage}%</span>
            <span className="text-[10px]" style={{ color: '#5F6F78' }}>at max level</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{
              background: node.completed ? '#3E8E7E' : '#FFFFFF',
              border: node.completed ? '1px solid #3E8E7E' : '1px solid #E7E7E7',
            }}>
              {node.completed
                ? <Check className="w-4 h-4 text-white" />
                : <span className="text-xs font-bold" style={{ color: '#5F6F78' }}>L{node.level}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#26343B' }}>{node.title}</div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: '#E7E7E7' }}>
                <div className="h-full rounded-full" style={{ width: `${node.accuracy}%`, background: '#3E8E7E' }} />
              </div>
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#5F6F78' }}>{node.accuracy}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
