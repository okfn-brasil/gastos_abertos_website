// add_children_to_array = function(array, children) {
//     for (var i = 0; i < children.length; ++i) {
//     // response_data['children'].forEach(function(child){
//         var child = children[i]
//         console.log(i)
//         console.log(child)
//         bar_data = {
//             name: child['name'],
//                 y: i+1,
//                 child_index: i,
//                 drilldown: true,
//             data: [{
//                 // TODO use real value!!!!!!!!!!
//                 // y: child['value'],
//                 y: child['value'],
//                 name: child['name'],
//                 // TODO use real value!!!!!!!!!!
//                 // code: child['code'],
//                 code: child['code'],
//                 child_index: i,
//                 drilldown: true
//             }]
//         };
//         array.push(bar_data)

//             // for (var i = 0; i < drill_var.data.length; ++i) {
//             //     imp_drilldown.data.push({
//             //         y: drill_var.data[i].value,
//             //         name: drill_var.data[i].name,
//             //         code: drill_var.data[i].code,
//             //         drilldown: true
//             //     });
//             // }
//     };
// }


// Create chart
create_bars = function(year_data, initial_level) {
    $('#bars-container').highcharts({
        chart: {
            type: 'bar',
            // events: {
            //     drilldown: function(e) {
            //         get_drilldown(e);
            //     }
            // }
        },
        title: {
            text: 'Receitas Prefeitura de Sao Paulo'
        },
        xAxis: {
            type: 'category'
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
        // stackLabels: {
        //     enabled: true,
        //     style: {
        //         fontWeight: 'bold',
        //         color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
        //     },
        //     formatter: function() {
        //         return number_format(this.total, 2, '.', ',');
        //     }
        // },
        // labels: {
        //     formatter: function() {
        //         return number_format(this.value, 2, '.', ',');
        //     }
        // },
        tooltip: {},
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
        series: [initial_level],
        drilldown: {
            series: year_data
        }
    });
};

$(function() {
    var uriParams = window.location.search.substring(1);
    var query = $.deserialize(uriParams);

    // Get year param
    if (query.hasOwnProperty('year')) {
        year = query.year;
    } else {
        year = '2014'
    }

    if (query.hasOwnProperty('level')) {
        level = query.level;
    } else {
        level = null
    }

    // Load ALL data for a year
    $.ajax({
        type: 'GET',
        url: api_url + '/api/v1/receita/totaldrilldown?year=' + year,
        xhrFields: {
            withCredentials: false
        }
    }).done(function(response_data) {
        year_data = response_data
        if (level == null) {
            initial_level = year_data[0];
        } else {
            initial_level = null
            for (var i = 0; i < year_data.length; ++i) {
                item = year_data[i]
                if (item['id'] == level) {
                    initial_level = item
                    break
                }
            }
            if (initial_level == null) {
                console.log("Coldn't find level: " + level)
                initial_level = year_data[0]
            }
        }
        console.log(year_data)
        create_bars(year_data, initial_level);
    });
});
