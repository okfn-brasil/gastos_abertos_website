require(['datatables', 'pubsub', 'urlmanager'], function (datatable, pubsub, UrlManager) {

  "use strict";

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
        // changes using pubsub. Use `null` or `undefined` for optional params
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
        // The same `pubsub` object used by all components to be synced.
        pubsub: pubsub,
      });
      // When the user change the current page or the number of items per page
      // it will publish "page.changed" and "per_page_num.changed", respectively

  */

  var DataTable = function() { this.init && this.init.apply(this, arguments); };

  DataTable.prototype = {
    init: function(el, opts) {
      this.$el = $(el);
      this.pubsub = opts.pubsub;
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
      if (this.pubsub) {
        this.$el.on('page.dt',   function () { that._publishPageChanged(); });
        this.$el.on('length.dt', function () {
          that._publishPageChanged();
          that._publishPerPageNumChanged();
        });

        // Subscribe to params changes.
        $.each(this.params, function(name, value) {
          (function(paramName) {
            that.pubsub.subscribe(paramName + ".changed", function(msg, content, sender) {
              // Ignore changes published by this instance
              if (sender != that && content.value != that.getParam(paramName)) {
                that.setParam(paramName, content.value);
              }
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

    getParam: function(name) {
      return this.params[name];
    },

    _publishPageChanged: function() {
      this.params.page = this.table.page();
      this.pubsub.publish("page.changed", { value: this.table.page() }, this);
    },

    _publishPerPageNumChanged: function() {
      this.params.per_page_num = this.table.page.len();
      this.pubsub.publish("per_page_num.changed", { value: this.table.page.len() }, this);
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
        var totalCount = jqXHR.getResponseHeader('X-Total-Count');
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
  //          DATA TABLE INITIALIZATION
  // ****************************************************

  $(function main() {
    // This pubsub object should be used by all objects that will be synced.
    window.pubsub = pubsub;

    var urlManager = window.urlManager = new UrlManager({
      format: '#{{years}}/{{code}}?{{params}}',
      params: {
        years: [2014],
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
      pubsub: pubsub
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
        pubsub: pubsub,
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
