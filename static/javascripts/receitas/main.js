require(['jquery', 'pubsub', 'urlmanager', 'datatable'],
function ($, pubsub, UrlManager, DataTable) {

  "use strict";

  // ****************************************************
  //               DATA TABLE FORMATTERS
  // ****************************************************

  function formatDate(value) {
    // Format Dates as "dd/mm/yy".
    var date = new Date(value);
    // Add 1 to month value since Javascript numbers months as 0-11.
    return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
  }

  function formatCurrency(value, symbol) {
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

    populateYearSelector(urlManager.getParam('years'))
    createBarChart()
    populateBarChart(urlManager.getParam('years'), urlManager.getParam('code'))

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
(function (H) {
    console.log(H)
    H.wrap(H.Chart.prototype, 'redraw', function (proceed) {

        // Before the original function
        console.log("We are about to draw the graph:", this, proceed, arguments);

        // Now apply the original function with the original arguments,
        // which are sliced off this function's arguments
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        // Add some code after the original function
        console.log("We just finished drawing the graph:", this.graph);

    });
}(Highcharts));

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
                    return (this.value / 10e9) + 'bi';
                }
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
    anti_bomb = 10
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
            bar_chart.addSeries(element.children[i])
            // if (point && t) {
            //     console.log(point.x)
            //     console.log(point.y)
            //     bar_chart.addSeriesAsDrilldown(point, element.children[i])
            // } else {
            //     bar_chart.addSeries(element.children[i])
            // }
            // t =1
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

// Populate selector and prepare its publisher
function populateYearSelector(years) {
    $.getJSON(api_url + '/api/v1/receita/info')
    .done(function(response_data) {
        var yearSelector = $("#year-selector")
        for (var i = 0; i < response_data.length; ++i) {
            year = response_data[i].year
            item = '<option value="' + year + '">' + year + '</option>'
            yearSelector.append(item)
        }
        // Set current year
        // TODO: getting only first year... how to use more?
        if (year) yearSelector.val(years[0])


        // -----------SUPER STYLED SELECT------------------------------------------
        // Iterate over each select element
        $('select').each(function () {

            // Cache the number of options
            var $this = $(this),
                numberOfOptions = $(this).children('option').length;

            // Hides the select element
            $this.addClass('s-hidden');

            // Wrap the select element in a div
            $this.wrap('<div class="super-select"></div>');

            // Insert a styled div to sit over the top of the hidden select element
            $this.after('<div class="super-styled-select" role="listbox" tabindex="0"></div>');

            // Cache the styled div
            var $styledSelect = $this.next('div.super-styled-select');

            if (year) {
                $styledSelect.text(years[0]);
            } else {
                // Show the first select option in the styled div
                $styledSelect.text($this.children('option').eq(0).text());
            }

            // Insert an unordered list after the styled div and also cache the list
            var $list = $('<ul />', {
                'class': 'super-options'
            }).insertAfter($styledSelect);

            // Insert a list item into the unordered list for each select option
            for (var i = 0; i < numberOfOptions; i++) {
                $('<li />', {
                    'text': $this.children('option').eq(i).text(),
                    'rel':  $this.children('option').eq(i).val(),
                    'role': 'option',
                    'tabindex': '-1'
                }).appendTo($list);
            }

            // Cache the list items
            var $listItems = $list.children('li');

            var openList = function (e) {
                e.stopPropagation();
                $('div.super-styled-select.active').each(function () {
                    $(this).removeClass('active').next('ul.super-options').hide();
                });
                $(this).toggleClass('active').next('ul.super-options').toggle();
                $(this).attr('aria-expanded', true);
                $selectedListItem.focus();
            };

            var closeList = function () {
                $styledSelect.removeClass('active');
                $styledSelect.attr('aria-expanded', false);
                $list.hide();
            };

            var toggleList = function() {
              if($styledSelect.hasClass('active')) {
                closeList.apply(this, arguments);
              } else {
                openList.apply(this, arguments)
              }
            };

            var listPublishChanged = function() {
              pubsub.publish('years.changed', {value: [$styledSelect.text()]});

              /* alert($this.val()); Uncomment this for demonstration! */
            };

            var updateList = function() {
              $listItems.removeClass('selected').removeAttr('aria-selected');
              $selectedListItem.addClass('selected').attr('aria-selected', true);
              $styledSelect.text($selectedListItem.text());
              $this.val($selectedListItem.attr('rel'));
            };

            var $selectedListItem;
            var setListValue = function(value) {
              $selectedListItem = $listItems.filter(function() { return $(this).text() == value; });
              updateList();
            };

            // Show the unordered list when the styled div is clicked (also hides it if the div is clicked again)
            $styledSelect.click(openList);

            // Keys values
            var ENTER = 13;
            var SPACE = 32;
            var DOWN = 40;
            var UP = 38;

            // Toggle the unordered list when the styled div is focused and user presses ENTER or SPACE
            // or change the selected item when user presses UP or DOWN
            $styledSelect.keydown(function(e) {
              e.stopPropagation();

              switch (e.which) {
                case ENTER:
                case SPACE:
                  // Toggle the items list
                  e.preventDefault();
                  toggleList.apply(this, arguments);
                  break;
                case UP:
                case DOWN:
                  // Navigate
                  e.preventDefault();
                  var index = $listItems.index($selectedListItem);
                  if (e.which == DOWN && index < $listItems.length - 1) index++;
                  if (e.which == UP && index > 0) index--;
                  if (!~index) index = 0;

                  $selectedListItem = $listItems.eq(index);
                  updateList();

                  listPublishChanged();
                  break;
              };
            });

            // Navigate through the list items
            $listItems.keydown(function(e) {
              e.stopPropagation();

              switch (e.which) {
                case ENTER:
                case SPACE:
                  e.preventDefault();
                  closeList();
                  $styledSelect.focus();
                  listPublishChanged();
                  break;
                case UP:
                case DOWN:
                  e.preventDefault();
                  var index = $listItems.index($selectedListItem);
                  if (e.which == DOWN && index < $listItems.length - 1) index++;
                  if (e.which == UP && index > 0) index--;
                  if (!~index) index = 0;

                  $selectedListItem = $listItems.eq(index);
                  updateList();
                  $selectedListItem.focus();

                  break;
              };
            });

            // Hides the unordered list when a list item is clicked and updates the styled div to show the selected list item
            // Updates the select element to have the value of the equivalent option
            $listItems.click(function (e) {
                e.stopPropagation();
                setListValue($(this).text());
                closeList();

                listPublishChanged();
            });

            // Hides the unordered list when clicking outside of it
            $(document).click(closeList);

            // Subscribe to year change
            pubsub.subscribe("years.changed", function (event, data) {
              setListValue(data.value);
            });

            // Set the initial value
            setListValue($this.val());

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
    tooltip: { enabled: false },
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
