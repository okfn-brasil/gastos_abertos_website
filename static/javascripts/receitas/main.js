$(function () {
    var uriParams = window.location.search.substring(1);
    var query = $.deserialize(uriParams);

    if (query.hasOwnProperty('level')) {
        level = query.level;
    } else {
	get_drilldown = function (e) {
		var chart = e.currentTarget;
		var response_data = $.get('http://localhost:5000/api/v1/receita/total?code=' + e.point.code + '&years=2014&drilldown=true').done(function (resp) {
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
                url: 'http://localhost:5000/api/v1/receita/total?code=1.1.1&code=1.1.2&code=1.2.3&years=2014',
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
