(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.election_livestats_page = {

    attach: function (context, settings) {

      // As we are clearly running JavaScript, prepare the scene for the live statistics.
      var statistics = document.createElement("div");
      var noscript = document.getElementById('noscript-statistics');
      statistics.setAttribute('id', 'statistics');
      noscript.parentElement.insertBefore(statistics, noscript);
      noscript.parentElement.removeChild(noscript);

      // Run through the initial data to create the charts for each metric
      initial_data.forEach(function(metric){

        var id = 'section-' + metric.name;
        var section = document.createElement("div");
        section.setAttribute('id', id);

        var title = document.createElement("h2");
        title.textContent = metric.label;
        section.appendChild(title);

        var chart = document.createElement("div");
        chart.classList.add("chart");
        section.appendChild(chart);

        statistics.appendChild(section);

        if(metric.type === "single" || metric.type === "grouped") {

          $(chart).highcharts({
            colors: ['#582c83'],
            credits: false,
            title: false,
            legend: {
              enabled: false
            },
            chart: {
              backgroundColor: 'transparent',
              type: 'bar'
            },
            plotOptions: {
              series: {
                groupPadding: 0
              },
              bar: {
                borderWidth: 0
              }
            },
            tooltip: {
              formatter: function () {
                return this.point.label;
              }
            },
            xAxis: {
              gridLineWidth: 0,
              minorGridLineWidth: 0,
              lineColor: 'transparent',
              tickLength: 0,
              tickInterval: 1,
              type: 'category',
              labels: {
                style: {
                  fontSize: '14px',
                }
              }
            },
            yAxis: {
              gridLineWidth: 0,
              minorGridLineWidth: 0,
              lineColor: 'transparent',
              labels: {
                enabled: false,
              },
              title: false,
              min: 0,
              max: 1,
            },
            series: [{
              data: []
            }]
          });

        }

        update(metric);

      });

      // Set up socket for updating data for this election.
      // `socket_io_url` is set through inline JavaScript included in the
      // page callback.
      try {
        var socket = io.connect(socket_io_url);
        socket.emit('subscribe', election_id);

        // Respond to update packets form the websocket.
        socket.on('update', function(data) {

          update(data);

        });
      } catch (e) {
        $("#statistics").before('<div class="messages error">The live statistics server is currently not running</b>. Please refresh this page for updates!</div>');
      }

      function update(metric) {
        var section = document.getElementById('section-' + metric.name);

        if(metric.type === "single") {
          var height = 80;

          var value = metric.value;
          var total = metric.total;

          // Avoid NaN if the total possible is zero.
          var ratio = (total === 0) ? 0 : value/total;

          var data = [{
            name: ' ',
            label: value + '/' + total + ' (' + Math.round(ratio*100) + '%)',
            y: ratio
          }];

          var chart = $('.chart', section).highcharts()
          chart.series[0].setData(data);
          chart.setSize(chart.chartWidth, height);
        } else if(metric.type === "grouped") {
          var height = 40 * Object.keys(metric.total).length;

          var data = [];

          for(var id in metric.total) {

            var value = metric.value[id];
            var total = metric.total[id].value;

            // Avoid NaN if the total possible is zero.
            var ratio = (total === 0) ? 0 : value/total;

            data.push({
              name: metric.total[id].label,
              label: value + '/' + total + ' (' + Math.round(ratio*100) + '%)',
              y: ratio
            });
          }

          data.sort(function(a, b) {
            if(a.y < b.y) {
              return 1;
            }else if(a.y > b.y) {
              return -1;
            }else{
              return 0;
            }
          });

          var el = $('.chart', section);
          var chart = el.highcharts();
          chart.series[0].setData(data);
          chart.setSize(chart.chartWidth, height);
        } else if(metric.type === "count") {
          section.children[1].textContent = metric.value;
        }


      }

    }

  };

}(jQuery, Drupal));


