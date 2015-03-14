/**
 * This is entry-point for testing with karma-runner and requirejs
 * based on sinpped from: http://karma-runner.github.io/0.12/plus/requirejs.html
 */
(function() {

  var allTestFiles = [];
  var TEST_REGEXP = /test\.js$/;

  var pathToModule = function(path) {
    return path.replace(/^\/base\//, '../../../').replace(/\.js$/, '');
  };

  Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
      // Normalize paths to RequireJS module names.
      allTestFiles.push(pathToModule(file));
    }
  });

  var vendorPath = function(script) {
    return '../../../static/vendor/' + script;
  };

  var nodeModulePath = function(script) {
    return '../../node_modules/' + script;
  };

  var bowerComponentPath = function(script) {
    return '../../bower_components/' + script;
  };

  require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base/frontend/src/javascripts',

    // example of using shim, to load non AMD libraries (such as underscore and jquery)
    paths: {

      'chai': bowerComponentPath('chai/chai'),
      'sinon': bowerComponentPath('sinon/lib/sinon'),
      'sinon-chai': bowerComponentPath('sinon-chai/lib/sinon-chai'),

      'jquery': vendorPath('jquery/js/jquery'),
      'riot': vendorPath('riotjs/js/riot'),
      'pubsub': vendorPath('pubsub-js/js/pubsub'),
      'datatables': vendorPath('datatables/js/jquery.dataTables')
    },

    shim: {
      'chai': {
        exports: 'chai'
      },
      'sinon': {
        exports: 'sinon'
      }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff mocha, as it is asynchronous
    callback: window.__karma__.start
  });

  require(['chai', 'sinon', 'sinon-chai'], function(chai, sinon, sinonChai) {
    chai.use(sinonChai);
  });
})();
