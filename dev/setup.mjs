import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { googleClient, googleMessage } from './google-client.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const suite = process.argv[2] || 'discovery';
const titles = { discovery: 'Automation Discovery Kit', marketplace: 'Marketplace Watch', sorter: 'AI Sorter', handoffs: 'Team Handoffs' };
if (!Object.hasOwn(titles, suite)) throw new Error('Choose discovery, marketplace, sorter, or handoffs.');
const configName = suite === 'discovery' ? '.clasp.json' : '.clasp.' + suite + '.json';
const configPath = join(root, configName);
const contentDir = 'dist/' + suite;
const clasp = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'clasp.cmd' : 'clasp');
function run(args, inherit = true) {
  const r = spawnSync(clasp, [...(existsSync(configPath) ? ['--project', configName] : []), ...args], { cwd: root, stdio: inherit ? 'inherit' : 'pipe', encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('Google setup stopped. Follow the message above, then run npm run setup again.');
  return r.stdout;
}
const build = spawnSync(process.execPath, [join(root, 'dev/build.mjs')], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(1);
if (!existsSync(configPath)) {
  run(['show-authorized-user']);
  const pending = join(root, suite === 'discovery' ? '.google-setup.json' : '.google-setup.' + suite + '.json');
  let spreadsheetId;
  if (existsSync(pending)) spreadsheetId = JSON.parse(readFileSync(pending, 'utf8')).spreadsheetId;
  if (!spreadsheetId) {
    const { drive } = await googleClient();
    try {
      const { data } = await drive.files.create({ requestBody: { name: titles[suite], mimeType: 'application/vnd.google-apps.spreadsheet', appProperties: { generalAutomation: suite + '-v0.1' } }, fields: 'id' }, { retry: false });
      if (!data.id) throw new Error('Google did not return a workbook ID.');
      spreadsheetId = data.id;
      writeFileSync(pending, JSON.stringify({ spreadsheetId }, null, 2) + '\n');
    } catch (error) { throw new Error(googleMessage(error)); }
  }
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(spreadsheetId)) throw new Error('Invalid saved workbook ID in .google-setup.json.');
  const { script } = await googleClient();
  try {
    const { data } = await script.projects.create({ requestBody: { title: titles[suite], parentId: spreadsheetId } }, { retry: false, timeout: 30000 });
    if (!data.scriptId) throw new Error('Google did not return a script ID.');
    writeFileSync(configPath, JSON.stringify({ scriptId: data.scriptId, parentId: spreadsheetId, rootDir: contentDir }, null, 2) + '\n');
  } catch (error) { throw new Error(googleMessage(error)); }
} else {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (config.rootDir !== contentDir) throw new Error('Existing clasp configuration targets another folder. Review the local binding before pushing.');
  console.log('Using the existing local Google project. No duplicate workbook will be created.');
}
const rebuild = spawnSync(process.execPath, [join(root, 'dev/build.mjs')], { cwd: root, stdio: 'inherit' });
if (rebuild.status !== 0) process.exit(1);
run(['push', '--force']);
console.log('Open the workbook with npm run clasp -- --project ' + configName + ' open-container. Reload it, then choose Automations → Set up workbook.');
