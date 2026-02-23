var map = L.map('map').setView([49.98026047702005, 8.252620697021486], 13);
var markers = L.layerGroup().addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
            html: `<div class="stop" style="background-color: ${calculateSpeedColor(stop.fastest_connection)}">${stop.fastest_connection}</div>`
        })

    }).addTo(markers);

    marker.bindPopup(`${stop_name} <table><tr><th>Linie</th><th>Dauer zum Ziel</th></tr>${stop.routes.map(stopToLi).join(' ')}</table>`).openPopup();
}

function stopToLi({minutes_to_hbf, route_short_name}) {
    return `<tr><td>${route_short_name}</td><td style="color:${calculateSpeedColor(minutes_to_hbf)}">${minutes_to_hbf} Minuten</td></tr>`
}


function calculateSpeedColor(minutes_to_hbf){
    const positiveValue = Math.min(Math.floor(minutes_to_hbf * minutes_to_hbf / 2) , 255);
    const negativeValue = 255 - positiveValue;

    const positiveHex = ('00' + positiveValue.toString(16).toUpperCase()).slice(-2)
    const negativeHex = ('00' + negativeValue.toString(16).toUpperCase()).slice(-2)

    return "#" + positiveHex + negativeHex + "00";
}