import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { googleClient, googleMessage } from './google-client.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const clasp = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'clasp.cmd' : 'clasp');
function run(args, inherit = true) {
  const r = spawnSync(clasp, args, { cwd: root, stdio: inherit ? 'inherit' : 'pipe', encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('Google setup stopped. Follow the message above, then run npm run setup again.');
  return r.stdout;
}
const build = spawnSync(process.execPath, [join(root, 'dev/build.mjs')], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(1);
if (!existsSync(join(root, '.clasp.json'))) {
  run(['show-authorized-user']);
  const pending = join(root, '.google-setup.json');
  let spreadsheetId;
  if (existsSync(pending)) spreadsheetId = JSON.parse(readFileSync(pending, 'utf8')).spreadsheetId;
  if (!spreadsheetId) {
    const { drive } = await googleClient();
    try {
      const { data } = await drive.files.create({ requestBody: { name: 'Automation Discovery Kit', mimeType: 'application/vnd.google-apps.spreadsheet', appProperties: { generalAutomation: 'discovery-v0.1' } }, fields: 'id' }, { retry: false });
      if (!data.id) throw new Error('Google did not return a workbook ID.');
      spreadsheetId = data.id;
      writeFileSync(pending, JSON.stringify({ spreadsheetId }, null, 2) + '\n');
    } catch (error) { throw new Error(googleMessage(error)); }
  }
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(spreadsheetId)) throw new Error('Invalid saved workbook ID in .google-setup.json.');
  run(['create-script', '--type', 'standalone', '--parentId', spreadsheetId, '--title', 'Automation Discovery Kit', '--rootDir', 'dist/discovery']);
} else {
  const config = JSON.parse(readFileSync(join(root, '.clasp.json'), 'utf8'));
  if (config.rootDir !== 'dist/discovery') throw new Error('Existing clasp configuration targets another folder. Review .clasp.json before pushing.');
  console.log('Using the existing local Google project. No duplicate workbook will be created.');
}
const rebuild = spawnSync(process.execPath, [join(root, 'dev/build.mjs')], { cwd: root, stdio: 'inherit' });
if (rebuild.status !== 0) process.exit(1);
run(['push', '--force']);
console.log('Open the workbook with npm run clasp -- open-container. Reload it, then choose Automations → Set up workbook.');
