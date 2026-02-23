var map = L.map('map').setView([49.98026047702005, 8.252620697021486], 13);
var markers = L.layerGroup().addTo(map);

L.tileLayer(' \thttps://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function loadAllStops() {
    fetch(`/stops`)
        .then((response) => {
            return response.json()
        })
        .then((json) => {
            markers.clearLayers()
            json.forEach(refreshMap)
        })
}

function refreshMap(stop) {

    L.polygon([[49.8311, 7.94887], [49.8311, 8.4226], [50.0547, 8.4226], [50.0547, 7.94887]], {opacity: 0.5, fill: false}).addTo(map);
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
        stop_name +
        `<table>`+
          `<tr>` +
            `<th>Linie</th>` +
            `<th>Dauer zum Ziel</th>` +
            `<th>Erste Fahrt</th>` +
            `<th>Letzte Fahrt</th>` +
          `</tr>` +
           stop.routes.map(stopToLi).join(' ') +
        `</table>`
    );
}

function stopToLi({minutes_to_hbf, route_short_name, first_trip, last_trip}) {
    return `<tr>` +
             `<td>${route_short_name}</td>` +
             `<td style="color:${calculateSpeedColor(minutes_to_hbf)}">${minutes_to_hbf} Minuten</td>` +
             `<td>${seconds_to_format(first_trip)}</td>` +
             `<td>${seconds_to_format(last_trip)}</td>` +
           `</tr>`
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
    
    if (hours   > 24) {hours   = hours - 24;}
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
