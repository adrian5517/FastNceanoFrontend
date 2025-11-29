import React from 'react';
import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';

const ScanButton = ({ listening, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="w-52 h-52 md:w-60 md:h-60 rounded-full bg-gradient-to-br from-white/6 to-white/3 backdrop-blur-xl border border-[rgba(253,200,35,0.15)] flex items-center justify-center flex-col gap-3 shadow-2xl relative overflow-hidden"
      aria-label="Scan QR Code"
    >
      <span className="absolute inset-0 rounded-full ring-2 ring-[rgba(6,69,25,0.12)] animate-pulse" />
      <motion.div animate={listening ? { scale: [1, 1.07, 1], opacity: [1, 0.95, 1] } : {}} transition={{ repeat: listening ? Infinity : 0, duration: 1.6 }}>
        <QrCode className="text-[#FDC823] w-16 h-16 drop-shadow-lg" />
      </motion.div>
      <div className="text-sm text-cream font-medium">Scan QR Code</div>
    </motion.button>
  );
};

export default ScanButton;
