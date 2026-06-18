export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-faint">{description}</p>}
      {action}
    </div>
  );
}
