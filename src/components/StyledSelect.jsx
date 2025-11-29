import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// options can be either flat: [{ value, label }] or grouped: [{ label, options: [{value,label}] }]
export default function StyledSelect({ options = [], value = '', onChange = () => {}, placeholder = 'Select...', id }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  // flatten options for keyboard navigation (memoized)
  const flatOptions = useMemo(() => {
    const f = [];
    options.forEach((o) => {
      if (o && o.options && Array.isArray(o.options)) {
        o.options.forEach(opt => f.push(opt));
      } else if (o && o.value !== undefined) {
        f.push(o);
      }
    });
    return f;
  }, [options]);

  // find label for current value
  const current = useMemo(() => flatOptions.find(o => String(o.value) === String(value)), [flatOptions, value]);

  useEffect(() => {
    if (!open) {
      setHighlighted(null);
    } else {
      // set highlighted to current index
      const idx = flatOptions.findIndex(o => String(o.value) === String(value));
      setHighlighted(idx >= 0 ? idx : 0);
    }
  }, [open, flatOptions, value]);

  const onSelect = useCallback((val) => {
    onChange(val);
    setOpen(false);
    btnRef.current?.focus();
  }, [onChange]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted(h => (h === null ? 0 : Math.min(flatOptions.length - 1, h + 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted(h => (h === null ? flatOptions.length - 1 : Math.max(0, h - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlighted != null) {
          const opt = flatOptions[highlighted];
          if (opt) onSelect(opt.value);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, highlighted, flatOptions, onSelect]);

  // click outside to close
  useEffect(() => {
    const onClick = (e) => {
      if (!open) return;
      if (listRef.current && !listRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  // Ensure highlighted option is scrolled into view when navigating with keyboard
  useEffect(() => {
    if (!open || highlighted == null) return;
    const el = listRef.current?.querySelector(`[data-flat-index="${highlighted}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  return (
    <div className="relative">
      <button
        id={id}
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center justify-between"
      >
        <span className={`${current ? 'text-white' : 'text-white/60'}`}>{current ? current.label : placeholder}</span>
        <svg className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div ref={listRef} role="listbox" aria-labelledby={id} className="absolute z-[99999] mt-2 w-full bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto styled-select-menu">
          {options.map((group, gi) => (
            group && group.options && Array.isArray(group.options) ? (
              <div key={gi} className="py-2">
                <div className="px-3 text-xs text-white/60 font-medium mb-1">{group.label}</div>
                {group.options.map((opt, oi) => {
                  const flatIndex = flatOptions.findIndex(o => o.value === opt.value);
                  const isHighlighted = flatIndex === highlighted;
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={opt.value}
                      data-flat-index={flatIndex}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onSelect(opt.value)}
                      onMouseEnter={() => setHighlighted(flatIndex)}
                      className={`px-3 py-2 cursor-pointer ${isHighlighted ? 'bg-emerald-500/25 text-white' : 'text-white/90'} hover:bg-emerald-500/20`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate">{opt.label}</div>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div key={gi}
                data-flat-index={flatOptions.findIndex(o => String(o.value) === String(group.value))}
                role="option"
                aria-selected={String(group.value) === String(value)}
                onClick={() => onSelect(group.value)}
                onMouseEnter={() => setHighlighted(flatOptions.findIndex(o => String(o.value) === String(group.value)))}
                className={`px-3 py-2 cursor-pointer ${String(group.value) === String(value) ? 'bg-emerald-500/25 text-white' : 'text-white/90'} hover:bg-emerald-500/20`}
              >
                {group.label || group.value}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
