import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { googleFake } from './google-fake.mjs';
import { load } from './load.mjs';

const practices = JSON.parse(readFileSync(new URL('../best-practices.json', import.meta.url), 'utf8'));

test('published defaults and limits match the installed templates without external requests', () => {
  const env = googleFake(), discovery = load(env.services);
  discovery.Template.setup();
  assert.equal(discovery.Settings.read().source, practices.defaults.discovery.dataSource);
  assert.equal(discovery.Settings.read().files, practices.defaults.discovery.createGoogleFiles);
  assert.equal(discovery.Book.MAX_ROWS, practices.limits.rowsPerTable);
  assert.equal(discovery.Book.MAX_TEXT, practices.limits.charactersPerCell);
  for (const [suite, name] of Object.entries({ marketplace: 'Watch', sorter: 'Sorter', handoffs: 'Handoffs' })) {
    const services = googleFake().services;
    const context = vm.createContext({ console, Date, ...services, UrlFetchApp: { fetch() { throw Error('Setup must not contact an external service.'); } } });
    vm.runInContext(readFileSync(new URL('../dist/' + suite + '/Code.gs', import.meta.url), 'utf8') + '\nthis.kit={Book,Suite,' + name + '};', context);
    context.kit[name].setup();
    assert.equal(context.kit.Suite.options().Mode, practices.defaults.externalSuites.mode, suite);
    assert.equal(context.kit.Book.MAX_ROWS, practices.limits.rowsPerTable, suite);
    assert.equal(context.kit.Book.MAX_TEXT, practices.limits.charactersPerCell, suite);
  }
});
