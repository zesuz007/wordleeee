
import React from 'react';
import { Status } from '../types';

interface TileProps {
  letter: string;
  status: Status;
  delay?: number;
}

const Tile: React.FC<TileProps> = ({ letter, status, delay = 0 }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'correct': return 'bg-emerald-500 border-emerald-500 text-white';
      case 'present': return 'bg-amber-500 border-amber-500 text-white';
      case 'absent': return 'bg-slate-700 border-slate-700 text-slate-400';
      case 'tbd': return 'border-slate-500 text-white scale-105';
      case 'empty': return 'border-slate-800 text-transparent';
      default: return 'border-slate-800';
    }
  };

  return (
    <div 
      style={{ transitionDelay: `${delay}ms` }}
      className={`
        w-14 h-14 md:w-16 md:h-16 flex items-center justify-center 
        text-2xl md:text-3xl font-bold border-2 rounded-sm
        transition-all duration-500
        ${getStatusClasses()}
        ${status !== 'empty' && status !== 'tbd' ? 'tile-flip' : ''}
      `}
    >
      <div className={status !== 'empty' && status !== 'tbd' ? '[transform:rotateX(180deg)]' : ''}>
        {letter}
      </div>
    </div>
  );
};

export default Tile;
