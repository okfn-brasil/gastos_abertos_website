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


  var DataTable = function() { this.init && this.init.apply(this, arguments); };

  DataTable.prototype = {
    init: function(el, opts) {
      this.$el = $(el);
      this.pubSub = opts.pubSub;
      this.url = opts.url;
      this.columns = opts.columns;
      this.dataTablesOpts = opts.options;
      this.params = $.extend({page: null, per_page_num: null}, opts.params);
      this.collectFormatters().createTableHeader().initTable().handleEvents();
      return this;
    },

    collectFormatters: function() {
      this.formatters = {};
      for (var i=0, len=this.columns.length; i<len; i++) {
        if ($.isFunction(this.columns[i].formatter)) {
          this.formatters[this.columns[i].field] = this.columns[i].formatter;
        } else if (this.columns[i].formatter !== undefined) {
          throw new TypeError("formatter should be callable");
        }
      }
      return this;
    },

    createTableHeader: function() {
      var $tr = $('<tr>');
      for (var i=0, len=this.columns.length; i<len; i++) {
        $tr.append($('<th>').text(this.columns[i].title));
      }
      this.$el.append($('<thead>').append($tr));
      return this;
    },

    initTable: function() {
      var page = this.params.page || 0,
          perPageNum = this.params.per_page_num || 10;

      var opts = $.extend({}, this.dataTablesOpts, {
        serverSide: true,
        ajax: this._ajaxRequest.bind(this),
        columns: $.map(this.columns, function(col, i) { return { data: col.field } }),
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
        this.$el.on('page.dt', function () {
          that._publishPageChanged();
        });

        this.$el.on('length.dt', function () {
          that._publishPerPageNumChanged();
          that._publishPageChanged();
        });

        // Subscribe to params changes.
        for (var paramName in this.params) {
          if (this.params.hasOwnProperty(paramName)) {
            (function(paramName) {
              that.pubSub.subscribe(paramName + ":changed", function(evt, content, sender) {
                if (sender != that) {  // Ignore changes published by this instance
                  that.setParam(paramName, content.value);
                }
              });
            })(paramName);
          }
        }
      }
      return this;
    },

    setParam: function(name, value) {
      // `page` and `per_page_num` are special params.
      if (name == 'page') {
        this.table.page(value).draw(false);
      } else if (name == 'per_page_num') {
        this.table.page.len(value).draw(false);
      } else {
        this.params[name] = value;
        this.table.ajax.reload();
        // The current paging position is reset when reloading.
        this._publishPageChanged();
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
        for (var paramName in params) {
          // Remove empty values
          if (params.hasOwnProperty(paramName) &&
               (params[paramName] === undefined || params[paramName] === null)) {
            delete params[paramName];
          }
        }
        url += separator + $.param(params, true);
      }
      return url;
    },

    _formatData: function(data) {
      var formatters = this.formatters;
      for (var i=0, len=data.length; i<len; i++) {  // Iterate rows
        for (var field in formatters) {             // Iterate columns to be formatted
          if (formatters.hasOwnProperty(field) && data[i][field] !== undefined) {
            data[i][field] = formatters[field](data[i][field])
          }
        }
      }
      return data;
    },

    _ajaxRequest: function(data, callback, settings) {
      var that = this;
      var draw = data.draw;
      var params = $.extend({}, this.params, {
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
        if (totalCount === null) {
          // `X-Total-Count` header not present
          totalCount = 10000;
        }
        callback({
          // Ref: http://datatables.net/manual/server-side
          draw: draw,
          recordsTotal: totalCount,
          recordsFiltered: totalCount,
          data: that._formatData(data)
        });
      });
    }

  };


  var PubSub = function() { this.init && this.init.apply(this, arguments); };

  PubSub.prototype = {
    init: function() { this.aggregator = $({}); },
    subscribe: function() { this.aggregator.on.apply(this.aggregator, arguments); },
    unsubscribe: function() { this.aggregator.off.apply(this.aggregator, arguments); },
    publish: function() { this.aggregator.trigger.apply(this.aggregator, arguments); }
  };


  $(function main() {
    var pubSub = window.pubSub = new PubSub();
    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/receita/list',
        columns: [
          { field: 'id',                title: 'ID'},
          { field: 'date',              title: 'Data',      formatter: formatDate },
          { field: 'code',              title: 'Código'},
          { field: 'description',       title: 'Descrição'},
          { field: 'monthly_predicted', title: 'Previsto',  formatter: formatCurrency },
          { field: 'monthly_outcome',   title: 'Realizado', formatter: formatCurrency }
        ],
        // Add all relevant params. This object will be used to subscribe for changes using pubSub.
        // Use `null` or `undefined` for optional params with no initial values.
        params: {
          years: 2014,
          page: 0,
          per_page_num: 10
        },
        // DataTables options
        options: {
          searching: false,
          ordering: false
        },
        pubSub: pubSub,
      });

      // PubSub usage example.

      // pubSub.publish('years:changed', {value: [2012, 2014]});

      pubSub.subscribe('page:changed', function(evt, content, sender) {
        console.log('page: ' + content.value);
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
