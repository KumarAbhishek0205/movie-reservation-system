const VARIANTS = {
  default: 'bg-surface2 text-ink-dim border-line',
  gold: 'bg-gold-muted text-gold-soft border-gold/40',
  accent: 'bg-accent-muted text-white border-accent/50',
  success: 'bg-emerald-950 text-emerald-400 border-emerald-800',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
