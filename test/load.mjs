import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function load(services = {}) {
  const context = vm.createContext({ console, Date, ...services });
  const names = ['Book', 'Backlog', 'Settings', 'RunLog', 'Demo', 'Template', 'Intake', 'Report', 'Main'];
  const code = names.map(name => readFileSync(new URL('../src/' + name + '.js', import.meta.url), 'utf8')).join('\n');
  vm.runInContext(code + '\nthis.kit = { Book, Backlog, Settings, RunLog, Demo, Template, Intake, Report, setupWorkbook, rankBacklog, createIntakeForm, makeDiscoveryReport, WEEKLY_WORK_HOURS };', context);
  return context.kit;
}

export const plain = value => JSON.parse(JSON.stringify(value));
