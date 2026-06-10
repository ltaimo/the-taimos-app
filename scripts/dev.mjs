import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(command, ['run', 'start:dev', '-w', 'backend'], { stdio: 'inherit' }),
  spawn(command, ['run', 'dev', '-w', 'frontend'], { stdio: 'inherit' }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 0) {
    stop();
    process.exitCode = code;
  }
}));
