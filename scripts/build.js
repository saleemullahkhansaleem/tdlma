#!/usr/bin/env node

const { spawn } = require('child_process');

const buildProcess = spawn('next', ['build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let stdout = '';
let stderr = '';

buildProcess.stdout.on('data', (data) => {
  const output = data.toString();
  // Filter out the middleware deprecation warning
  const filtered = output
    .split('\n')
    .filter(line => !(line.includes('middleware') && line.includes('deprecated')))
    .join('\n');
  if (filtered.trim()) {
    process.stdout.write(filtered);
  }
  stdout += output;
});

buildProcess.stderr.on('data', (data) => {
  const output = data.toString();
  // Filter out the middleware deprecation warning
  const filtered = output
    .split('\n')
    .filter(line => !(line.includes('middleware') && line.includes('deprecated')))
    .join('\n');
  if (filtered.trim()) {
    process.stderr.write(filtered);
  }
  stderr += output;
});

buildProcess.on('close', (code) => {
  process.exit(code);
});

