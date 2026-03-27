import { spawn } from "node:child_process";

const args = process.argv.slice(2);

const child = spawn(
  "npx",
  [
    "-p",
    "node@22",
    "node",
    "./node_modules/@remotion/cli/remotion-cli.js",
    ...args,
  ],
  {
    stdio: "inherit",
    shell: false,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
