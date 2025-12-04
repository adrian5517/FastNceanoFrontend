import React, { useEffect, useRef } from 'react';

const DesktopScanner = ({ onScanComplete, focusEnabled = true }) => {
  const ref = useRef(null);
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // Window-level listeners collect fast keystrokes from desktop scanners
    const CHAR_GAP_MS = 500; // tolerate up to 500ms between characters for slower scanners

    const handleKey = (e) => {
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
      if (e.key && e.key.length === 1) {
        // If gap between chars is large, assume new input
        if (now - lastTimeRef.current > CHAR_GAP_MS) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
        lastTimeRef.current = now;
        // lightweight debug log to observe incoming chars
        console.debug('[DesktopScanner] char:', e.key, 'buffer:', bufferRef.current);
      }
    };

    const handlePaste = (e) => {
      try {
        const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
        const code = pasted.trim();
        if (code) {
          console.debug('[DesktopScanner] paste detected:', code);
          onScanComplete(code);
        }
      } catch (err) { /* ignore */ }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keypress', handleKey);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keypress', handleKey);
      window.removeEventListener('paste', handlePaste);
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
