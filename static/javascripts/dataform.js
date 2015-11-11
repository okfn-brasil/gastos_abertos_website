define(["jquery", "jqueryMask"], function ($) {

  'use strict';

  // ****************************************************
  //                    DATA FORM
  // ****************************************************
  /* Usage:

      var dataForm = new dataForm('#data-form', {
        // Add all relevant params. This object will be used to subscribe for
        // changes using pubsub. Use `null` or `undefined` for optional params
        // with no initial values.
        params: {
          cnpj: null,
        },
        masks : {
          cnpj: { format: '00.000.000/0000-00', reverse: true, placeholder: '__.___.___/____-__' }
        },
        // The same `pubsub` object used by all components to be synced.
        pubsub: pubsub,
      });
  */

  var DataForm = function() { this.init && this.init.apply(this, arguments); };

  DataForm.prototype = {
    init: function(el, opts) {
      this.pubsub = opts.pubsub;
      this.$el = $(el);
      this.params = $.extend({}, opts.params);
      this.masks = $.extend({}, opts.masks);
      this.getFields().handleEvents();
      return this;
    },

    destroy: function() {
      // TODO: Unsubscribe pub/sub messages
    },

    getFields: function() {
        this.fields = $('input[name], select[name], textarea[name]', this.$el);
        this.submitButtons = $('input[type=submit]', this.$el);
        this.forms = $('form', this.$el);
        this.setupFields();
        this.updateFields();
      return this;
    },

    handleEvents: function() {
      var that = this;

      var onChange = function(evt) {
        var $field = $(this);
        var name = $field.attr('name');
        var value = $field.val();
        if (value != that.params[name]) 
          that.setParam(name, value);
      };
      // There is no submit button. Listen for change events.
      if (this.submitButtons.length == 0)
          this.fields.change(onChange);
      
      this.forms.submit(function() { 
        that.updateParams();  
        return false;
      });

      if (this.pubsub) {
        // Subscribe to params changes.
        $.each(this.params, function(name, value) {
          (function(paramName) {
            that.pubsub.subscribe(paramName + ".changed", function(msg, content) {
              // Ignore changes published by this instance
              if (content.sender != that && content.value != that.getParam(paramName)) {
                that.setParam(paramName, content.value);
              }
            });
          })(name);
        });
      }

      return this;
    },

    setupFields: function() {
      var that = this;
      $.each(this.masks, function(name, mask) {
        var $field = that.fields.filter('[name=' + name + ']');
        if ($.type(mask) === 'string')
          mask = { format: mask };
        var opts = $.extend({}, mask);
        opts.format = undefined;
        $field.mask(mask['format'],  opts)
      });
    },

    updateParams: function() {
      var that = this;
      this.fields.each(function(index, field) {
        var $field = $(field);
        var name = $field.attr('name');
        var value = $field.val();
        if (value != that.params[name]) 
          that.setParam(name, value);
      });
    },

    setParam: function(name, value) {
      if (value == '') value = null;
      this.params[name] = value;
      this.updateField(name);
      this._publishParamChanged(name, value);
      return this;
    },

    getParam: function(name) {
      return this.params[name];
    },

    updateField: function(name) {
      var $field, value;
      $field = this.fields.filter('[name=' + name + ']');
      value = this.params[name];
      if (value == null) value = '';
      $field.val(value);
      return this;
    },

    updateFields: function() {
      var that = this;
      this.fields.each(function(index, field) {
        that.updateField($(field).attr('name'));
      });
      return this;
    },

    _publishParamChanged: function(param, value) {
      if (this.pubsub)
        this.pubsub.publish(param + ".changed", { value: value, sender: this });
    },
  };

  return DataForm;
});

