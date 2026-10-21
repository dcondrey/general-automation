import { readdir, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
for (const name of await readdir(new URL('../src/', import.meta.url))) {
  if (name.endsWith('.js')) new Script(await readFile(new URL('../src/' + name, import.meta.url), 'utf8'), { filename: name });
  if (name.endsWith('.html')) {
    const html = await readFile(new URL('../src/' + name, import.meta.url), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new Script(match[1], { filename: name });
  }
}
const manifest = JSON.parse(await readFile(new URL('../appsscript.json', import.meta.url), 'utf8'));
if (manifest.webapp || manifest.oauthScopes.some(scope => /external_request|scriptapp|drive|gmail/.test(scope))) {
  throw new Error('Discovery must not request integrations, triggers, Gmail, Drive, or web-app access.');
}
console.log('Source syntax and scope checks passed.');
