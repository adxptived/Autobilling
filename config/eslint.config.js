module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Event: 'readonly',
        CSS: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-inner-declarations': 'off',
    },
  },
];
