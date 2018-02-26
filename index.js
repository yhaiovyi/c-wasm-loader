/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Yurii Haiovyi
*/
const { promisify } = require('util');
const { getOptions, interpolateName } = require('loader-utils');
const { execFile } = require('child_process');
const { readFile, writeFile, mkdtemp } = require('fs');
const { tmpdir, platform } = require('os');
const path = require('path');
const rimraf = require('rimraf');
const md5 = require('md5');
const validateOptions = require('schema-utils');

const packageJson = require('./package.json');
const schema = require('./options.json');

const $execFile = promisify(execFile);
const $readFile = promisify(readFile);
const $writeFile = promisify(writeFile);
const $mkdtemp = promisify(mkdtemp);
const $rimraf = promisify(rimraf);

function getDefaultEmccPath() {
  return path.join(
    __dirname,
    'emsdk-portable',
    'emscripten',
    packageJson.emsdk,
    (platform() === 'win32') ? 'em++.bat' : 'em++',
  );
}

function toConsumableArray(array) {
  return Array.isArray(array) ? [...array] : Array.from(array);
}

function defaultOptions(options) {
  return {
    emccPath: getDefaultEmccPath(),
    emccFlags: ['-O3'],
    ...options,
  };
}

function getBase(pathToFile) {
  return path.format({
    dir: path.dirname(pathToFile),
    base: path.basename(pathToFile, path.extname(pathToFile)),
  });
}

module.exports = async function loader(content) {
  const callback = this.async();
  let cwd = null;

  try {
    let options = getOptions(this) || {};
    validateOptions(schema, options, 'C WASM Loader');
    options = defaultOptions(options);

    const context = options.context || this.rootContext || (this.options && this.options.context);

    const url = interpolateName(this, options.name, {
      context,
      content,
      regExp: options.regExp,
    });

    let outputPath = url;

    if (options.outputPath) {
      if (typeof options.outputPath === 'function') {
        outputPath = options.outputPath(url);
      } else {
        outputPath = path.posix.join(options.outputPath, url);
      }
    }

    const ext = path.extname(url);
    const base = getBase(outputPath);
    outputPath = `${base}.wasm`;

    const hash = md5(content);
    const inputFile = `${hash}${ext}`;
    const indexFile = `${hash}.js`;
    const wasmFile = `${hash}.wasm`;

    cwd = await $mkdtemp(path.join(tmpdir(), 'c-wasm-loader-'));
    await $writeFile(path.join(cwd, inputFile), content);

    const match = content.match(/^[\s\n]*\/\/\s*emcc-flags\s+([^\n]+)/);
    let extraFlags = [];
    if (match) {
      extraFlags = JSON.parse(match[1]);
    }

    const emccFlags = [
      inputFile,
      '-s', 'WASM=1',
      ...toConsumableArray(extraFlags),
      ...toConsumableArray(options.emccFlags),
      '-o', indexFile,
    ];
    await $execFile(options.emccPath, emccFlags, { cwd });

    let indexContent = await $readFile(path.join(cwd, indexFile), 'utf8');
    const wasmContent = await $readFile(path.join(cwd, wasmFile));

    indexContent = indexContent.replace(/var wasmBinaryFile="[^"]*"/, 'var wasmBinaryFile=""');

    this.emitFile(outputPath, wasmContent);

    const module = `
      module.exports = (function() {
        return new Promise((resolve) => {
          var Module = {
            onRuntimeInitialized: function() {
              resolve(Module);
            },
            locateFile: function() {
              return '${outputPath}';
            }
          };
          ${indexContent};
          return Module;
        });
      })();
    `;

    callback(null, module);
  } catch (e) {
    callback(e);
  } finally {
    if (cwd !== null) {
      await $rimraf(cwd);
    }
  }
};
