const path = require('path');

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      base: path.join(__dirname, 'src'),
    },
  },
};
