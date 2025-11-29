import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OPTIONS = [
  'Research',
  'Borrow/Return',
  'Individual Study',
  'Group Study',
  'Computer / Internet Use',
  'Printing / Photocopy',
  'Consultation',
  'Others',
];

const PurposeSelector = ({ onConfirm, onCancel }) => {
  const [purpose, setPurpose] = useState(OPTIONS[0]);
  const [otherText, setOtherText] = useState('');

  const handleConfirm = () => {
    onConfirm(purpose === 'Others' ? (otherText.trim() || 'Others') : purpose);
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mt-6 p-4 bg-gradient-to-br from-white/5 to-white/3 rounded-xl border border-white/10 backdrop-blur-sm"
    >
      <div className="font-semibold text-cream mb-3 text-lg">Purpose of Visit</div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o}
            onClick={() => setPurpose(o)}
            className={`w-full flex items-center justify-center text-center text-xs sm:text-sm font-medium rounded-md transition-all duration-150 break-words whitespace-normal leading-tight ${
              purpose === o
                ? 'bg-amber-500/10 text-amber-100 border border-amber-300 ring-2 ring-amber-300/40 shadow-sm'
                : 'bg-white/6 text-cream/90 hover:bg-white/10'
            } py-2 px-3 min-h-[48px]`}
          >
            <span className="px-1">{o}</span>
          </button>
        ))}
      </div>

      {purpose === 'Others' && (
        <input
          className="w-full mt-3 p-2 rounded-md bg-white/10 text-cream placeholder-cream/60 border border-white/8 focus:ring-2 focus:ring-amber-300 outline-none"
          placeholder="Describe purpose"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
        />
      )}

      <div className="mt-4 flex gap-3">
        <button
          className="flex-1 px-3 py-2 rounded-md bg-amber-400 text-emerald-900 font-semibold shadow-md hover:brightness-95 text-sm"
          onClick={handleConfirm}
        >
          Confirm
        </button>
        <button className="px-3 py-2 rounded-md bg-white/6 text-cream hover:bg-white/10 text-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

export default PurposeSelector;
