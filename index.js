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

function defaultOptions(options) {
  return {
    emccPath: getDefaultEmccPath(),
    emccFlags: [],
    ...options,
  };
}

module.exports = async function loader(content) {
  console.log(this.resourcePath);
  const callback = this.async();
  let cwd = null;

  try {
    let options = getOptions(this) || {};
    validateOptions(schema, options, 'C WASM Loader');
    options = defaultOptions(options);

    // Set limit for resource inlining (file size)
    let { limit } = options;
    if (limit) {
      limit = parseInt(limit, 10);
    }
    const embedded = (limit > content.length);

    const context = options.context || this.rootContext || (this.options && this.options.context);

    let url = interpolateName(this, options.name, {
      context,
      content,
      regExp: options.regExp,
    });

    const inputExt = path.extname(url);
    url = url.slice(0, -inputExt.length);
    url =`${url}.wasm`;

    let outputPath = url;

    if (options.outputPath) {
      if (typeof options.outputPath === 'function') {
        outputPath = options.outputPath(url);
      } else {
        outputPath = path.posix.join(options.outputPath, url);
      }
    }

    if (options.useRelativePath) {
      const filePath = this.resourcePath;

      /* eslint-disable no-underscore-dangle */
      const issuerContext = context || (
        this._module &&
        this._module.issuer &&
        this._module.issuer.context
      );
      /* eslint-enable no-underscore-dangle */

      const relativeUrl = issuerContext && path.relative(issuerContext, filePath)
        .split(path.sep)
        .join('/');

      const relativePath = relativeUrl && `${path.dirname(relativeUrl)}/`;
      // eslint-disable-next-line no-bitwise
      if (~relativePath.indexOf('../')) {
        outputPath = path.posix.join(outputPath, relativePath, url);
      } else {
        outputPath = path.posix.join(relativePath, url);
      }
    }

    const indexFile = 'output.js';
    const wasmFile = 'output.wasm';
    const publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

    cwd = await $mkdtemp(path.join(tmpdir(), 'c-wasm-loader-'));

    const emccFlags = [
      this.resourcePath,
      '-s', 'WASM=1',
      ...(embedded ? ['-s', 'SINGLE_FILE=1'] : []), // Embed wasm to js, so we don't need to deal with stupid urls
      '-o', indexFile,
    ];
    await $execFile(options.emccPath, emccFlags, { cwd });

    let indexContent = await $readFile(path.join(cwd, indexFile), 'utf8');

    if (!embedded) {
      const wasmContent = await $readFile(path.join(cwd, wasmFile));
      // Replace emscripten generated url with webpack generated
      indexContent = indexContent.replace(/'[^']*output\.[.a-z]+'/g, publicPath);

      this.emitFile(outputPath, wasmContent);
    }

    const module = `
      module.exports = (function(params) {
        return new Promise((resolve) => {
          var Module = Object.assign({
            onRuntimeInitialized: function() {
              resolve(Module);
            }
          }, params || {});
          ${indexContent};
        });
      });
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
