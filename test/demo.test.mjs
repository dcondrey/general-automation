import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('published examples reproduce across developer and CI time zones', () => {
  for (const TZ of ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu']) {
    const result = spawnSync(process.execPath, ['dev/demo.mjs', '--check'], { cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.equal(result.status, 0, TZ + ': ' + result.stderr);
  }
});
