import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

const TimeOutResult = ({ result }) => {
  if (!result) return null;
  const inRaw = result?.session?.timeInAt || result?.timeInAt || result?.session?.timeIn || result?.timeIn || null;
  const outRaw = result?.session?.timeOutAt || result?.timeOutAt || result?.session?.timeOut || result?.timeOut || null;
  const inAt = inRaw ? new Date(inRaw) : null;
  const outAt = outRaw ? new Date(outRaw) : null;
  const validIn = inAt && !isNaN(inAt.getTime());
  const validOut = outAt && !isNaN(outAt.getTime());
  const duration = (validIn && validOut) ? formatDuration(outAt - inAt) : 'Unknown';
  return (
    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 p-4 bg-white/6 rounded-lg text-center ring-1 ring-white/10 ring-inset">
      <CheckCircle className="mx-auto text-green-300 w-16 h-16" />
      <div className="text-2xl font-semibold text-white mt-2">Time Out Recorded</div>
      <div className="text-sm text-white/80">You left at {validOut ? outAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</div>
      <div className="mt-2">Duration: <span className="font-medium">{duration}</span></div>
      <div className="mt-3 text-sm text-white/90">Thank you for visiting the library!</div>
    </motion.div>
  );
};

export default TimeOutResult;
