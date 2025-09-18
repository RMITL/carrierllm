export default {
  apps: [
    {
      name: 'carrierllm-marketing',
      cwd: './apps/marketing',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: '5174'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'carrierllm-app',
      cwd: './apps/app',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: '5175'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};