define(['chai', 'sinon', 'superselect'],
function(chai, sinon, SuperSelect) {
  'use strict';

  var expect = chai.expect;

  describe('SuperSelect', function() {
    var el,
        parent = $('<div>'),
        superSelect;

    beforeEach(function() {
      el = $('<select><option value="a">A</option><option value="b">B</option></select>');
      parent.append(el);

      superSelect = new SuperSelect(el);
    });

    afterEach(function() {
      superSelect.destroy();
      parent.empty();
    });

    describe('Initialization', function() {
      it('should create custom elements', function() {
        var $div = parent.find('div.super-styled-select');
        var $items = parent.find('li');
        var $options = el.find('option');

        expect($div.length).to.be.equal(1);
        expect($items.length).to.be.equal($options.length);
        for (var i = 0, len = $options.length; i < len; i++) {
          expect($items.eq(i)).to.have.text($options.eq(i).text());
        }
      });
    });
  });

});
