const webpack = require('./helpers/compiler');

jest.setTimeout(5 * 60 * 1000);

describe('Testing loader', () => {
  test('Defaults', async () => {
    const config = {
      loader: {
        test: /.(c|cpp)$/,
        options: {},
      },
    };

    const stats = await webpack('fixture.js', config);
    const { source } = stats.toJson().modules.filter(({ name }) => (name === './hello.c'))[0];

    expect(source).toMatchSnapshot();
  });
});
