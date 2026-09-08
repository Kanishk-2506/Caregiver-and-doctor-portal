import React, { useState } from 'react';
import { Sun, Brain, Type, Music, Moon, Check } from 'lucide-react';

const initialNodes = [
  { id: 1, title: 'Morning Recall', icon: Sun, completed: true },
  { id: 2, title: 'Memory Match', icon: Brain, completed: true },
  { id: 3, title: 'Word Puzzle', icon: Type, completed: true },
  { id: 4, title: 'Sound Therapy', icon: Music, completed: false },
  { id: 5, title: 'Evening Reflection', icon: Moon, completed: false },
];

export default function PathwayProgress() {
  const [nodes, setNodes] = useState(initialNodes);

  const toggleNode = (id) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  };

  const completedCount = nodes.filter(n => n.completed).length;
  const percentage = Math.round((completedCount / nodes.length) * 100);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#D6E0E5" strokeWidth="7" />
            <circle
              cx="65" cy="65" r={radius} fill="none" stroke="#3E8E7E" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={dashArray}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{percentage}%</span>
            <span className="text-[10px]" style={{ color: '#5F6F78' }}>Complete</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={node.id}>
              <button
                onClick={() => toggleNode(node.id)}
                className="flex flex-col items-center gap-2 group flex-shrink-0"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: node.completed ? '#3E8E7E' : '#FFFFFF',
                    border: node.completed ? '1px solid #3E8E7E' : '1px solid #D6E0E5',
                  }}
                >
                  {node.completed ? <Check className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5" style={{ color: '#5F6F78' }} />}
                </div>
                <span className="text-[10px] text-center w-14 leading-tight" style={{ color: node.completed ? '#3E8E7E' : '#5F6F78' }}>{node.title}</span>
              </button>
              {i < nodes.length - 1 && (
                <div className="flex-1 h-0.5 min-w-[16px] rounded-full transition-all" style={{ background: nodes[i + 1].completed ? '#3E8E7E' : '#D6E0E5' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}


