const { spawn } = require('child_process');

process.env.PORT = '5174';
const child = spawn('pnpm', ['dev'], {
  cwd: 'C:\\sites\\carrierllm\\apps\\marketing',
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5174' }
});

child.on('exit', (code) => {
  process.exit(code);
});