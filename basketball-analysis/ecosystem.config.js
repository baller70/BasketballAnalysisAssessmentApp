// PM2 process definition for SHOTIQ AI on the Contabo box.
// Standalone Next.js app, fronted by Caddy on shotiq.194-146-12-139.sslip.io.
// Start/manage with:
//   pm2 start ecosystem.config.js
//   pm2 restart shotiq
//   pm2 save
module.exports = {
  apps: [
    {
      name: "shotiq",
      // `next start` from the local install — no global next required.
      script: "node_modules/.bin/next",
      args: "start --port 3060",
      cwd: "/opt/shotiq/basketball-analysis",
      instances: 1,
      exec_mode: "fork",
      // Restart if the process leaks past this — Next + TF.js can grow over time.
      max_memory_restart: "800M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3060,
      },
    },
  ],
};
