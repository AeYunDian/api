const plugins = {}
if (process.env.NODE_ENV === 'production') {
  plugins.cssnano = { preset: 'default' }
}
module.exports = { plugins }
