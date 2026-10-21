import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for (const suite of ['discovery', 'marketplace', 'sorter', 'handoffs']) {
  test(suite + ' bundle exposes every menu action and only its intended service scopes', () => {
    const handlers = [];
    const menu = { addItem(_label, handler) { handlers.push(handler); return this; }, addSubMenu() { return this; }, addSeparator() { return this; }, addToUi() {} };
    const context = vm.createContext({ console, SpreadsheetApp: { getActiveSpreadsheet: () => null, getUi: () => ({ createMenu: () => menu }) } });
    const code = readFileSync(new URL('../dist/' + suite + '/Code.gs', import.meta.url), 'utf8');
    vm.runInContext(code, context); context.onOpen();
    assert.ok(handlers.length >= 4);
    for (const name of handlers) assert.equal(typeof context[name], 'function', 'Missing entry point ' + name);
    assert.equal(typeof context.operatorAction_, 'function');
    const manifest = JSON.parse(readFileSync(new URL('../dist/' + suite + '/appsscript.json', import.meta.url), 'utf8'));
    assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets.currentonly'));
    assert.equal(manifest.webapp, undefined);
    assert.ok(!manifest.oauthScopes.some(s => /gmail|drive|scriptapp/.test(s)));
    if (suite === 'discovery') { assert.ok(!code.includes('UrlFetchApp')); assert.ok(!manifest.oauthScopes.some(s => /external_request/.test(s))); }
    else { assert.ok(!manifest.oauthScopes.some(s => /forms|documents/.test(s))); assert.ok(manifest.oauthScopes.some(s => /external_request/.test(s))); }
  });
}
