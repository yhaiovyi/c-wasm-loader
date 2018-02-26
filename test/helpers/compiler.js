const del = require('del');
const path = require('path');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');

const moduleAdapter = config => ({
  rules: config.rules || config.loader
    ? [
      {
        test: config.loader.test || /\.c$/,
        use: {
          loader: path.resolve(__dirname, '../..'),
          options: config.loader.options || {},
        },
      },
    ]
    : [],
});

const pluginsAdapter = config => ([].concat(config.plugins || []));

const outputAdapter = config => ({
  path: path.resolve(
    __dirname,
    `../outputs/${config.output ? config.output : ''}`,
  ),
  filename: '[name].bundle.js',
});

module.exports = (fixture, config, options) => {
  // webpack Config
  const updatedConfig = {
    externals: {
      fs: true,
    },
    devtool: config.devtool || 'sourcemap',
    context: path.resolve(__dirname, '..', 'fixtures'),
    entry: `./${fixture}`,
    output: outputAdapter(config),
    module: moduleAdapter(config),
    plugins: pluginsAdapter(config),
  };
  // Compiler Options
  const updatedOptions = {
    output: false,
    ...options,
  };

  if (updatedOptions.output) del.sync(updatedConfig.output.path);

  const compiler = webpack(updatedConfig);

  if (!updatedOptions.output) compiler.outputFileSystem = new MemoryFS();

  return new Promise((resolve, reject) => compiler.run((err, stats) => {
    if (err) reject(err);

    resolve(stats);
  }));
};
