module.exports = {
  apps: [
    {
      name: 'carrierllm-app',
      script: 'node',
      args: 'node_modules/vite/bin/vite.js --port 5174',
      cwd: './apps/app',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      log_file: './logs/app.log',
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'carrierllm-marketing',
      script: 'node',
      args: 'node_modules/vite/bin/vite.js --port 5175',
      cwd: './apps/marketing',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      log_file: './logs/marketing.log',
      error_file: './logs/marketing-error.log',
      out_file: './logs/marketing-out.log',
      merge_logs: true,
      time: true
    }
  ]
};