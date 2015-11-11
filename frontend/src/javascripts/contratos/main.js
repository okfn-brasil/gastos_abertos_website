require(['jquery', 'pubsub', 'urlmanager', 'datatable', 'dataform'],
function ($, pubsub, UrlManager, DataTable, DataForm) {

  'use strict';

  // ****************************************************
  //               DATA TABLE FORMATTERS
  // ****************************************************

  function formatObjeto(value, row) {
    // FIXME: Incluir a url para página de detalhe do contrato
    var url = row['txt_file_url'];
    if (url.length > 3)
      return '<a href="' + url + '" target="_blank">' + value + '</a>';
    return value;
  }

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

  function formatFornecedor(values) {
    return values[0] + ' (' + values[1] + ')';
  }

  function formatProcesso(value) {
    return value + '<br/><a href="http://devcolab.each.usp.br/do/?per_page=20&q=%22' + value + '%22&sort=data+asc" target="_blank">Diário Livre</a>';
  }

  function formatId(value, row) {
    var downloadLink = '';
    var url = row['file_url'];
    if (url && url.length > 3)
      downloadLink = '<br/><a href="' + url + '" target="_blank">Download</a>';
    return value + downloadLink
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
        query: null,
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
    //          DATA FORM INITIALIZATION
    // ****************************************************
    var dataFormSearch = window.dataFormSearch = new DataForm('#search-box', {
      params: {
        query: urlManager.getParam('query'),
        cnpj: urlManager.getParam('cnpj'),
      },
      masks : {
        cnpj: { format: '00.000.000/0000-00', placeholder: '__.___.___/____-__' }
      },
      pubsub: pubsub
    });

    var dataFormAdvancedSearch = window.dataFormAdvancedSearch = new DataForm('#advanced-search-box', {
      params: {
        query: urlManager.getParam('query'),
        cnpj: urlManager.getParam('cnpj'),
        orgao: urlManager.getParam('orgao'),
        evento: urlManager.getParam('evento'),
        modalidade: urlManager.getParam('modalidade')
      },
      masks : {
        cnpj: '00.000.000/0000-00'
      },
      pubsub: pubsub
    });

    // ****************************************************
    //          DATA TABLE INITIALIZATION
    // ****************************************************
    try {
      var dataTable = new DataTable('#data-table', {
        url: api_url + '/api/v1/contrato/search',
        rows: [
          { field: 'objeto',                  title: 'Objeto',  position: -1},
          { field: 'content_highlight',       title: 'Excerto', position: 1},
        ],
        columns: [
          { field: 'id',                      title: 'ID'},
          { field: 'valor',                   title: 'Valor (R$)'},
          { field: 'nome_fornecedor&cnpj',    title: 'Fornecedor', param: 'cnpj'},
          { field: 'orgao',                   title: 'Órgão',      param: 'orgao'},
          { field: 'vigencia',                title: 'Vigência (dias)'},
          { field: 'modalidade',              title: 'Modalidade',  param: 'modalidade'},
          { field: 'evento',                  title: 'Evento',     param: 'evento'},
          { field: 'processo_administrativo', title: 'Processo Administrativo'},
          { field: 'licitacao',               title: 'Licitação'},
          { field: 'data_assinatura',         title: 'Assinatura'},
          { field: 'data_publicacao',         title: 'Publicação'},
        ],
        formatters: {
          objeto: formatObjeto,
          data_assinatura: formatDate,
          data_publicacao: formatDate,
          valor: formatCurrency,
          'nome_fornecedor&cnpj': formatFornecedor,
          processo_administrativo: formatProcesso,
          id: formatId
        },
        params: {
          query: urlManager.getParam('query'),
          page: urlManager.getParam('page'),
          per_page_num: urlManager.getParam('per_page_num'),
          cnpj: urlManager.getParam('cnpj'),
          orgao: urlManager.getParam('orgao'),
          evento: urlManager.getParam('evento'),
          modalidade: urlManager.getParam('modalidade'),
          highlight: true
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
