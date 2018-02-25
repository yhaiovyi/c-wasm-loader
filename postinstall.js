const { promisify } = require('util');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const tar = require('tar');
const { mkdtemp, createWriteStream, lstat } = require('fs');
const { tmpdir } = require('os');
const rimraf = require('rimraf');
const packageJson = require('./package.json');

const $mkdtemp = promisify(mkdtemp);
const $rimraf = promisify(rimraf);
const $lstat = promisify(lstat);

function $spawn(...args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(...args);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`child process exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const tmp = await $mkdtemp(path.join(tmpdir(), 'c-wasm-postinstall-'));
  const emsdkTar = path.join(tmp, 'emsdk-portable.tar.gz');
  const cwd = path.join(process.cwd(), 'emsdk-portable');

  try {
    const stats = await $lstat(path.join(cwd, 'emscripten', packageJson.emsdk, 'em++'));

    if (stats.isFile()) {
      process.stdout.write('emsdk found\n');
      process.exit(0);
    }
  } catch (error) {
    process.stdout.write(`${error}\n`);
    process.stdout.write('emsdk not found, installing\n');
  }

  try {
    const file = createWriteStream(emsdkTar);
    await new Promise((resolve, reject) => {
      http.get('http://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(response.statusMessage));
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            resolve();
          });
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    process.stdout.write('Unable to download emsdk\n');
    process.stdout.write(`${error}\n`);
    process.exit(1);
  }

  try {
    await tar.x({
      file: emsdkTar,
    });
  } catch (error) {
    process.stdout.write('Unable to unpack emsdk\n');
    process.stdout.write(`${error}\n`);
    process.exit(1);
  }

  try {
    await $spawn('./emsdk', ['update'], { cwd, stdio: 'inherit' });
  } catch (error) {
    process.stdout.write('Unable to update emsdk\n');
    process.stdout.write(`${error}\n`);
    process.exit(1);
  }

  try {
    await $spawn('./emsdk', ['install', `sdk-${packageJson.emsdk}-64bit`], { cwd, stdio: 'inherit' });
  } catch (error) {
    process.stdout.write('Unable to install emsdk\n');
    process.stdout.write(`${error}\n`);
    process.exit(1);
  }

  await $rimraf(tmp);
}

main();
