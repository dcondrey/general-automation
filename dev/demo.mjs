import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = (await Promise.all(['Book', 'Backlog', 'Demo', 'Suite', 'Watch', 'Sorter', 'Handoffs'].map(n => readFile(join(root, 'src', n + '.js'), 'utf8')))).join('\n');
const context = vm.createContext({ Date, Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (_algo, text) => [...createHash('sha256').update(text).digest()] } });
vm.runInContext(source + '\nthis.modules={Backlog,Demo,Watch,Sorter,Handoffs};', context);
const { Backlog, Demo, Watch, Sorter, Handoffs } = context.modules;
const csv = rows => rows.map(r => r.map(v => '"' + String(v instanceof Date ? v.toISOString().slice(0, 10) : v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const discovery = Backlog.evaluate(Demo.rows(), {}, 'Demo backlog');
const market = Watch.evaluate(Watch.sample(Date.parse('2026-10-21T00:00:00Z')), 3, Date.parse('2026-10-21T00:00:00Z'));
const outputs = {
  'discovery-ranked.csv': csv([Backlog.OUTPUT, ...discovery.ranked.map(Backlog.toRow)]),
  'marketplace-signals.csv': csv([Watch.SIGNALS.slice(0, 6), ...market.signals]),
  'marketplace-metrics.csv': csv([Watch.METRICS, ...market.metrics]),
  'sorter-baseline.csv': csv([['Source ID', 'Text', 'Label', 'Human review', 'Method'], ...Sorter.samples.map(r => [r[0], r[1], Sorter.baseline(r[1], Sorter.labels).label, 'Yes', 'Deterministic baseline; no LLM called'])]),
  'handoff-preview.json': JSON.stringify(Handoffs.plan(Handoffs.samples[0]).payload, null, 2) + '\n',
};
await mkdir(join(root, 'examples'), { recursive: true });
for (const [name, value] of Object.entries(outputs)) {
  const path = join(root, 'examples', name);
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== value) throw new Error('Regenerate examples with npm run demo: ' + name);
  } else await writeFile(path, value);
}
console.log(process.argv.includes('--check') ? 'Examples match production logic.' : 'Generated five inspectable demo outputs. No Google account, credentials, or external requests used.');
