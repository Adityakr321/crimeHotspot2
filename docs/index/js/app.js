// Import data from local sqlite server (Run the python file first)

// layer lists
let stationMarkers = []
let heatLayer = new L.layerGroup()
let areaLayer = new L.layerGroup()

// Define variables for our tile layers.
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

let stationLayer = L.layerGroup(stationMarkers)

// Only one base layer can be shown at a time.
let baseMaps = {
    Street: street,
    Topography: topo
};

let overlayMaps = {
    LAPD: stationLayer,
    Crime: heatLayer,
    Districts: areaLayer
};

// Create the map object
var map = L.map('map', {
    center:[34.0319344,-118.2644802],
    zoom:10,
    layers:[street, stationLayer, heatLayer, areaLayer]
})

L.control.layers(baseMaps, overlayMaps).addTo(map);

// API URLs - ALL USING PORT 5000
var dataUrl = 'http://127.0.0.1:5000/crimedata'
var geoUrl = 'http://127.0.0.1:5000/stations'
var areaUrl = 'http://127.0.0.1:5000/cityareas'

// Load initial crime data when page loads
document.addEventListener("DOMContentLoaded", function() {
    loadInitialData();
});

function loadInitialData() {
    // Load stations and areas first (they're small)
    loadStations();
    loadCityAreas();
    
    // Then load crime data (this might take longer)
    setTimeout(loadCrimeData, 1000);
}

function loadCrimeData() {
    console.log("Loading crime data...");
    d3.json(dataUrl).then(data => {
        console.log("Crime data loaded:", data.length, "records");
        updateHeatmap(data);
    }).catch(error => {
        console.error("Error loading crime data:", error);
    });
}

function loadStations() {
    d3.json(geoUrl).then(data => {
        console.log("Stations loaded");
        data.features.forEach(feature => {
            let coordinates = feature.geometry.coordinates;
            let longitude = coordinates[0];
            let latitude = coordinates[1];
            let station = feature.properties;

            stationMarkers.push(L.marker([latitude,longitude])
                .bindPopup(`<h6>${station.DIVISION}</h6> <hr> <h6>Location: ${station.LOCATION}</h6>`)
                .addTo(stationLayer));
        });
    });
}

function loadCityAreas() {
    d3.json(areaUrl).then(data => {
        console.log("City areas loaded");
        data.features.forEach(feature => {
            if (feature.geometry.coordinates.length === 1) {
                let polyCoordinates = feature.geometry.coordinates[0];
                let fixedCoords = polyCoordinates.map(coord => [coord[1], coord[0]]);
                L.polygon([fixedCoords], {}).addTo(areaLayer);
            }
        });
    });
}

function updateHeatmap(data) {
    // Clear existing heatmap
    heatLayer.clearLayers();
    
    let heatArray = [];
    let maxPoints = 50000; // Limit points for better performance
    
    for (let i = 0; i < Math.min(data.length, maxPoints); i++) {
        let lat = data[i].LAT;
        let lon = data[i].LON;
        if (lat && lon) {
            heatArray.push([lat, lon]);
        }
    }
    
    console.log("Creating heatmap with", heatArray.length, "points");
    
    if (heatArray.length > 0) {
        L.heatLayer(heatArray, {
            radius: 15,  // Slightly smaller radius for dense data
            blur: 25,    // Slightly less blur for dense data
            maxZoom: 17,
            gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        }).addTo(heatLayer);
    }
}

// District selector (same as before)
document.addEventListener("DOMContentLoaded", function () {
    const dropdown1 = document.getElementById("district-selector");
    const dropdownMenu1 = dropdown1.querySelector(".dropdown-menu");
    const dropdownText = dropdown1.querySelector(".btn");

    let districts = ['North Valley','South Valley','West LA','Central','East LA','South LA','Harbor Districts','West Hills'];
    let districtCoordinates = [
        [34.25994983206024,-118.45081865787508],
        [34.176837772589096, -118.49853515625001],
        [34.06950035227694,-118.47691118717194],
        [34.085711502121676,-118.3220672607422],
        [34.091113788749794,-118.21872711181642],
        [33.99556781046533,-118.3042895793915],
        [33.81543900487201,-118.28810244798663],
        [34.21971760306106,-118.65619875490667],
    ];

    districts.forEach(function (name, index) {
        const dropdownItem = document.createElement("a");
        dropdownItem.classList.add("dropdown-item");
        dropdownItem.href = "#";
        dropdownItem.textContent = name;
    
        dropdownItem.addEventListener("click", function () {
            dropdownText.textContent = name;
            if (index < districtCoordinates.length) {
                map.setView(districtCoordinates[index], 12);
            }
        });
        dropdownMenu1.appendChild(dropdownItem);
    });
});

// Crime selector
document.addEventListener("DOMContentLoaded", function () {
    const dropdown1 = document.getElementById("crime-selector");
    const dropdownMenu1 = dropdown1.querySelector(".dropdown-menu");
    const dropdownText = dropdown1.querySelector(".btn");

    let crimes = [ 'ASSAULT', 'ARSON', 'BATTERY', 'BIKE', 'BOMB', 'BUNCO', 'BURGLARY', 'COUNTERFEIT', 'CREDIT CARD', 'CRIMINAL HOMICIDE',  
    'DISTURBING THE PEACE', 'FORGERY', 'EMBEZZLEMENT', 'EXTORTION', 'HUMAN TRAFFICKING', 'INDECENT EXPOSURE', 'KIDNAPPING', 'LEWD', 
    'PICKPOCKET', 'ROBBERY', 'SHOPLIFTING', 'SEX', 'STALKING', 'THEFT', 'TRESPASSING', 'VANDALISM', 'VEHICLE','OTHER'];

    crimes.forEach(function (name) {
        const dropdownItem = document.createElement("a");
        dropdownItem.classList.add("dropdown-item");
        dropdownItem.href = "#";
        dropdownItem.textContent = name;
    
        dropdownItem.addEventListener("click", function () {
            dropdownText.textContent = name;
            let assaultURL;
            
            if (name == 'OTHER') {
                assaultURL = `http://127.0.0.1:5000/crimedata/other/all`;
            } else {
                var noSpaceName = encodeURIComponent(name);
                assaultURL = `http://127.0.0.1:5000/crimedata/${noSpaceName}`;
            }
            
            console.log("Loading crime data from:", assaultURL);
            d3.json(assaultURL).then(data => {
                updateHeatmap(data);
            }).catch(error => {
                console.error("Error loading crime data:", error);
            });
        });
        dropdownMenu1.appendChild(dropdownItem);
    });
});

// Keep your existing chart code here...

