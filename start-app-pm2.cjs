const { spawn } = require('child_process');

process.env.PORT = '5175';
const child = spawn('pnpm', ['dev'], {
  cwd: 'C:\\sites\\carrierllm\\apps\\app',
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5175' }
});

child.on('exit', (code) => {
  process.exit(code);
});