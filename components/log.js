console.log('Env:%o,:%o', process.env.NODE_ENV)   // production：生产环境  development：开发环境


module.exports = function log () {
  if (process.env.NODE_ENV === 'production') {
    console = console || {};
    console.log = function () { };
  }
}


