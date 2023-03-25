module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      files: ['*.test.js'],
      env: {
        jest: true,
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'linebreak-style': 0,
    'import/no-extraneous-dependencies': 0,
  },
};
