require(['datatables'], function (datatable) {

  "use strict";


  function formatDate(value) {
    var date = new Date(value);
    // Add 1 to month value since Javascript numbers months as 0-11.
    return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
  }

  function formatCurrency(value) {
    var number = new Number(value).toFixed(2)         // Force the length of decimal
                .replace('.', ',')                    // Use comma as decimal mark
                .replace(/\d(?=(\d{3})+\,)/g, '$&.'); // Add points as thousands separator
    return "R$&nbsp;" + number;
  }


  var PubSub = function() { this.init && this.init.apply(this, arguments); };

  PubSub.prototype = {
    init: function() { this.aggregator = $({}); },
    subscribe: function() { this.aggregator.on.apply(this.aggregator, arguments); },
    unsubscribe: function() { this.aggregator.off.apply(this.aggregator, arguments); },
    publish: function() { this.aggregator.trigger.apply(this.aggregator, arguments); }
  };


  var DataTable = function() { this.init && this.init.apply(this, arguments); };

  DataTable.prototype = {
    init: function(el, opts) {
      this.$el = $(el);
      this.pubSub = opts.pubSub;
      this.url = opts.url;
      this.columns = opts.columns;
      this.dataTablesOpts = opts.options;
      this.params = $.extend({page: null, per_page_num: null}, opts.params);
      this.formatters = opts.formatters;
      this.createTableHeader().initTable().handleEvents();
      return this;
    },

    createTableHeader: function() {
      var $tr = $('<tr>');
      $.each(this.columns, function(i, column) {
        $tr.append($('<th>').text(column.title));
      });
      this.$el.append($('<thead>').append($tr));
      return this;
    },

    initTable: function() {
      var page = this.params.page || 0,
          perPageNum = this.params.per_page_num || 10,
          opts = $.extend({}, this.dataTablesOpts, {
            serverSide: true,
            ajax: this._ajaxRequest.bind(this),
            columns: $.map(this.columns, function(col) { return {data: col.field} }),
            pageLength: perPageNum,
            displayStart: (page * perPageNum)
          });
      this.table = this.$el.dataTable(opts).api();
      return this;
    },

    handleEvents: function() {
      var that = this;
      // Publish changes on `page` and `per_page_num` params.
      if (this.pubSub) {
        this.$el.on('page.dt',   function () { that._publishPageChanged(); });
        this.$el.on('length.dt', function () {
          that._publishPageChanged();
          that._publishPerPageNumChanged();
        });

        // Subscribe to params changes.
        $.each(this.params, function(name, value) {
          (function(paramName) {
            that.pubSub.subscribe(paramName + ":changed", function(evt, content, sender) {
              // Ignore changes published by this instance
              if (sender != that) that.setParam(paramName, content.value);
            });
          })(name);
        });
      }
      return this;
    },

    setParam: function(name, value) {
      // `page` and `per_page_num` are special params.
      if (name == 'page') {
        this.table.page(parseInt(value)).draw(false);
      } else if (name == 'per_page_num') {
        this.table.page.len(parseInt(value)).draw(false);
      } else {
        this.params[name] = value;
        this.table.ajax.reload(null, false);
      }
      return this;
    },

    _publishPageChanged: function() {
      this.params.page = this.table.page();
      this.pubSub.publish("page:changed", [{ value: this.table.page() }, this]);
    },

    _publishPerPageNumChanged: function() {
      this.params.per_page_num = this.table.page.len();
      this.pubSub.publish("per_page_num:changed", [{ value: this.table.page.len() }, this]);
    },

    _createUrl: function(url, params) {
      var separator = '?';
      if (params) {
        params = $.extend({}, params)
        $.each(params, function(key, param) {
          if (param == null) delete params[key];  // Remove empty values
        });
        url += separator + $.param(params, true);
      }
      return url;
    },

    _formatData: function(data) {
      var formatters = this.formatters;
      $.each(data, function(i, row) {
        $.each(formatters, function(column, formatter) {
          if (row[column] !== undefined) row[column] = formatter(row[column]);
        });
      });
      return data;
    },

    _ajaxRequest: function(data, callback, settings) {
      var that = this,
          draw = data.draw,
          params = $.extend({}, this.params, {
            per_page_num: data.length,
            page: (data.start / data.length)
          });

      $.ajax({
        type: 'GET',
        url: this._createUrl(this.url, params),
        xhrFields: { withCredentials: false }
      })
      .done(function(data, textStatus, jqXHR) {
        var totalCount = jqXHR.getResponseHeader('x-total-count');
        if (totalCount === null) {  // `X-Total-Count` header not present
          totalCount = 10000;
        }
        callback({  // Ref: http://datatables.net/manual/server-side
          draw: draw,
          recordsTotal: totalCount,
          recordsFiltered: totalCount,
          data: that._formatData(data)
        });
      });
    }

  };


  var HistoryManager = function() { this.init && this.init.apply(this, arguments); };

  HistoryManager.prototype = {
    init: function(opts) {
      this.pubSub = opts.pubSub;
      this.format = opts.format;
      this.location = opts.location || window.location;
      this.parsers = opts.parsers;
      this._extractMainParamsNames();
      this.defaultParams = $.extend({}, opts.params);
      this.params = $.extend({}, this.defaultParams, this.extractParams());
      this.handleEvents();
      return this;
    },

    handleEvents: function() {
      var that = this;
      window.onhashchange = function() {
        if (this.location.hash != that.createURL()) that.update();
      };
      $.each(this.params, function(name, value) {
        (function(paramName) {
          that.pubSub.subscribe(paramName + ":changed", function(evt, content, sender) {
            // Ignore changes published by this instance
            if (sender != that) that.setParam(paramName, content.value);
          });
        })(name);
      })
      return this;
    },

    setParam: function(name, value) {
      if (this.params[name] != value) {
        this.params[name] = value;
        this.location.hash = this.createURL();  // Update URL fragment.
      }
      return this;
    },

    getParam: function(name) {
      return this.params[name];
    },

    update: function() {
      var that = this,
          oldParams = this.params;
      this.params = this.extractParams();
      $.each(this._getDiff(oldParams, this.params), function(name, value) {
        that.pubSub.publish(name + ':changed', [{ value: value }, that]);
      });
      return this;
    },

    extractParams: function() {
      var that = this,
          params = {},
          hash = this.getHash(),
          search = this.getSearch().slice(1),
          mainParamsValues = hash == "" ? [] : hash.split('/'),
          extraParams = search == "" ? [] : search.split('&');
      // Extract main params
      $.each(this.mainParamsNames, function(i, key) {
        var value = mainParamsValues[i];
        if (value !== undefined) {
          if($.isFunction(that.parsers[key])) {
            value = that.parsers[key](value);
          }
          params[key] = value;
        }
      });
      // Extract extra params
      $.each(extraParams, function(i, param) {
        var parts = param.split('='),
            name  = parts[0], value = parts[1];
        if (params[name] !== undefined) {
          // Already exist a param with current key, so create an array.
          params[name] = [params[name]]
        }
        if ($.isFunction(that.parsers[name])) {
          value = that.parsers[name](value);
        }
        if ($.isArray(params[name])) {
          params[name].push(value);
        } else {
          params[name] = value;
        }
      });
      return $.extend({}, this.defaultParams, params);
    },

    createURL: function() {
      var that = this,
          url = this.format,
          params = $.extend({}, this.params);
      $.each(this.mainParamsNames, function(i, name) {
        url = url.replace('{{' + name + '}}',
              $.isArray(params[name]) ? params[name].join('-') : params[name]);
        delete params[name];
      });
      $.each(params, function(name, value) {
        // Remove unmodified params.
        if (value == that.defaultParams[name]) delete params[name];
      });
      var serializedParams = $.param(params, true);
      if (serializedParams == '') {
        url = url.replace('?{{params}}', '');
      } else {
        if (url.indexOf('{{params}}') != -1) {
          url = url.replace('{{params}}', serializedParams);
        } else {
          url += '?' + serializedParams;
        }
      }
      return url;
    },

    getSearch: function() {
      var match = this.location.href.match(/\?.+/);
      return match ? match[0].replace(/#.*/, '') : '';
    },

    getHash: function(window) {
      var match = this.location.href.match(/#(.*)$/);
      return match ? match[1].replace(/\?.*/, '') : '';
    },

    _getDiff: function(oldParams, newParams) {
      var newParamsKeys = $.map(newParams, function(o, key) { return key; }),
          oldParamsKeys = $.map(oldParams, function(o, key) { return key; }),
          paramsDiff = {};
      $.each($.unique(newParamsKeys.concat(oldParamsKeys)), function(i, key) {
        if(JSON.stringify(newParams[key]) != JSON.stringify(oldParams[key])) {
          paramsDiff[key] = newParams[key];
        }
      })
      return paramsDiff;
    },

    _extractMainParamsNames: function() {
      var match = this.format.replace(/\?.*/).match(/{{([^}]*)}}/g);
      this.mainParamsNames = $.map(match, function(param) {
        return param.substring(2, param.length-2);
      });
      return this;
    }
  };


  $(function main() {
    var pubSub = window.pubSub = new PubSub();

    var historyManager = window.historyManager = new HistoryManager({
      format: '#{{years}}/{{code}}?{{params}}',
      // Add all relevant params. This object will be used to subscribe for changes using pubSub.
      // Use `null` or `undefined` for optional params with no initial values.
      params: {
        years: [2013, 2014],
        code: '1.1.1',
        page: 0,
        per_page_num: 10
      },
      parsers: {
        years: function(value) {
          return $.map(value.split('-'), function(value) {
            return parseInt(value);
          });
        },
        page: parseInt,
        per_page_num: parseInt
      },
      pubSub: pubSub
    });

    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/receita/list',
        columns: [
          { field: 'id',                title: 'ID'},
          { field: 'date',              title: 'Data'},
          { field: 'code',              title: 'Código'},
          { field: 'description',       title: 'Descrição'},
          { field: 'monthly_predicted', title: 'Previsto'},
          { field: 'monthly_outcome',   title: 'Realizado'}
        ],
        formatters: {
          date: formatDate,
          monthly_predicted: formatCurrency,
          monthly_outcome: formatCurrency
        },
        // Add all relevant params. This object will be used to subscribe for changes using pubSub.
        // Use `null` or `undefined` for optional params with no initial values.
        params: {
          years: historyManager.getParam('years'),
          page: historyManager.getParam('page'),
          per_page_num: historyManager.getParam('per_page_num')
        },
        // DataTables options
        options: {
          searching: false,
          ordering: false
        },
        pubSub: pubSub,
      });

    } catch(e) {
      console && console.error('Could not create DataTable:', e)
    }
  });

});



$(function () {
    var uriParams = window.location.search.substring(1);
    var query = $.deserialize(uriParams);

    if (query.hasOwnProperty('level')) {
        level = query.level;
    } else {
	get_drilldown = function (e) {
		var chart = e.currentTarget;
		var response_data = $.get(api_url + '/api/v1/receita/total?code=' + e.point.code + '&years=2014&drilldown=true').done(function (resp) {
			if (resp.data) {
				var drill_var = resp;
				var imp_drilldown = {id: e.point.code, data:[]};
				for (var i = 0; i < drill_var.data.length; ++i) {
					imp_drilldown.data.push({y: drill_var.data[i].value,
								 name: drill_var.data[i].name,
								 code: drill_var.data[i].code,
								 drilldown: true});
				}
				chart.addSeriesAsDrilldown(e.point, imp_drilldown);
			}
		});

	}

        impostos_request = $.ajax({
                type: 'GET',
                url: api_url + '/api/v1/receita/total?code=1.1.1&code=1.1.2&code=1.2.3&years=2014',
                xhrFields: {
                    withCredentials: false
                }
            }).done(function (response_data) {
                impostos = {name: response_data['data'][0]['name'],
			    data:[{y: response_data['data'][0]['value'],
                            	   name: response_data['data'][0]['name'],
			    	   code: response_data['data'][0]['code'],
 			    	   drilldown: true
                            	   }]
			    };

                taxas = {name: response_data['data'][1]['name'],
			 data: [{y: response_data['data'][1]['value'],
                          	 name: response_data['data'][1]['name'],
			 	 code: response_data['data'][1]['code'],
 			 	 drilldown: true
                            }]
			};

                contrib = {name: response_data['data'][2]['name'],
			    data: [{y: response_data['data'][2]['value'],
                            name: response_data['data'][2]['name'],
			    code: response_data['data'][2]['code'],
 			    drilldown: true
                            }]};

                create_bars();
            });

    }

    create_bars = function () {
        $('#bars-container').highcharts({
            chart: {
                type: 'bar',
		events: {
			drilldown: function (e) {
				get_drilldown(e);
			}
		}

            },
            title: {
                text: 'Receitas Prefeitura de Sao Paulo'
            },
            xAxis: {
		type: 'category'
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'R$',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [impostos, taxas, contrib]
        });
    };
});
