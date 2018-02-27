# c-wasm-loader

<div align="center">
<a title="By Jeremy Kratz (https://github.com/isocpp/logos) [Copyrighted free use], via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File%3AISO_C%2B%2B_Logo.svg"><img height="128" alt="ISO C++ Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/ISO_C%2B%2B_Logo.svg/256px-ISO_C%2B%2B_Logo.svg.png"/></a>
<a title="By Carlos Baraza [CC0], via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File%3AWeb_Assembly_Logo.svg"><img height="128" alt="Web Assembly Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Web_Assembly_Logo.svg/512px-Web_Assembly_Logo.svg.png"/></a>
</div>

[![npm][npm]][npm-url]

[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![builds][builds]][builds-url]
[![coverage][cover]][cover-url]

Webpack loader that allows you to import C/C++ files as WebAssembly. 
This project is in very early development stage, and you're very welcome to contribute or file tickets, as well as it's not released yet, so api changes everyday, publish process is not standartized, so some builds are broken.

<h2 align="center">Install</h2>

Install with npm:

```bash
npm install --save-dev c-wasm-loader
```

Install with yarn:

```bash
yarn add c-wasm-loader --dev
```

This package automatically installs portable emsdk, so you should have cmake only available.

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**[`name`](#name)**|`{String\|Function}`|`[hash].[ext]`|Configure a custom filename template for your file|
|**`regExp`**|`{RegExp}`|`'undefined'`|Let you extract some parts of the file path to reuse them in the `name` property|
|**`outputPath`**|`{String\|Function}`|`'undefined'`|Configure a custom `output` path for your file|
|**`useRelativePath`**|`{Boolean}`|`false`|Should be `true` if you wish to generate a `context` relative URL for each file|
|**[`limit`](#limit)**|`{Number}`|`undefined`|Byte limit to inline compiled files as Data URL|

### `name`

You can configure a custom filename template for your file using the query parameter `name`. For instance, to copy a file from your `context` directory into the output directory retaining the full directory structure, you might use

### `limit`

If the file is greater than the limit (in bytes) the [`file-loader`](https://github.com/webpack-contrib/file-loader) is used by default and all query parameters are passed to it.

The limit can be specified via loader options and defaults to no limit.

<h2 align="center">Usage</h2>

**hello.c**
```c
#include <emscripten/emscripten.h>
 
extern "C" {
  int main(int argc, char ** argv) {
    printf("Hello\n");
  }
   
  int EMSCRIPTEN_KEEPALIVE world() {
    printf("World\n");
  }
}
```

**hello.js**
```js
import hello from './hello.c';

hello().then((module) => {
  module._world();
});
```

**webpack.config.js**
```js
module.exports = {
  externals: {
    fs: true
  },
  module: {
    rules: [
      {
        test: /\.(c|cpp)$/,
        use: {
          loader: 'c-wasm-loader',
          options: {
            outputPath: 'wasm',
            name: '[name]-[hash].[ext]'
          }
        }
      }
    ]
  }
}
```

[npm]: https://img.shields.io/npm/v/c-wasm-loader.svg
[npm-url]: https://www.npmjs.com/package/c-wasm-loader

[node]: https://img.shields.io/node/v/c-wasm-loader.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/david/yhaiovyi/c-wasm-loader.svg
[deps-url]: https://david-dm.org/yhaiovyi/c-wasm-loader

[tests]: https://img.shields.io/travis/yhaiovyi/c-wasm-loader/master.svg
[tests-url]: https://travis-ci.org/yhaiovyi/c-wasm-loader

[builds-url]: https://ci.appveyor.com/project/sokra/webpack/yhaiovyi/c-wasm-loader
[builds]: https://ci.appveyor.com/api/projects/status/github/yhaiovyi/c-wasm-loader?svg=true

[cover]: https://coveralls.io/repos/github/yhaiovyi/c-wasm-loader/badge.svg?branch=master
[cover-url]: https://coveralls.io/github/yhaiovyi/c-wasm-loader?branch=master
