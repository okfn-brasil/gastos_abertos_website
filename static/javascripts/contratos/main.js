require(['jquery', 'pubsub', 'urlmanager', 'datatable'],
function ($, pubsub, UrlManager, DataTable) {

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

  function formatFornecedor(values) {
    return values[0] + ' (' + values[1] + ')';
  }

  function formatProcesso(value) {
    return value + '<br/><a href="http://devcolab.each.usp.br/do/?per_page=20&q=%22' + value + '%22&sort=data+asc">Diário Livre</a>';
  }


  $(function main() {
    // This pubsub object should be used by all objects that will be synced.
    window.pubsub = pubsub;

    // ****************************************************
    //          URL MANAGER INITIALIZATION
    // ****************************************************
    var urlManager = window.urlManager = new UrlManager({
      format: '#?{{params}}',
      params: {
        page: 0,
        per_page_num: 10,
        cnpj: null,
        orgao: null,
        evento: null,
        modalidade: null
      },
      parsers: {
        page: parseInt,
        per_page_num: parseInt
      },
      pubsub: pubsub
    });

    // ****************************************************
    //          DATA TABLE INITIALIZATION
    // ****************************************************
    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/contrato/list',
        columns: [
          { field: 'id',                      title: 'ID'},
          //{ field: 'objeto',                  title: 'Objeto'},
          { field: 'valor',                   title: 'Valor (R$)'},
          { field: 'nome_fornecedor&cnpj',    title: 'Fornecedor', param: 'cnpj'},
          { field: 'orgao',                   title: 'Orgão',      param: 'orgao'},
          { field: 'vigencia',                title: 'Vigência (dias)'},
          { field: 'modalidade',              title: 'Modalidae',  param: 'modalidade'},
          { field: 'evento',                  title: 'Evento',     param: 'evento'},
          { field: 'processo_administrativo', title: 'Processo Administrativo'},
          { field: 'licitacao',               title: 'Licitação'},
          { field: 'data_assinatura',         title: 'Assinatura'},
          { field: 'data_publicacao',         title: 'Publicação'},
        ],
        formatters: {
          data_assinatura: formatDate,
          data_publicacao: formatDate,
          valor: formatCurrency,
          'nome_fornecedor&cnpj': formatFornecedor,
          processo_administrativo: formatProcesso
        },
        params: {
          page: urlManager.getParam('page'),
          per_page_num: urlManager.getParam('per_page_num'),
          cnpj: urlManager.getParam('cnpj'),
          orgao: urlManager.getParam('orgao'),
          evento: urlManager.getParam('evento'),
          modalidade: urlManager.getParam('modalidade')
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
