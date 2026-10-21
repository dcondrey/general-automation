import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { load } from '../test/load.mjs';
import { googleFake } from '../test/google-fake.mjs';

const env = googleFake(), kit = load(env.services);
kit.Template.setup();
const token = randomBytes(24).toString('hex');
const bridge = `<script>
window.google={script:{run:{
  withSuccessHandler(fn){return Object.assign(Object.create(this),{success:fn});},
  withFailureHandler(fn){return Object.assign(Object.create(this),{failure:fn});},
  workspaceRequest(action,payload){fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json','X-Workspace-Test':'${token}'},body:JSON.stringify({action,payload})}).then(r=>{if(!r.ok)throw Error('Connection failed');return r.json();}).then(result=>this.success(result)).catch(error=>this.failure(error));}
}}};
</script>`;
const driver = `<script>
(async()=>{
  const wait=async(test,label)=>{const end=Date.now()+8000;while(!test()){if(Date.now()>end)throw Error('Timed out: '+label);await new Promise(resolve=>setTimeout(resolve,40));}};
  const click=text=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent===text);if(!e)throw Error('Button missing: '+text);e.click();};
  const value=(selector,text)=>{const e=document.querySelector(selector);if(!e)throw Error('Field missing: '+selector);e.value=text;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  await wait(()=>state&&!busy,'initial snapshot');
  assert(state.demo&&state.items.length===6,'Demo did not load');
  click('Add a process');click('Try an inventory example');
  value('#field-process','Inventory <img src=x onerror="document.body.dataset.xss=1">');
  document.querySelector('form').requestSubmit();
  await wait(()=>document.querySelector('#field-needed'),'process questions');
  document.querySelector('form').requestSubmit();
  await wait(()=>preview&&!busy,'recommendation preview');
  assert(Math.abs(preview.potential-5.633333333333334)<1e-9,'Preview differs from production accounting');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&document.getElementById('message').textContent.includes('connection was interrupted'),'lost save acknowledgement');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&state&&!state.demo&&view==='overview','save retry');
  assert(state.items.length===1,'Retry duplicated the source process');
  assert(!document.querySelector('#content img')&&!document.body.dataset.xss,'User text was interpreted as HTML');
  click('Processes');click('Edit process');
  await wait(()=>!busy&&document.querySelector('#field-owner'),'process editor');
  value('#field-owner','Catalog owner');value('#field-status','Paused');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&editing.preview,'edit preview');
  value('#field-owner','Operations owner');
  assert(!editing.preview&&[...document.querySelectorAll('button')].some(e=>e.textContent==='Preview changes'),'Changing a field did not invalidate the preview');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&editing.preview,'updated edit preview');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&document.getElementById('message').textContent.includes('connection was interrupted'),'lost edit acknowledgement');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&state.items[0].status==='Paused'&&!document.querySelector('form'),'edit retry');
  assert(state.potential===0,'Paused process remained in the opportunity total');
  value('[aria-label="Process status"]','In progress');
  assert(!document.querySelector('article'),'Status filter kept a paused process');
  value('[aria-label="Process status"]','Paused');
  assert(document.querySelectorAll('article').length===1,'Status filter lost the paused process');
  click('Edit process');await wait(()=>!busy&&document.querySelector('#field-status'),'resume editor');
  value('#field-status','In progress');document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&editing.preview,'resume preview');document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&!document.querySelector('form'),'resume save');
  click('Refresh workspace');await wait(()=>!busy&&state.issueCount===1,'invalid pasted input');
  value('[aria-label="Process status"]','Needs attention');click('Fix process');
  await wait(()=>!busy&&document.querySelector('#field-minutes'),'correction editor');
  value('#field-minutes','45');document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&editing.preview,'correction preview');document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&state.issueCount===0&&!document.querySelector('form'),'source correction');
  click('Overview');
  click('Plan next step');
  assert(document.querySelector('[data-view=plan]').getAttribute('aria-current')==='page','Plan navigation did not follow the editor');
  value('input[type=date]','2099-01-31');value('textarea','Verify source mappings with the owner.');
  document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&state.items[0].plan.next==='Verify source mappings with the owner.','action plan');
  click('Measure results');click('Record observed result');
  value('input[type=number]','4');value('input[type=date]','2026-01-15');value('textarea','Compared two weeks of the same report, including ongoing upkeep.');
  document.querySelector('input[type=checkbox]').checked=true;document.querySelector('form').requestSubmit();
  await wait(()=>!busy&&document.getElementById('message').textContent.includes('could not finish'),'interrupted measurement');
  click('Refresh workspace');
  await wait(()=>!busy&&state.pendingMeasurements===1,'pending measurement');
  click('Finish interrupted save');
  await wait(()=>!busy&&state.measured===4&&state.history.length===1,'measurement');
  assert(state.items[0].status==='Live'&&state.potential===0,'Delivered work was counted as a new opportunity');
  document.body.dataset.workspaceCheck='passed';
})().catch(error=>{document.body.dataset.workspaceCheck='failed';document.body.dataset.workspaceError=error.message+'; '+JSON.stringify({step:addStep,fields:[...document.querySelectorAll('form input,form select')].map(e=>({name:e.name,value:e.value,error:e.validationMessage})),message:document.getElementById('message').textContent});});
</script>`;
const source = await readFile(new URL('../src/Workspace.html', import.meta.url), 'utf8');
const preview = process.argv[2] === '--preview';
if (preview && (!process.argv[3] || !process.argv[3].endsWith('.png'))) throw Error('Use --preview path/to/image.png.');
const previewDriver = `<script>(async()=>{for(let i=0;i<200;i++){if(state&&!busy){document.body.dataset.workspaceCheck='passed';return;}await new Promise(resolve=>setTimeout(resolve,40));}document.body.dataset.workspaceError='Preview did not load';})()</script>`;
const html = source.replace('<script>', bridge + '<script>').replace('</body>', (preview ? previewDriver : driver) + '</body>');
let lostAcknowledgement = false;
let lostEditAcknowledgement = false;
let invalidatedInput = false;
let interruptedMeasurement = false;
const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return; }
  if (req.method !== 'POST' || req.url !== '/rpc' || req.headers['x-workspace-test'] !== token) { res.writeHead(404); res.end(); return; }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 64000) throw Error('Request too large'); chunks.push(chunk); }
    const { action, payload } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (action === 'measure' && !interruptedMeasurement) {
      const sh = env.ss.sheets.get('Backlog'), getRange = sh.getRange.bind(sh);
      sh.getRange = (...args) => {
        const range = getRange(...args);
        if (args[1] === 13 && !interruptedMeasurement) range.setValues = () => { interruptedMeasurement = true; throw Error('Interrupted source write'); };
        return range;
      };
    }
    const result = kit.workspaceRequest(action, payload);
    if (action === 'add' && result.ok && !lostAcknowledgement) { lostAcknowledgement = true; res.writeHead(503); res.end(); return; }
    if (action === 'edit' && result.ok && !lostEditAcknowledgement) { lostEditAcknowledgement = true; res.writeHead(503); res.end(); return; }
    if (action === 'edit' && result.ok && payload.status === 'In progress' && !invalidatedInput) { invalidatedInput = true; env.ss.sheets.get('Backlog').data[1][4] = '4,5'; }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
  } catch (_) { res.writeHead(400); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'general-automation-browser-'));
const browser = process.env.BROWSER_BIN || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
let output = '', errors = '';
try {
  const args = ['--headless', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--user-data-dir=' + profile, '--dump-dom', '--virtual-time-budget=30000'];
  if (preview) args.push('--screenshot=' + resolve(process.argv[3]), '--window-size=1000,1160');
  const child = spawn(browser, args.concat('http://127.0.0.1:' + port + '/'), { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { errors = (errors + chunk).slice(-3000); });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 45000);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }).finally(() => clearTimeout(timeout));
  if (!/<body\b[^>]*data-workspace-check="passed"/.test(output)) {
    const failure = output.match(/data-workspace-error="([^"]+)"/)?.[1];
    throw Error(failure || 'Browser flow did not complete. Chrome status ' + code + '. ' + errors);
  }
  if (code !== 0) throw Error('The browser flow passed, but Chrome exited with status ' + code + '. ' + errors);
  if (!preview && (!lostAcknowledgement || !lostEditAcknowledgement || !invalidatedInput || !interruptedMeasurement || kit.Book.read('Backlog', kit.Backlog.HEADERS).length !== 1 || kit.Workspace.history().length !== 1)) throw Error('Browser result disagrees with the saved source or history.');
  console.log(preview ? 'Preview saved from the production interface with synthetic data.' : 'Browser flow passed: intake, safe rendering, edits, status filters, invalid-row correction, lost-response retries, action plan, and resumed measurement.');
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
