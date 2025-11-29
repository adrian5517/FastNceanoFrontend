import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [dark]);
  return (
    <button onClick={() => setDark((s) => !s)} className="p-2 rounded-md bg-white/6">
      {dark ? <Sun className="w-5 h-5 text-cream" /> : <Moon className="w-5 h-5 text-cream" />}
    </button>
  );
};

export default DarkModeToggle;
