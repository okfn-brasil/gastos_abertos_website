require(['jquery', 'pubsub', 'urlmanager', 'datatable', 'superselect'],
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

    // ****************************************************
    //          URL MANAGER INITIALIZATION
    // ****************************************************
    var urlManager = window.urlManager = new UrlManager({
      format: '#{{years}}?{{params}}',
      params: {
        year: [2014],
        page: 0,
        per_page_num: 10,
        ds_orgao: null,
        ds_funcao: null,
        ds_fonte: null
      },
      parsers: {
        year: function(value) {
          return $.map(value.split('-'), function(value) {
            return parseInt(value);
          });
        },
        page: parseInt,
        per_page_num: parseInt
      },
      pubsub: pubsub
    });

    populateYearSelector(urlManager.getParam('year'), SuperSelect);

    // ****************************************************
    //          DATA TABLE INITIALIZATION
    // ****************************************************
    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/execucao/list',
        dataContainer: 'data',
        columns: [
          { field: 'ds_despesa',              title: 'Despesa'},
          { field: 'vl_atualizado',           title: 'Planejado (R$)'},
          { field: 'vl_empenhadoliquido',     title: 'Empenhado (R$)'},
          { field: 'vl_liquidado',            title: 'Liquidado (R$)'},
          { field: 'ds_orgao',                title: 'Orgão',      param: 'ds_orgao'},
          { field: 'ds_funcao',               title: 'Função',     param: 'ds_funcao'},
          { field: 'ds_fonte',                title: 'Fonte',      param: 'ds_fonte'}
        ],
        formatters: {
          vl_atualizado: formatCurrency,
          vl_empenhadoliquido: formatCurrency,
          vl_liquidado: formatCurrency,
        },
        params: {
          year: urlManager.getParam('year'),
          page: urlManager.getParam('page'),
          per_page_num: urlManager.getParam('per_page_num'),
          ds_orgao: urlManager.getParam('ds_orgao'),
          ds_funcao: urlManager.getParam('ds_funcao'),
          ds_fonte: urlManager.getParam('ds_fonte')
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

// Populate selector and prepare its publisher
function populateYearSelector(years, SuperSelect) {
    'use strict';

    $.getJSON(api_url + '/api/v1/execucao/info')
    .done(function(response_data) {
        var yearSelector = $("#year-selector")
        for (var i = 0; i < response_data['data']['years'].length; ++i) {
            var year = response_data['data']['years'][i];
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
          pubsub.subscribe("year.changed", function (event, data) {
            yearSelector.setValue(data.value);
          });

          yearSelector.on('change', function(e, value) {
            pubsub.publish('year.changed', {value: [value]});
            /* alert($this.val()); Uncomment this for demonstration! */
          });

        });
        // ------------------------------------------------------------------------


        // Subscribe to year change
        pubsub.subscribe("year.changed", function (event, data) {
            $("#year-selector").val(data.value)
        })
    });
    $("#year-selector").change(function (e) {
        // Publish year change
        pubsub.publish('year.changed', {value: [e.target.value]})
    })
}

});
