type Section = { label: string; value: unknown };
function formatValue(v: unknown): string {
  if (v === false) return 'false';
  if (v === 0) return '0';
  if (v === '' || v === null || v === undefined) return '(empty)';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(empty)';
  return String(v);
}
// Renders AI JSON as readable labelled sections, preserving false/0/empty.
export default function AiSections({ aiGenerated, sections }: { aiGenerated: boolean; sections: Section[] }) {
  return (
    <section aria-label="AI summary">
      <p>{aiGenerated ? 'AI-generated summary' : 'Deterministic summary (no AI provider configured)'}</p>
      <dl>
        {(sections || []).map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{formatValue(s.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
