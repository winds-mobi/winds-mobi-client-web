'use strict';

const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const path = require('node:path');

const emberCliRequire = createRequire(
  require.resolve('ember-cli/package.json')
);
const testemPackagePath = emberCliRequire.resolve('testem/package.json');
const testemPackage = emberCliRequire(testemPackagePath);
const testemBinPath = path.resolve(
  path.dirname(testemPackagePath),
  testemPackage.bin.testem
);

// pnpm forwards a literal `--` separator (e.g. `pnpm test:ember:dev -- --test_page ...`)
// straight into argv; testem's own CLI doesn't expect it there and hangs silently
// waiting on a browser that never connects. Drop it before parsing.
const args = process.argv.slice(2).filter((arg) => arg !== '--');
const subcommand = args[0]?.startsWith('-') ? [] : args.slice(0, 1);
const forwardedArgs = args[0]?.startsWith('-') ? args : args.slice(1);

const child = spawn(
  process.execPath,
  [testemBinPath, ...subcommand, '--file', 'testem-dev.js', ...forwardedArgs],
  {
    stdio: 'inherit',
    env: process.env,
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
