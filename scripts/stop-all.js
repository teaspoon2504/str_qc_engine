import { execSync } from 'child_process';

const PORTS = [8000, 5001, 5002, 5003];

console.log('>>> Menghentikan seluruh microservices AML STR QC Engine...');

PORTS.forEach(port => {
  try {
    const pid = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' }).trim();
    if (pid) {
      const pids = pid.split('\n').join(' ');
      execSync(`kill -9 ${pids}`);
      console.log(`\x1b[32m[OK]\x1b[0m Port ${port} (PID: ${pids.replace(/\n/g, ', ')}) berhasil dihentikan.`);
    } else {
      console.log(`\x1b[33m[INFO]\x1b[0m Port ${port} tidak aktif.`);
    }
  } catch {
    console.log(`\x1b[33m[INFO]\x1b[0m Port ${port} tidak aktif.`);
  }
});

console.log('\x1b[32mSeluruh layanan microservices telah berhasil dihentikan.\x1b[0m');
