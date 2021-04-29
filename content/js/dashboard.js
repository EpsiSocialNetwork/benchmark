/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 96.7, "KoPercent": 3.3};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.2565, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.214, 500, 1500, "POST"], "isController": false}, {"data": [0.014, 500, 1500, "USER"], "isController": false}, {"data": [0.356, 500, 1500, "REACT"], "isController": false}, {"data": [0.442, 500, 1500, "COMMENT"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1000, 33, 3.3, 4613.028, 75, 43191, 2158.5, 12241.199999999999, 19847.999999999996, 30555.120000000003, 17.337332478024933, 74.11526779677179, 26.61339793837445], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["POST", 250, 4, 1.6, 4442.999999999999, 225, 27132, 2201.5, 11209.6, 16230.05, 21936.100000000017, 4.484465810432661, 44.82997848577528, 7.002598467658033], "isController": false}, {"data": ["USER", 250, 29, 11.6, 10198.396, 763, 43191, 5798.0, 21028.4, 29978.35, 40941.200000000026, 5.779812271697415, 19.64978130635317, 8.108105789348963], "isController": false}, {"data": ["REACT", 250, 0, 0.0, 2030.3039999999994, 191, 16469, 1197.0, 4145.8, 6798.199999999999, 11012.050000000016, 4.759547652591098, 3.825300505939915, 7.548345105281194], "isController": false}, {"data": ["COMMENT", 250, 0, 0.0, 1780.412, 75, 15507, 1283.5, 3855.2000000000003, 5333.899999999999, 11656.410000000009, 4.6569677551552635, 13.502477797906227, 7.4038510794851256], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Read timed out", 25, 75.75757575757575, 2.5], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to post.mignon.chat:443 [post.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, 12.121212121212121, 0.4], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, 12.121212121212121, 0.4], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1000, 33, "Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Read timed out", 25, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to post.mignon.chat:443 [post.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["POST", 250, 4, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to post.mignon.chat:443 [post.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["USER", 250, 29, "Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Read timed out", 25, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to user.mignon.chat:443 [user.mignon.chat/88.99.25.19] failed: Connection timed out: connect", 4, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
