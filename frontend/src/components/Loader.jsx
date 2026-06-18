export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-faint">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <p className="font-mono text-xs uppercase tracking-widest2">{label}</p>
    </div>
  );
}
