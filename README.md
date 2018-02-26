# c-wasm-loader

<div align="center">
<a title="By Jeremy Kratz (https://github.com/isocpp/logos) [Copyrighted free use], via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File%3AISO_C%2B%2B_Logo.svg"><img height="128" alt="ISO C++ Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/ISO_C%2B%2B_Logo.svg/256px-ISO_C%2B%2B_Logo.svg.png"/></a>
<a title="By Carlos Baraza [CC0], via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File%3AWeb_Assembly_Logo.svg"><img height="128" alt="Web Assembly Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Web_Assembly_Logo.svg/512px-Web_Assembly_Logo.svg.png"/></a>
</div>

[![npm][npm]][npm-url]

[![node][node]][node-url]
[![deps][deps]][deps-url]

Webpack loader that allows you to import C/C++ files as WebAssembly. 

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

hello.then((module) => {
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
