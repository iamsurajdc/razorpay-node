module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8
  },
  rules: {
    'no-case-declarations': 0,
    'no-useless-escape': 0,
    'no-console': 0,
    'no-unreachable': 0,
    'no-unused-vars': 0,
    'no-dupe-keys': 0,
    'linebreak-style': ['error', 'unix'],
    semi: ['error', 'always'],
    indent: ['error', 2]
  }
};
