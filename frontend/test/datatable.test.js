define(['chai', 'sinon', 'pubsub', 'datatable'],
function(chai, sinon, pubsub, DataTable) {
  'use strict';

  var expect = chai.expect;

  var respond = function(server, url, num, total, id) {
    url = url != null ? url : '/api_url?page=0&per_page_num=10&param1=foo&param2=bar&param3=spam';
    num = num != null ? num : 10;
    total = total != null ? num : 100;
    id = id != null ? id : '';
    var content = '[';
    for (var i=1; i <= num; i++) {
      content += '{ "col1": "' + id + i + ',1", "col2": "' + id + i + ',2", "col3": "' + id + i + ',3" }';
      if (i < num) content += ',';
    }
    content += ']';
    var headers = {
      'Content-Type': 'application/json',
      'X-Total-Count': total
    };
    server.respondWith('GET', url, [ 200, headers, content ]);
  };

  describe('DataTable', function() {
    var opts,
        el,
        parent = $('<div>'),
        dataTable,
        server;

    beforeEach(function() {
      server = sinon.fakeServer.create();

      el = $('<table>');
      parent.append(el);

      opts = {
        url: '/api_url',
        columns: [
          {field: 'col1', title: 'Column 1'},
          {field: 'col2', title: 'Column 2'},
          {field: 'col3', title: 'Column 3'}
        ],
        params: {
          param1: 'foo',
          param2: 'bar',
          param3: 'spam',
          param4: null
        },
        pubsub: pubsub
      };

      respond(server, null, 2);
      dataTable = new DataTable(el, opts);
      server.respond();
    });

    afterEach(function() {
      dataTable.destroy();
      pubsub.clearAllSubscriptions();
      parent.empty();
      server.restore();
    });

    describe('Initialization', function() {
      it('should accept any type of element', function() {
        el = $('<div>');
        expect(function () {
          new DataTable(el, opts)
        }).to.not.throw("'null' is not an object (evaluating 'settings.nTable')")
      });

      it('should create table header', function() {
        var $thead = el.children('thead');
        expect($thead.length).to.be.equal(1);
        expect($thead.find('th').length).to.be.equal(opts.columns.length);
        expect($thead.find('th').eq(0)).to.have.text(opts.columns[0].title);
        expect($thead.find('th').eq(1)).to.have.text(opts.columns[1].title);
        expect($thead.find('th').eq(2)).to.have.text(opts.columns[2].title);
      });

      it('should initialize datatables plugin', function() {
        expect(dataTable.$el).to.have.class('dataTable');
      });

      it('should draw first page', function() {
        el = $('<table>');
        parent = $('<div>').append(el);
        respond(server, null, 2, 2);
        new DataTable(el, opts);
        server.respond();
        expect(el.find('tbody tr').length).to.be.equal(2);
        expect(el.find('tbody tr').eq(0).find('td').first()).to.have.text('1,1');
        expect(el.find('tbody tr').eq(1).find('td').eq(2)).to.have.text('2,3');
        expect(parent.find('.dataTables_info')).to.have.text('Showing 1 to 2 of 2 entries');
      });

      it('should initialize without a pubsub instance', function() {
        opts.pubsub = undefined;
        var dataTable;
        expect(function () {
          dataTable = new DataTable($('<table>'), opts);
        }).to.not.throw("'undefined' is not an object (evaluating 'that.pubsub.subscribe')");
        server.respond();
      });
    });

    describe('Formatters', function() {
      it('should call the defined formatters', function() {
        var spy = sinon.spy();
        opts.formatters = { col1: function (val) { spy(val); return val; } };
        respond(server, null, 2, 2);
        new DataTable($('<table>'), opts);
        server.respond();
        expect(spy).to.have.been.calledTwice;
      });

      it('should ignore formatters for invalid columns', function() {
        var spy = sinon.spy();
        opts.formatters = { bla: spy };
        respond(server, null, 2, 2);
        new DataTable($('<table>'), opts);
        expect(spy).to.not.have.been.called;
        server.respond();
      });

      it('should ignore invalid formatters', function() {
        var spy = sinon.spy();
        opts.formatters = { col1: null };
        respond(server, null, 2, 2);
        new DataTable($('<table>'), opts);
        expect(spy).to.not.have.been.called;
        server.respond();
      });
    });

    describe('Pub/Sub integration', function() {
      it('should publish "page.changed" when paginating', function(done) {
        var spy = sinon.spy(pubsub, 'publish'),
            clock = sinon.useFakeTimers(0);
        el.on('page.dt', function () {
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith('page.changed');
          pubsub.publish.restore();
          done();
        });
        parent.find('a.next').click();
        clock.tick(1);
        clock.restore();
      });

      it('should publish "per_page_num.changed" and "page.changed" when user select the number of items to show', function(done) {
          var spy = sinon.spy(pubsub, 'publish'),
              clock = sinon.useFakeTimers();
          el.on('length.dt', function () {
            expect(spy).to.have.been.calledTwice;
            expect(spy).to.have.been.calledWith('per_page_num.changed');
            expect(spy).to.have.been.calledWith('page.changed');
            pubsub.publish.restore();
            done();
          });
          parent.find('select').change();
          clock.tick(1);
          clock.restore();
      });

      it('should react to "page.changed" message', function() {
        expect(dataTable.getParam('page')).to.be.equal(0);
        pubsub.publishSync('page.changed', { value: 2 });
        expect(dataTable.getParam('page')).to.be.equal(2);
      });

      it('should react to "per_page_num.changed" message', function() {
        expect(dataTable.getParam('per_page_num')).to.be.equal(10);
        pubsub.publishSync('per_page_num.changed', { value: 15 });
        expect(dataTable.getParam('per_page_num')).to.be.equal(15);
      });

      it('should reload after changing the value of a param', function() {
        var len = server.requests.length;
        pubsub.publishSync('param3.changed', { value: 'eggs' });
        expect(server.requests.length).to.be.equal(len + 1);
        server.respond();
      });
    });

    describe('#setParam', function() {
      it('should change "page" without a pubsub instance', function(done) {
        opts.pubsub = undefined;
        dataTable.pubsub = undefined;
        el.on('page.dt', function () {
          expect(dataTable.getParam('page')).to.be.equal(1);
          done();
        });
        expect(function () {
          dataTable.setParam('page', 1);
        }).to.not.throw("'undefined' is not an object (evaluating 'this.pubsub.publish')");
      });

      it('should change "per_page_num" without a pubsub instance', function(done) {
        opts.pubsub = undefined;
        dataTable.pubsub = undefined;
        el.on('length.dt', function () {
          expect(dataTable.getParam('per_page_num')).to.be.equal(15);
          done();
        });
        expect(function () {
          dataTable.setParam('per_page_num', 15);
        }).to.not.throw("'undefined' is not an object (evaluating 'this.pubsub.publish')");
      });

      it('should change a simple param without a pubsub instance', function() {
        opts.pubsub = undefined;
        dataTable.pubsub = undefined;
        expect(dataTable.getParam('param1')).to.not.be.equal('eggs');
        expect(function () {
          dataTable.setParam('param1', 'eggs');
        }).to.not.throw("'undefined' is not an object (evaluating 'this.pubsub.publish')");
        expect(dataTable.getParam('param1')).to.be.equal('eggs');
      });
    });
  });
});
