import React, { useEffect, useRef } from 'react';

const DesktopScanner = ({ onScanComplete, focusEnabled = true }) => {
  const ref = useRef(null);
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // Window-level listener collects fast keystrokes from desktop scanners
    const handleWindowKey = (e) => {
      const now = Date.now();
      // Ignore modifier keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        console.debug('[DesktopScanner] Enter pressed, buffer:', bufferRef.current, '-> code:', code);
        if (code) {
          try { window.dispatchEvent(new CustomEvent('scanner:debug', { detail: code })); } catch (err) {}
          onScanComplete(code);
        }
        bufferRef.current = '';
        lastTimeRef.current = 0;
        return;
      }

      // Only capture printable single characters
      if (e.key.length === 1) {
        // If gap between chars is large, assume new input
        if (now - lastTimeRef.current > 200) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
        lastTimeRef.current = now;
        // lightweight debug log to observe incoming chars
        console.debug('[DesktopScanner] char:', e.key, 'buffer:', bufferRef.current);
      }
    };

    window.addEventListener('keydown', handleWindowKey);

    return () => {
      window.removeEventListener('keydown', handleWindowKey);
    };
  }, [onScanComplete]);

  // Hidden input left as a fallback for environments that require focused input
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Keep focusing the input as a fallback, but move it off-screen and disable autocomplete
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('spellcheck', 'false');
    const focusLoop = setInterval(() => {
      try {
        // Only focus when allowed (parent can disable focusing when interacting with UI)
        if (focusEnabled) el.focus();
      } catch (e) { /* ignore */ }
    }, 1000);
    return () => clearInterval(focusLoop);
  }, [focusEnabled]);

  return (
    <input
      id="scanner-input"
      ref={ref}
      className="sr-only"
      aria-label="Hidden scanner input"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      tabIndex={-1}
      style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}
      name="scanner-input-hidden"
    />
  );
};

export default DesktopScanner;
