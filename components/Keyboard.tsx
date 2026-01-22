
import React from 'react';
import { KEYBOARD_ROWS } from '../constants';
import { Status } from '../types';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStatuses: Record<string, Status>;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, letterStatuses }) => {
  const getKeyStatus = (key: string) => {
    return letterStatuses[key] || 'empty';
  };

  const getColorClass = (key: string) => {
    const status = getKeyStatus(key);
    switch (status) {
      case 'correct': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'present': return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'absent': return 'bg-slate-900 text-slate-500 opacity-60';
      default: return 'bg-slate-700 text-slate-100 hover:bg-slate-600';
    }
  };

  return (
    <div className="w-full max-w-2xl px-2 mt-8">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center mb-2 gap-1.5">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`
                keyboard-key h-14 rounded-md font-bold uppercase select-none
                flex items-center justify-center text-sm md:text-base
                ${key === 'ENTER' || key === 'DEL' ? 'px-4 flex-grow' : 'w-10 md:w-12'}
                ${getColorClass(key)}
              `}
            >
              {key === 'DEL' ? <i className="fa-solid fa-backspace"></i> : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
