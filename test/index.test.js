const webpack = require('./helpers/compiler');

describe('Testing loader', () => {
  test('Defaults', async () => {
    const config = {
      loader: {
        test: /.(c|cpp)$/,
        options: {},
      },
    };

    const stats = await webpack('fixture.js', config);
    const { source } = stats.toJson().modules[1];

    expect(source).toMatchSnapshot();
  });
});
