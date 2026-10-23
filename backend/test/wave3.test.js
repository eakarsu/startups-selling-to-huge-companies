const test = require('node:test');
const assert = require('node:assert/strict');
const { filterRecords, toCsv, renderSections, fallback, hasProvider } = require('../lib/wave3');

test('wave3 filter searches deals and filters by stage', () => {
  const rows = [{ title: 'Platform rollout', company_name: 'Acme', stage: 'prospecting' }, { title: 'Renewal', company_name: 'Globex', stage: 'closed' }];
  assert.equal(filterRecords(rows, { q: 'acme' }).length, 1);
  assert.equal(filterRecords(rows, { stage: 'closed' })[0].title, 'Renewal');
});
test('wave3 CSV export escapes commas and quotes', () => {
  assert.match(toCsv([{ id: 1, title: 'a,"b"' }], ['id', 'title']), /"a,""b"""/);
});
test('wave3 AI fallback is labelled and preserves false/0/empty', () => {
  assert.equal(hasProvider({}), false);
  const out = fallback('deal-health', [{ title: 'X', value_usd: 0, next_action: 'Call' }]);
  assert.equal(out.aiGenerated, false);
  const text = renderSections(out.sections);
  assert.match(text, /Has stalled deals: false/);
  assert.match(text, /Pipeline value \(USD\): 0/);
  assert.match(renderSections([{ label: 'Note', value: '' }]), /Note: \(empty\)/);
});
