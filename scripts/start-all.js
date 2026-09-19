import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const services = [
  { name: 'Document Service', cmd: 'node', args: ['services/document-service/src/index.js'], color: '\x1b[34m' },
  { name: 'QC Engine Service', cmd: 'node', args: ['services/qc-service/src/index.js'], color: '\x1b[35m' },
  { name: 'Approval Service', cmd: 'node', args: ['services/approval-service/src/index.js'], color: '\x1b[32m' },
  { name: 'API Gateway', cmd: 'node', args: ['services/gateway/src/index.js'], color: '\x1b[36m' }
];

console.log('\x1b[1m\x1b[33m%s\x1b[0m', '>>> Menjalankan Seluruh Microservices AML STR QC Engine...');

const runningProcesses = [];

services.forEach(srv => {
  const proc = spawn(srv.cmd, srv.args, {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(l => console.log(`${srv.color}[${srv.name}]\x1b[0m ${l}`));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(l => console.error(`${srv.color}[${srv.name} ERROR]\x1b[0m ${l}`));
  });

  proc.on('close', (code) => {
    console.log(`${srv.color}[${srv.name}] berhenti dengan kode ${code}\x1b[0m`);
  });

  runningProcesses.push(proc);
});

process.on('SIGINT', () => {
  console.log('\nMematikan semua microservices...');
  runningProcesses.forEach(p => p.kill());
  process.exit();
});
