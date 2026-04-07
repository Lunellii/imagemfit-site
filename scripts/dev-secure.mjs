import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const children = [];

const npmExecFromEnv = process.env.npm_execpath;
const localNpmCli = resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const npmCliPath = npmExecFromEnv || (existsSync(localNpmCli) ? localNpmCli : "");

const run = (args) => {
  let command = "";
  let commandArgs = [];

  if (npmCliPath) {
    command = process.execPath;
    commandArgs = [npmCliPath, ...args];
  } else {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    command = npmCommand;
    commandArgs = args;
  }

  const child = spawn(command, commandArgs, {
    stdio: "inherit",
    shell: false
  });

  children.push(child);
  return child;
};

const shutdown = (signal = "SIGTERM") => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

const apiProcess = run(["run", "dev:api"]);
const webProcess = run(["run", "dev"]);

const handleExit = (code = 0) => {
  shutdown("SIGTERM");
  process.exit(code);
};

apiProcess.on("exit", (code) => {
  if (code && code !== 0) {
    handleExit(code);
  }
});

webProcess.on("exit", (code) => {
  if (code && code !== 0) {
    handleExit(code);
  }
});

process.on("SIGINT", () => handleExit(0));
process.on("SIGTERM", () => handleExit(0));
