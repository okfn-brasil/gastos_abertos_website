define(['chai', 'sinon', 'pubsub', 'urlmanager'],
function(chai, sinon, pubsub, UrlManager) {
    'use strict';

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
          format: "#{{param1}}/{{param2}}?{{params}}",
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

      describe('Initialization', function() {
        it('should get url from window.location by default', function() {
           delete opts.location
           urlManager = new UrlManager(opts);
           expect(urlManager.location).to.be.equal(window.location);
        });

        it('should append "?{{params}}" to URL format if not present', function() {
          opts.format = "#{{params1}}/{{param2}}";
          urlManager = new UrlManager(opts);
          expect(urlManager.format).to.be.equal("#{{params1}}/{{param2}}?{{params}}");
        });
      });

      describe('Parsers', function() {
        it('should use parsers from initialization options', function() {
          var spy = sinon.spy();
          opts.parsers = {
            param2: spy
          };
          urlManager = new UrlManager(opts);
          locationFake.href = '/base#param1NewValue/param2NewValue';
          urlManager.updateParams();
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith('param2NewValue');
        });

        it('should convert "null" string to null', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          locationFake.href = '/base#null/param2NewValue';
          urlManager.updateParams();
          expect(urlManager.getParam('param1')).to.be.null;
        });

        it('should convert "undefined" string to null', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          locationFake.href = '/base#undefined/param2NewValue';
          urlManager.updateParams();
          expect(urlManager.getParam('param1')).to.be.null;
        });
      });

      describe('onhashchange Event', function() {
        it('should update params values after onhashchange', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          locationFake.href = '/base#param1NewValue';
          window.onhashchange();
          expect(urlManager.getParam('param1')).to.be.equal('param1NewValue');
          expect(urlManager.getParam('param2')).to.be.equal(opts.params.param2);
          expect(urlManager.getParam('param3')).to.be.equal(opts.params.param3);
        });

        it('should update optional params values after onhashchange', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          locationFake.href = '#?param3=param3NewValue';
          window.onhashchange();
          expect(urlManager.getParam('param3')).to.be.equal('param3NewValue');
        });

        it('should use an array for params with multiple values', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          locationFake.href = '/base#param1/param2?param3=firstValue&param3=secondValue';
          window.onhashchange();
          expect(urlManager.getParam('param3')).to.be.deep.equal(['firstValue', 'secondValue']);
        });

        it('should ignore onhashchange if the location.href remains the same', function() {
          var spy = sinon.spy(urlManager, 'broadcast');
          window.onhashchange();
          expect(spy).to.not.have.been.called;
          urlManager.broadcast.restore();
        });
      });

      describe('#setParam', function() {
        it('should update URL', function() {
          locationFake.hash = 'before';
          urlManager.setParam('param1', 'param1NewValue');
          expect(locationFake.hash).to.be.equal('#param1NewValue/bar');
        });

        it('should not update URL if setting the same current value', function() {
          locationFake.hash = 'before';
          urlManager.setParam('param1', opts.params.param1);
          expect(locationFake.hash).to.be.equal('before');
        });

        it('should replace null values by blank string in URL', function() {
          urlManager.setParam('param1', null);
          expect(locationFake.hash).to.be.equal('#/bar');
        });

        it('should join main params array values with "-" in URL', function() {
          urlManager.setParam('param1', ['first', 'second']);
          expect(locationFake.hash).to.be.equal('#first-second/bar');
        });

        it('should use traditional "shallow" serialization to optional params', function() {
          urlManager.setParam('param3', ['first', 'second']);
          expect(locationFake.hash).to.be.equal('#foo/bar?param3=first&param3=second')
        });
      });

      describe('Pub/Sub integration', function() {
        it('should update params values after `PARAMNAME.changed` messages are published', function() {
          expect(urlManager.getParam('param1')).to.be.equal(opts.params.param1);
          pubsub.publishSync('param1.changed', {value: 'param1NewValue'});
          expect(urlManager.getParam('param1')).to.be.equal('param1NewValue');

          expect(urlManager.getParam('param2')).to.be.equal(opts.params.param2);
          pubsub.publishSync('param2.changed', {value: 'param2NewValue'});
          expect(urlManager.getParam('param2')).to.be.equal('param2NewValue');

          expect(urlManager.getParam('param3')).to.be.equal(opts.params.param3);
          pubsub.publishSync('param3.changed', {value: 'param3NewValue'});
          expect(urlManager.getParam('param3')).to.be.equal('param3NewValue');
        });

        it('should update URL after `PARAMNAME.changed` messages are published', function() {
          pubsub.publishSync('param1.changed', {value: 'param1NewValue'});
          expect(locationFake.hash).to.be.equal('#param1NewValue/' + opts.params.param2);
          pubsub.publishSync('param2.changed', {value: 'param2NewValue'});
          expect(locationFake.hash).to.be.equal('#param1NewValue/param2NewValue');
          pubsub.publishSync('param3.changed', {value: 'param3NewValue'});
          expect(locationFake.hash).to.be.equal('#param1NewValue/param2NewValue?param3=param3NewValue');
        });

        it('should publish `PARAMNAME.changed` messages for new values after onhashchange', function() {
          locationFake.href = '/base#param1NewValue?param3=param3NewValue';
          var spy = sinon.spy(pubsub, 'publish');
          window.onhashchange();
          expect(spy).to.have.been.calledTwice;
          expect(spy).to.have.been.calledWith('param1.changed', {value: 'param1NewValue'});
          expect(spy).to.have.been.calledWith('param3.changed', {value: 'param3NewValue'});
          pubsub.publish.restore();
        });
      });
    });
});
