define(['chai', 'sinon', 'pubsub', 'urlmanager'],
function(chai, sinon, pubsub, UrlManager) {
    var expect = chai.expect;

    describe('UrlManager', function() {
      var opts,
          urlManager,
          locationFake;

      beforeEach(function() {
        locationFake = {
          hash: '',
          href: ''
        };
        opts = {
          format: "#{{param1}}/{{param2}}",
          params: {
            param1: 'foo',
            param2: 'bar',
            param3: 'spam'
          },
          pubsub: pubsub,
          location: locationFake
        };
        urlManager = new UrlManager(opts);
      });

      afterEach(function() {
        pubsub.clearAllSubscriptions();
      });

      describe('#constructor()', function() {
        it('should get url from window.location by default', function() {
           delete opts.location
           urlManager = new UrlManager(opts);
           expect(urlManager.location).to.be.equal(window.location);
        });
      });

      describe('#extractParamsFromUrl()', function() {
        it('should get the correct params', function() {
          locationFake.href = '/base#param1Value/param2Value?param3=param3Value&optionalParam=optionalParamValue';
          expect(urlManager.extractParamsFromUrl()).to.be.deep.equal({
            param1: 'param1Value',
            param2: 'param2Value',
            param3: 'param3Value',
            optionalParam: 'optionalParamValue'
          });
        });

        it('should get default values for missing params', function() {
          locationFake.href = '/base#param1Value';
          expect(urlManager.extractParamsFromUrl()).to.be.deep.equal({
            param1: 'param1Value',
            param2: opts.params.param2,
            param3: opts.params.param3
          });
        });
      });

      describe('Pub/Sub integration', function() {
        it('should subscribe to all `PARAMNAME.changed` messages', function() {
           var spy = sinon.spy(pubsub, 'subscribe');
           urlManager = new UrlManager(opts);
           expect(spy).to.have.been.calledThrice;
           expect(spy).to.have.been.calledWith('param1.changed');
           expect(spy).to.have.been.calledWith('param2.changed');
           expect(spy).to.have.been.calledWith('param3.changed');
           pubsub.subscribe.restore();
        });
      });

    });
});
