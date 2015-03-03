require(['datatables'], function (datatable) {

  "use strict";


  // ****************************************************
  //                      PUB/SUB
  // ****************************************************
  /* Usage:

      var pubSub = new PubSub();

      function handler(evt, content) {
        console.log('Spam: ' + content);
      }

      pubSub.subscribe('spam', handler);
      pubSub.publish('spam', 'eggs');
      // Will display: "Spam: eggs"

      pubSub.unsubscribe('span', handler);
      pubSub.publish('spam', 'eggs');
      // Will display nothing

  */

  var PubSub = function() { this.init && this.init.apply(this, arguments); };

  PubSub.prototype = {
    init: function() { this.aggregator = $({}); },
    subscribe: function() { this.aggregator.on.apply(this.aggregator, arguments); },
    unsubscribe: function() { this.aggregator.off.apply(this.aggregator, arguments); },
    publish: function() { this.aggregator.trigger.apply(this.aggregator, arguments); }
  };


  // ****************************************************
  //                    DATA TABLE
  // ****************************************************
  /* Usage:

      var dataTable = new DataTable('#data-table', {
        // The API endpoint. Should return an array of objects.
        url: api_url + '/api/v1/receita/list',
        // Define the table columns.
        // Format: [ {field: 'jsonObjectField', title: "Column Title"}, ... ]
        columns: [
          { field: 'id',                title: 'ID'},
          { field: 'date',              title: 'Data'},
          { field: 'code',              title: 'Código'},
          { field: 'description',       title: 'Descrição'},
          { field: 'monthly_predicted', title: 'Previsto'},
          { field: 'monthly_outcome',   title: 'Realizado'}
        ],
        // Functions to format each field value.
        formatters: {
          date: formatDate,
          monthly_predicted: formatCurrency,
          monthly_outcome: formatCurrency
        },
        // Add all relevant params. This object will be used to subscribe for
        // changes using pubSub. Use `null` or `undefined` for optional params
        // with no initial values.
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
        // The same `PubSub` object used by all components to be synced.
        pubSub: pubSub,
      });
      // When the user change the current page or the number of items per page
      // it will publish "page:changed" and "per_page_num:changed", respectively

  */

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
            // Use our ajax request function.
            ajax: this._ajaxRequest.bind(this),
            // Extrac coluns from options.
            columns: $.map(this.columns, function(col) { return {data: col.field} }),
            // set the page and how many items to display.
            pageLength: perPageNum,
            displayStart: (page * perPageNum)
          });
      // Get a reference to DataTables API.
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


  // ****************************************************
  //                    URL MANAGER
  // ****************************************************
  /* Usage:

      var urlManager = new UrlManager({
        // Define the Hash format with the main params positions.
        // The extra params will be treated as query string.
        format: '#{{mainParam1}}/{{mainParam2}}',
        // Add all relevant params. This object will be used to subscribe for
        // changes using pubSub. Use `null` or `undefined` for optional params
        // with no initial values.
        params: {
          mainParam1: "mainParam1DefaultValue",
          mainParam2: "mainParam2DefaultValue",
          extraParam1: 0,
          extraParam2: null
        },
        // Define functions to parse params that are not strings.
        // In this example "extraParam1" is an integer.
        parsers: {
          extraParam1: parseInt
        },
        // The same `PubSub` object used by all components to be synced with the
        // URL params.
        pubSub: pubSub
      });
      // The URL "/#spam/eggs?extraParam1=2&extraParam2=foo" will result in
      // {
      //    mainParam1: "spam",
      //    mainParam2: "eggs",
      //    extraParam1: 2,
      //    extraParam2: "foo"
      // }
      //
      // `pubSub.publish('mainParam1:changed', { value: 'ham' })` will change
      // the URL to "/#ham/eggs?extraParam1=2&extraParam2=foo"
      //
      // Changing any extra param to its default value will remove it from URL.
      //
      // `pubSub.publish('extraParam1:changed', { value: 0 })` will change
      // the URL to "/#ham/eggs?extraParam2=foo"
  */

  var UrlManager = function() { this.init && this.init.apply(this, arguments); };

  UrlManager.prototype = {
    init: function(opts) {
      this.pubSub = opts.pubSub;
      this.format = opts.format;
      this.location = opts.location || window.location;
      this.url = this.location.hash;
      this.parsers = opts.parsers;
      this.defaultParams = $.extend({}, opts.params);
      this.params = $.extend({}, this.defaultParams, this.extractParamsFromUrl());
      this.handleEvents();
      return this;
    },

    handleEvents: function() {
      var that = this;
      // Listen to hashchange event.
      window.onhashchange = function() {
        if (this.location.hash != that.url) {
          that.url = this.location.hash;
          that.publish();
        }
      };
      // Get params from options and listen to each param change notification
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
        this.location.hash = this.createURL();  // Update URL.
      }
      return this;
    },

    getParam: function(name) {
      return this.params[name];
    },

    publish: function() {
      // Broadcast all changes.
      var that = this,
          oldParams = this.params;
      this.params = this.extractParamsFromUrl();
      $.each(this._getDiff(oldParams, this.params), function(name, value) {
        that.pubSub.publish(name + ':changed', [{ value: value }, that]);
      });
      return this;
    },

    extractParamsFromUrl: function() {
      var that = this,
          params = {},
          hash = this.getHash(),              // Get URL hash
          query = this.getQuery().slice(1),   // Get query string
          // Get params from URL hash and query string
          // The URL "/#spam/eggs?foo=bar&bla=ble" will result in
          //  mainParamsValues = ['spam', 'eggs']
          //  extraParams = ['foo=bar', 'bla=ble']
          mainParamsValues = hash == "" ? [] : hash.split('/'),
          extraParams = query == "" ? [] : query.split('&');
      // Extract main params.
      // We get the main params keys from `format` option.
      $.each(this._getMainParamsNames(), function(i, key) {
        var value = mainParamsValues[i];
        if (value !== undefined) {
          if($.isFunction(that.parsers[key])) {
            // Parse the extracted value
            value = that.parsers[key](value);
          }
          params[key] = value;
        }
      });
      // Extract extra params.
      $.each(extraParams, function(i, param) {
        // Separate the extra param key from its value.
        var parts = param.split('='),
            name  = parts[0],
            value = parts[1];
        if (params[name] !== undefined) {
          // Already exist a param with the same key, so create an array.
          params[name] = [params[name]]
        }
        if ($.isFunction(that.parsers[name])) {
          // Parse the extracted value
          value = that.parsers[name](value);
        }
        if ($.isArray(params[name])) {
          params[name].push(value);
        } else {
          params[name] = value;
        }
      });
      // Add default value to params not extracted from url;
      return $.extend({}, this.defaultParams, params);
    },

    createURL: function() {
      var that = this,
          url = this.format,  // Use the `format` option as a template.
          params = $.extend({}, this.params);
      // Interpolate the main params.
      $.each(this.mainParamsNames, function(i, name) {
        url = url.replace('{{' + name + '}}',
              $.isArray(params[name]) ? params[name].join('-') : params[name]);
        delete params[name];
      });
        // Remove the extra with the default values.
      $.each(params, function(name, value) {
        if (value == that.defaultParams[name]) delete params[name];
      });
      // Serialize the extra params and then interpolate.
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

    getQuery: function() {
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

    _getMainParamsNames: function() {
      if (this.mainParamsNames == null) {
        var match = this.format.replace(/\?.*/).match(/{{([^}]*)}}/g);
        this.mainParamsNames = $.map(match, function(param) {
          return param.substring(2, param.length-2);
        });
      }
      return this.mainParamsNames;
    }
  };


  // ****************************************************
  //               DATA TABLE FORMATTERS
  // ****************************************************

  function formatDate(value) {
    // Format Dates as "dd/mm/yy".
    var date = new Date(value);
    // Add 1 to month value since Javascript numbers months as 0-11.
    return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
  }

  function formatCurrency(value) {
    // Format currency values as "R$ 123.456,78".
    var number = new Number(value).toFixed(2)         // Force the length of decimal
                .replace('.', ',')                    // Use comma as decimal mark
                .replace(/\d(?=(\d{3})+\,)/g, '$&.'); // Add points as thousands separator
    return "R$&nbsp;" + number;
  }


  // ****************************************************
  //       PUB/SUB AND DATA TABLE INITIALIZATION
  // ****************************************************

  $(function main() {
    // This pubSub object should be used by all objects that will be synced.
    var pubSub = window.pubSub = new PubSub();

    var urlManager = window.urlManager = new UrlManager({
      format: '#{{years}}/{{code}}?{{params}}',
      params: {
        years: [2013, 2014],
        code: '1',
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
        params: {
          years: urlManager.getParam('years'),
          code: urlManager.getParam('code'),
          page: urlManager.getParam('page'),
          per_page_num: urlManager.getParam('per_page_num')
        },
        // DataTables options.
        // Disable searching and ordering.
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



// ****************************************************
//            BAR CHART
// ****************************************************

// Create chart
function createBarChart(year_data, initial_level) {
    $('#bars-container').highcharts({
        chart: {
            type: 'bar',
            events: {
                // drilldown: function(e) {
                //     split_in_series(e);
                // }
            }
        },
        title: {
            text: 'Receitas Prefeitura de Sao Paulo'
        },
        xAxis: {
            type: 'category',
            labels: {
              enabled: false
            }
        },
        yAxis: {
            // min: 0,
            title: {
                text: 'Valores (R$)',
                // align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        tooltip: {
            formatter: function() {
                return '<b>' + this.series.name + '</b>: R$ ' + this.y
            }
                 },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: false
                }
            },
            series: {
                cursor: 'pointer',
                events: {
                    click: function (event) {
                        setSeries(this.options.code, event.point)
                    }
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [],
        // series: [initial_level],
        // drilldown: {
        //     series: year_data
        // }
    });
    bar_chart = $('#bars-container').highcharts();
    // bar_up_button = $('#bars-up-button')
    // bar_up_button.click(go_level_up)
};

// get upper level for level
function getUpperLevel(level) {
    // If in level '1', '2' or '9'
    if (level.length == 1){
        return 'BASE'
    } else if (level != 'BASE') {
        var levels = level.split('.')
        levels.pop()
        return levels.join('.')
    } else {
        return null
    }
}

function createBreadcrumbs(current_level) {
    level = current_level
    // Remove ALL previous breadcrumbs TODO: this is sub-optimum...
    $(".bars-breadcrumbs-item").remove()
    // avoids this code from exploding in a strange case
    anti_bomb = 10
    // creates a crumb for upper level
    do {
        upper = getUpperLevel(level)        
        if (upper) {
            description = year_data[upper].name
            button = "<button class='bars-breadcrumbs-button' data-code='" + upper + "'>" + description + "</button>"
            item = "<li class='bars-breadcrumbs-item'>"+ button + "</li>"
            $("#bars-breadcrumbs-list").append(item)
        }
        level = upper
        anti_bomb -= 1
    } while (level && anti_bomb > 0)

    // adds the callback to the buttons, so they change the chart
    $(".bars-breadcrumbs-button").click(function(e) {
        setSeries(e.target.dataset.code)
    })
}

// Set displayed series in bar-chart to level
function setSeries(level, point) {
    element = year_data[level];
    if (element.hasOwnProperty('children')) {
        current_level = level
        bar_chart.setTitle({ text: element.name });
        num_series = bar_chart.series.length
        for (var i = 0; i < num_series; ++i) {
            bar_chart.series[0].remove();
        }
        for (var i = element.children.length; i >= 0; --i) {
            bar_chart.addSeries(element.children[i])
            // if (point) {
            //     bar_chart.addSeriesAsDrilldown(point, element.children[i])
            // } else {
            //     bar_chart.addSeries(element.children[i])
            // }
        }
        createBreadcrumbs(current_level)
        // upper_data = year_data[getUpperLevel(current_level)]
        // if (upper_data) {
        //     bar_up_button.text("Subir para: " + upper_data.name)
        //     bar_up_button.show()
        // } else {
        //     bar_up_button.hide()
        // }
    }
}

// // Go to a upper level in bar chart
// function go_level_up() {
//     var upper_level = getUpperLevel(current_level)
//     if (upper_level) {
//         setSeries(upper_level)
//     }
// }

$(function() {
    var uriParams = window.location.search.substring(1);
    var query = $.deserialize(uriParams);
    var year = null

    // Get year param
    if (query.hasOwnProperty('year')) {
        year = query.year;
    } else {
        //TODO: change this...
        year = '2014'
    }

    if (query.hasOwnProperty('level')) {
        level = query.level;
    } else {
        level = null
    }

    // Load ALL data for a year
    $.getJSON(api_url + '/receita/static/total_by_year_by_code/' + year + '.json')
    .done(function(response_data) {
        year_data = response_data
        if (level == null) level = 'BASE';
        // initial_level.colorByPoint = true
        createBarChart();
        setSeries(level)
    });
});
