module.exports = {
  apps: [
    {
      name: "tongji-oolong-tea",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 127.0.0.1 --port 3107",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
