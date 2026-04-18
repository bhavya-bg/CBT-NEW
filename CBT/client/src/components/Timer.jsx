function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Timer({ remainingSeconds }) {
  const isCritical = remainingSeconds <= 60;

  return (
    <div
      className={`rounded-2xl px-4 py-2 text-xl font-bold tabular-nums ${
        isCritical ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
      }`}
      aria-live="polite"
    >
      {formatTime(remainingSeconds)}
    </div>
  );
}
