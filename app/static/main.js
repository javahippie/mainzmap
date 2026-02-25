var map = L.map('map').setView([49.98026047702005, 8.252620697021486], 13);
var markers = L.layerGroup().addTo(map);

L.tileLayer('https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function loadAllStops(timeOfDay) {
    if(timeOfDay === 'day') {
        document.getElementById('timeOfDayHeadline').innerText = '06:00 - 21:00'
    } else if (timeOfDay === 'night') {
        document.getElementById('timeOfDayHeadline').innerText = '21:00 - 06:00'
    } else {
        document.getElementById('timeOfDayHeadline').innerText = 'Alle Tageszeiten'
    }

    fetch(`/stops?timeOfDay=${timeOfDay}`)
        .then((response) => {
            return response.json()
        })
        .then((json) => {
            markers.clearLayers()
            json.forEach(refreshMap)
        })
}

function refreshMap(stop) {

   if(stop.stop_name === undefined)
        return

    const lat = stop.stop_lat;
    const lon = stop.stop_lon;
    const stop_name = stop.stop_name;

    var marker = L.marker([lat, lon], {
        icon: new L.DivIcon({
            className: 'my-div-icon',
            html: `<div class="stop" style="background-color: ${calculateSpeedColor(stop.fastest_connection)}">` +
                    stop.fastest_connection +
                  `</div>`
        })

    }).addTo(markers);

    marker.bindPopup(
        `<div class="route-popup">` +
            `<h2>${stop_name}</h2>` +
            `<table class="route-table">`+
              `<tr>` +
                `<th>Linie</th>` +
                `<th>Dauer zum Ziel</th>` +
                `<th>Erste Fahrt</th>` +
                `<th>Letzte Fahrt</th>` +
                `<th>Mo</th>` +
                `<th>Di</th>` +
                `<th>Mi</th>` +
                `<th>Do</th>` +
                `<th>Fr</th>` +
                `<th>Sa</th>` +
                `<th>So</th>` +
              `</tr>` +
               stop.routes.map(stopToLi).join(' ') +
            `</table>` +
        `</div>`, {maxWidth: '600px'}
    );
}

function stopToLi({minutes_to_hbf,
                   route_short_name,
                   first_trip,
                   last_trip,
                   monday,
                   tuesday,
                   wednesday,
                   thursday,
                   friday,
                   saturday,
                   sunday}) {
    return `<tr>` +
             `<td>${route_short_name}</td>` +
             `<td style="color:${calculateSpeedColor(minutes_to_hbf)}">${minutes_to_hbf} Minuten</td>` +
             `<td>${seconds_to_format(first_trip)}</td>` +
             `<td>${seconds_to_format(last_trip)}</td>` +
             `<td>${intToCheck(monday)}</td>` +
             `<td>${intToCheck(tuesday)}</td>` +
             `<td>${intToCheck(wednesday)}</td>` +
             `<td>${intToCheck(thursday)}</td>` +
             `<td>${intToCheck(friday)}</td>` +
             `<td>${intToCheck(saturday)}</td>` +
             `<td>${intToCheck(sunday)}</td>` +
           `</tr>`
}

function intToCheck(i) {
    if(i === 1) {
        return '✅';
    } else {
        return '';
    }
}

function calculateSpeedColor(minutes_to_hbf){
    const positiveValue = Math.min(Math.floor(minutes_to_hbf * minutes_to_hbf / 2) , 255);
    const negativeValue = 255 - positiveValue;

    const positiveHex = ('00' + positiveValue.toString(16).toUpperCase()).slice(-2)
    const negativeHex = ('00' + negativeValue.toString(16).toUpperCase()).slice(-2)

    return "#" + positiveHex + negativeHex + "00";
}

function seconds_to_format(seconds) {
    var sec_num = parseInt(seconds, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   > 23) {hours   = hours - 24;}
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
