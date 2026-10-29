#!/usr/bin/env node
/**
 * Registers/unregisters the backend as a native Windows service via `node-windows`
 * (runs `server.js`, the same entry point as `start.bat`, with PORT set).
 * Installed once by the deploy script on first deploy; later deploys only stop/start it.
 *
 * Usage (from the deployed backend folder):
 *   node scripts\win-service.js install   --name PT-Api --port 3001
 *   node scripts\win-service.js uninstall --name PT-Api
 */

const path = require("node:path");
const { Service } = require("node-windows");

const [, , command, ...rest] = process.argv;
const args = { name: null, port: "3001" };
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--name") args.name = rest[++i];
  else if (rest[i] === "--port") args.port = rest[++i];
}

if (!["install", "uninstall"].includes(command) || !args.name) {
  console.error("Usage: node scripts/win-service.js <install|uninstall> --name <ServiceName> [--port <port>]");
  process.exit(1);
}

const backendDir = path.join(__dirname, "..");
const svc = new Service({
  name: args.name,
  description: "Simon Price PT backend API (Node.js)",
  script: path.join(backendDir, "server.js"),
  workingDirectory: backendDir,
  env: [{ name: "PORT", value: args.port }],
});

svc.on("install", () => {
  console.log(`Service "${args.name}" installed. Starting it now...`);
  svc.start();
});
svc.on("alreadyinstalled", () => console.log(`Service "${args.name}" is already installed.`));
svc.on("start", () => console.log(`Service "${args.name}" started.`));
svc.on("uninstall", () => console.log(`Service "${args.name}" uninstalled.`));
svc.on("error", (err) => {
  console.error(`Service "${args.name}" error:`, err);
  process.exit(1);
});

if (command === "install") svc.install();
else svc.uninstall();
