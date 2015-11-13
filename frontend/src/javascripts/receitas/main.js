require(['jquery', 'pubsub', 'urlmanager', 'datatable', 'superselect', 'highcharts', 'drilldown', 'exporting'],
function ($, pubsub, UrlManager, DataTable, SuperSelect) {

  'use strict';

  // ****************************************************
  //               DATA TABLE FORMATTERS
  // ****************************************************

  function formatDate(value) {
    // Format Dates as "dd/mm/yy".
    var date = new Date(value);
    // Add 1 to month value since Javascript numbers months as 0-11.
    return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
  }

  function formatCurrency(value, row, symbol) {
    if (symbol == null) {
      symbol = "";
    } else {
      symbol += "&nbsp;"
    }
    // Format currency values as "R$ 123.456,78".
    var number = new Number(value).toFixed(2)         // Force the length of decimal
                .replace('.', ',')                    // Use comma as decimal mark
                .replace(/\d(?=(\d{3})+\,)/g, '$&.'); // Add points as thousands separator
    return symbol + number;
  }


  $(function main() {
    // This pubsub object should be used by all objects that will be synced.
    window.pubsub = pubsub;

    Highcharts.theme = {
        colors: [
            '#94B51F',
            '#478E4E',
            '#3AA392',
            '#2DBED3',
            '#713999',
            '#B75596',
            '#E01919',
            '#F36136',
            '#F0AA1C'
        ],
        //tooltip: { enabled: false },
        chart: {
            style: {
                padding: "0px",
                margin: "0px"
            },
        },
        title: {
            style: {
                display: "none"
            }
        },
        subtitle: {
            style: {
                display: "none"
            }
        },
    
        legend: {
            itemStyle: {
                font: '9pt Trebuchet MS, Verdana, sans-serif',
                color: 'black'
            },
            itemHoverStyle:{
                color: 'gray'
            }
        }
    };
    
    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);

    // ****************************************************
    //          URL MANAGER INITIALIZATION
    // ****************************************************
    var urlManager = window.urlManager = new UrlManager({
      format: '#{{years}}/{{code}}?{{params}}',
      params: {
        years: [2014],
        code: null,
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

    populateYearSelector(urlManager.getParam('years'), SuperSelect);
    createBarChart();
    populateBarChart(urlManager.getParam('years'), urlManager.getParam('code'));

    // ****************************************************
    //          DATA TABLE INITIALIZATION
    // ****************************************************
    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/receita/list',
        columns: [
          { field: 'id',                title: 'ID'},
          { field: 'date',              title: 'Data'},
          { field: 'code',              title: 'Código'},
          { field: 'description',       title: 'Descrição'},
          { field: 'monthly_predicted', title: 'Previsto (R$)', className: 'col-predicted'},
          { field: 'monthly_outcome',   title: 'Realizado (R$)', className: 'col-outcome'}
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
          //searching: false,
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
// (function (H) {
//     console.log(H)
//     H.wrap(H.Chart.prototype, 'redraw', function (proceed) {

//         // Before the original function
//         // console.log("We are about to draw the graph:", this, proceed, arguments);

//         // Now apply the original function with the original arguments,
//         // which are sliced off this function's arguments
//         proceed.apply(this, Array.prototype.slice.call(arguments, 1));

//         // Add some code after the original function
//         // console.log("We just finished drawing the graph:", this.graph);

//     });
// }(Highcharts));

// Create chart
function createBarChart() {
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
                enabled: false,
                formatter: function () {
                    return this.value;
                }
            }
        },
        yAxis: {
            // min: 0,
            title: {
                text: 'valor (R$)',
                // align: 'high'
            },
            labels: {
                overflow: 'justify',
                formatter: function(){
                    var x = this.value;
                    if (Math.abs(x/1e9) >= 1) {
                        return (x / 1e9) + 'Bi';
                    } else if (Math.abs(x/1e6) >= 1) {
                        return (x / 1e6) + 'Mi';
                    } else if (Math.abs(x/1e3) >= 1) {
                        return (x / 1e3) + 'mil';
                    } else {
                        return x;
                    }
                }
            }
        },
        tooltip: {

            formatter: function() {
                var point = this, series = point.series;
                // return '<b>' + series.name + '</b>: R$ ' + point.y
                return [
                    // '<span style="color:' + series.color + '; font-weight: bold;">', (point.name || series.name), '</span>: ',
                    '<b>' + series.name + '</b>: R$ ',
                    // (!false ? ('<b>x = ' + (point.name || point.x) + ',</b> ') : ''),
                    // '<b>',
                    // (!true ? 'y = ' : ''),
                    Highcharts.numberFormat(point.y, 2, ',', '.'),
                    // '</b>'
                ].join('');
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
                        // Publish code change
                        pubsub.publish('code.changed', {value: [this.options.code]})
                        // setSeries(this.options.code, event.point)
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

    drilldown_cache = {}

    // Subscribe to year change
    pubsub.subscribe("years.changed", function (event, data) {
        populateBarChart(data.value, null)
    })
    // Subscribe to code change
    pubsub.subscribe("code.changed", function (event, data) {
        populateBarChart(null, data.value)
    })
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

    description = drilldown_cache[current_year][level].name
    item = "<li class='bars-breadcrumbs-item'>"+ description + "</li>"
    $("#bars-breadcrumbs-list").prepend(item)

    // avoids this code from exploding in a strange case
    var anti_bomb = 10
    // creates a crumb for upper level
    do {
        upper = getUpperLevel(level)
        if (upper) {
            description = drilldown_cache[current_year][upper].name
            button = "<button class='bars-breadcrumbs-button' data-code='" + upper + "'>" + description + "</button>"
            item = "<li class='bars-breadcrumbs-item'>"+ button + "</li>"
            $("#bars-breadcrumbs-list").prepend(item)
        }
        level = upper
        anti_bomb -= 1
    } while (level && anti_bomb > 0)

    // adds the callback to the buttons, so they change the chart
    $(".bars-breadcrumbs-button").click(function(e) {
        code = (e.target.dataset.code == "BASE") ? "" : e.target.dataset.code
        // Publish code change
        pubsub.publish('code.changed', {value: [code]})
        // setSeries(e.target.dataset.code)
    })
}

// Set displayed series in bar-chart to level
function setSeries(level, point) {
    bar_width = 50
    // bar_chart_width = $(bar_chart.container).width()

    element = drilldown_cache[current_year][level];
    if (element.hasOwnProperty('children')) {
        current_level = level
        bar_chart.setTitle({ text: element.name });
        num_series = bar_chart.series.length
        // Remove all current series
            // if (point) {
            // } else {
        for (var i = 0; i < num_series; ++i) {
            bar_chart.series[0].remove();
        }
            // }

        // Sort in decrescent order
        element.children.sort(function (a, b) {
            return b.data[0] - a.data[0]
        })
        // Add series
        // var t = 1
        for (var i = element.children.length; i >= 0; --i) {
            bar_chart.addSeries(element.children[i], false)
            // if (point && t) {
            //     console.log(point.x)
            //     console.log(point.y)
            //     bar_chart.addSeriesAsDrilldown(point, element.children[i])
            // } else {
            //     bar_chart.addSeries(element.children[i])
            // }
            // t =1
        }
        // for (var i = 0; i < bar_chart.series.length; ++i) {
        //     bar_chart.series[i].options.pointWidth = bar_width
        // }
        var height = 200 + bar_chart.series.length * 65
        // bar_chart.setSize(bar_chart_width, height, false)
        document.getElementById("bars-container").style.height = height + "px"
        // css("height", "100px")

        bar_chart.reflow()
        bar_chart.redraw()
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

// Populate selector and prepare its publisher
function populateYearSelector(years, SuperSelect) {
    'use strict';
    $.getJSON(api_url + '/api/v1/receita/info')
    .done(function(response_data) {
        var yearSelector = $("#year-selector")
        for (var i = 0; i < response_data.length; ++i) {
            var year = response_data[i].year;
            var item = '<option value="' + year + '">' + year + '</option>';
            yearSelector.append(item)
        }
        // Set current year
        // TODO: getting only first year... how to use more?
        if (years) yearSelector.val(years[0])

        // -----------SUPER STYLED SELECT------------------------------------------
        // Iterate over each select element
        $('#year-selector').each(function () {
          var yearSelector = new SuperSelect($(this));

          // Subscribe to year change
          pubsub.subscribe("years.changed", function (event, data) {
            yearSelector.setValue(data.value);
          });

          yearSelector.on('change', function(e, value) {
            pubsub.publish('years.changed', {value: [value]});
            /* alert($this.val()); Uncomment this for demonstration! */
          });

        });
        // ------------------------------------------------------------------------


        // Subscribe to year change
        pubsub.subscribe("years.changed", function (event, data) {
            $("#year-selector").val(data.value)
        })
    });
    $("#year-selector").change(function (e) {
        // Publish year change
        pubsub.publish('years.changed', {value: [e.target.value]})
    })
}

function populateBarChart(years, code) {
    // TODO: use all years? how?
    if (years) current_year = years[0]

    if (code == null || code == "") {
        current_code = 'BASE'
    } else if (code) {
        current_code = code
    }

    bar_chart.showLoading('Carregando...');

    // Look first in cache
    if (drilldown_cache[current_year]) {
        setSeries(current_code)
        bar_chart.hideLoading()
    } else {
        // Load ALL data for a year
        $.getJSON(api_url + '/receita/static/total_by_year_by_code/' + current_year + '.json')
        .done(function(response_data) {
            drilldown_cache[current_year] = response_data
            // initial_code.colorByPoint = true
            setSeries(current_code)
            bar_chart.hideLoading()
        });
    }
}



