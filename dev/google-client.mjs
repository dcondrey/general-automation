import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { google } from 'googleapis';

export async function googleClient() {
  google.options({ timeout: 30000, retry: false });
  const file = JSON.parse(await readFile(join(homedir(), '.clasprc.json'), 'utf8'));
  const saved = file.tokens?.default;
  if (!saved?.refresh_token) throw new Error('Run npm run clasp -- login first.');
  const auth = google.auth.fromJSON(saved);
  auth.setCredentials(saved);
  return { drive: google.drive({ version: 'v3', auth }), script: google.script({ version: 'v1', auth }) };
}

export function googleMessage(error) {
  return error.response?.data?.error?.message || 'Google could not complete the request. Check account authorization and API access.';
}
