define(['chai', 'sinon', 'superselect'],
function(chai, sinon, SuperSelect) {
  'use strict';

  var expect = chai.expect;

  describe('SuperSelect', function() {
    var el,
        parent,
        superSelect;

    beforeEach(function() {
      parent = $('<div>');
      el = $('<select><option value="a">A</option><option value="b">B</option></select>');
      parent.append(el);
      $(document.body).append(parent);

      superSelect = new SuperSelect(el);
    });

    afterEach(function() {
      superSelect.destroy();
      parent.empty().remove();
    });

    describe('Initialization', function() {
      it('should create custom elements', function() {
        var $div = parent.find('.super-styled-select');
        var $items = parent.find('li');
        var $options = el.find('option');

        //expect($div.length).to.be.equal(1);
        expect($items.length).to.be.equal($options.length);
        for (var i = 0, len = $options.length; i < len; i++) {
          expect($items.eq(i)).to.have.text($options.eq(i).text());
        }
      });
    });

    describe('Get and Set value', function() {
      it('should start with the first option value', function() {
        expect(superSelect.getValue()).to.be.equal('a');
      });

      it('should start with the selected option value', function() {
        el = $('<select><option value="a">A</option><option selected="true" value="b">B</option></select>');
        parent.append(el);

        superSelect = new SuperSelect(el);
        expect(superSelect.getValue()).to.be.equal('b');
      });

      it('should get the correct value', function() {
        expect(superSelect.getValue()).to.be.equal('a');
        superSelect.setValue('b');
        expect(superSelect.getValue()).to.be.equal('b');
      });

    });

    describe('Interaction', function() {
      it('should open the list on click', function() {
        expect(parent.find('.super-options')).to.be.hidden;
        parent.find('.super-styled-select').click();
        expect(parent.find('.super-options')).to.be.visible;
      });

      it('should close the list when clicking outsideof it', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        $(document).click();
        expect(parent.find('.super-options')).to.be.hidden;
      });

      it('should change the value and close the list when clicking on option', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        expect(superSelect.getValue()).to.be.equal('a');
        parent.find('li').eq(1).click();
        expect(parent.find('.super-options')).to.be.hidden;
        expect(superSelect.getValue()).to.be.equal('b');
      });

      it('should open when pressing ENTER', function() {
        var $select = parent.find('.super-styled-select');
        $select.focus();
        expect(parent.find('.super-options')).to.be.hidden;
        $select.trigger({type: 'keydown', which: 13, keyCode: 13});
        expect(parent.find('.super-options')).to.be.visible;
      });

      it('should close when pressing ENTER if it is open', function() {
        superSelect.open();
        var $select = parent.find('.super-styled-select');
        $select.focus();
        expect(parent.find('.super-options')).to.be.visible;
        $select.trigger({type: 'keydown', which: 13, keyCode: 13});
        expect(parent.find('.super-options')).to.be.hidden;
      });

      it('should open when pressing SPACE', function() {
        var $select = parent.find('.super-styled-select');
        $select.focus();
        expect(parent.find('.super-options')).to.be.hidden;
        $select.trigger({type: 'keydown', which: 32, keyCode: 32});
        expect(parent.find('.super-options')).to.be.visible;
      });

      it('should change value when pressing UP/DOWN', function() {
        var $select = parent.find('.super-styled-select');
        $select.focus();
        expect(parent.find('.super-options')).to.be.hidden;
        expect(superSelect.getValue()).to.be.equal('a');
        $select.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(parent.find('.super-options')).to.be.hidden;
        expect(superSelect.getValue()).to.be.equal('b');
        $select.trigger({type: 'keydown', which: 38, keyCode: 38});
        expect(superSelect.getValue()).to.be.equal('a');
        expect(parent.find('.super-options')).to.be.hidden;
      });

      it('should navigate through options when pressing UP/DOWN', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        expect(superSelect.getValue()).to.be.equal('a');
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(parent.find('.super-options')).to.be.visible;
        expect(superSelect.getValue()).to.be.equal('b');
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 38, keyCode: 38});
        expect(superSelect.getValue()).to.be.equal('a');
        expect(parent.find('.super-options')).to.be.visible;
      });

      it('should close options when pressing ENTER', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 13, keyCode: 13});
        expect(parent.find('.super-options')).to.be.hidden;
      });

      it('should close options when pressing SPACE', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 32, keyCode: 32});
        expect(parent.find('.super-options')).to.be.hidden;
      });

      it('should close options when pressing ESC', function() {
        superSelect.open();
        expect(parent.find('.super-options')).to.be.visible;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 27, keyCode: 27});
        expect(parent.find('.super-options')).to.be.hidden;
      });
    });

    describe('Events', function() {
      it('should trigger "change" event when clicking on option', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        superSelect.open();
        expect(spy).to.not.have.been.called;
        parent.find('li').eq(1).click();
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith(sinon.match.any, 'b');
      });

      it('should be possible to remove an event handler', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        superSelect.open();
        expect(spy).to.not.have.been.called;
        parent.find('li').eq(1).click();
        expect(spy).to.have.been.calledOnce;
        superSelect.off('change', spy);
        parent.find('li').eq(1).click();
        expect(spy).to.have.been.calledOnce;
      });

      it('should trigger "change" event when pressing UP/DOWN', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        var $select = parent.find('.super-styled-select');
        $select.focus();
        expect(spy).to.not.have.been.called;
        $select.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(spy).to.have.been.calledOnce;
        $select.trigger({type: 'keydown', which: 38, keyCode: 38});
        expect(spy).to.have.been.calledTwice;
        expect(spy.getCall(0)).to.have.been.calledWith(sinon.match.any, 'b');
        expect(spy.getCall(1)).to.have.been.calledWith(sinon.match.any, 'a');
      });

      it('should not trigger "change" event when navigating through options', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        superSelect.open();
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 38, keyCode: 38});
        expect(spy).to.not.have.been.called;
      });

      it('should trigger "change" event when selecting an options pressing ENTER', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        superSelect.open();
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 13, keyCode: 13});
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith(sinon.match.any, 'b');
      });

      it('should not trigger "change" event when closing options pressing ESC', function() {
        var spy = sinon.spy()
        superSelect.on('change', spy);
        superSelect.open();
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 40, keyCode: 40});
        expect(spy).to.not.have.been.called;
        superSelect.$selectedListItem.trigger({type: 'keydown', which: 27, keyCode: 27});
        expect(spy).to.not.have.been.called;
      });
    });
  });

});
