import React from 'react';
import DesktopScanner from './DesktopScanner';
import PurposeSelector from './PurposeSelector';
import TimeInResult from './TimeInResult';
import TimeOutResult from './TimeOutResult';

export default function RecorderPanel({
  needsPurpose,
  confirmPurpose,
  cancelPurpose,
  handleScan,
  focusEnabled,
  timeInResult,
  timeOutResult,
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/4 flex flex-col items-center gap-4 w-full">
      <p className="text-cream/80 text-center">Place your card or scan at the kiosk.</p>

      <DesktopScanner
        onScanComplete={(code) => handleScan(code)}
        focusEnabled={focusEnabled}
      />

      {needsPurpose && (
        <PurposeSelector
          onConfirm={confirmPurpose}
          onCancel={cancelPurpose}
        />
      )}

      <div className="w-full">
        {timeInResult && <TimeInResult result={timeInResult} />}
        {timeOutResult && <TimeOutResult result={timeOutResult} />}
      </div>
    </div>
  );
}
