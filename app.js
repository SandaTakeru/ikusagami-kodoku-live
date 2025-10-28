// Ikusagami Kodoku Live - Interactive Map Application
// No build tools required - runs directly in browser

(function() {
    'use strict';

    // GeoJSON data for the Tokaido Road route
    const tokaidoRoute = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": "Tokaido Road",
                "description": "The historic road connecting Edo to Kyoto"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [139.7690, 35.6812], // Edo (Tokyo)
                    [139.6380, 35.4437], // Kawasaki
                    [139.6217, 35.3845], // Kanagawa
                    [139.6500, 35.3100], // Totsuka
                    [139.6200, 35.2700], // Fujisawa
                    [139.4830, 35.3273], // Hiratsuka
                    [139.1538, 35.3362], // Odawara
                    [139.0710, 35.1887], // Hakone
                    [138.9108, 35.1027], // Mishima
                    [138.8530, 35.0300], // Numazu
                    [138.5600, 34.9750], // Fuji
                    [138.3828, 34.9706], // Kambara
                    [138.3794, 34.9706], // Yui
                    [138.3833, 34.9761], // Okitsu
                    [138.3861, 34.9833], // Ejiri
                    [138.3828, 34.9761], // Fuchū
                    [138.1881, 34.9733], // Mariko
                    [138.1188, 34.9769], // Okabe
                    [138.0544, 34.9519], // Fujieda
                    [137.9250, 34.8464], // Shimada
                    [137.8694, 34.7983], // Kanaya
                    [137.9661, 34.8397], // Nissaka
                    [137.9661, 34.7969], // Kakegawa
                    [137.7342, 34.7689], // Fukuroi
                    [137.7342, 34.7544], // Mitsuke
                    [137.7342, 34.7094], // Hamamatsu
                    [137.4972, 34.7631], // Maisaka
                    [137.4972, 34.6978], // Arai
                    [137.3906, 34.7300], // Shirasuka
                    [137.2806, 34.7831], // Futagawa
                    [137.3911, 34.7683], // Yoshida
                    [137.1106, 34.8917], // Goyu
                    [137.1781, 34.8528], // Akasaka
                    [137.1561, 34.8933], // Fujikawa
                    [137.1561, 34.8933], // Okazaki
                    [137.0528, 35.0270], // Chiryū
                    [136.9066, 35.1802], // Narumi
                    [136.9066, 35.1802], // Miya (Nagoya)
                    [136.7581, 35.0272], // Kuwana
                    [136.5858, 34.9647], // Yokkaichi
                    [136.5089, 34.8811], // Ishiyakushi
                    [136.5256, 34.7297], // Shōno
                    [136.5256, 34.7297], // Kameyama
                    [136.3781, 34.6667], // Seki
                    [136.1856, 34.6872], // Sakashita
                    [136.1089, 34.7906], // Tsuchiyama
                    [136.0289, 34.8306], // Minakuchi
                    [135.9642, 35.0044], // Ishibe
                    [135.8358, 35.0200], // Kusatsu
                    [135.7581, 35.0117], // Ōtsu
                    [135.7681, 35.0117], // Kyoto
                ]
            }
        }]
    };

    // GeoJSON data for station towns along the Tokaido
    const stations = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Edo (Tokyo)",
                    "number": 1,
                    "description": "Starting point of the Tokaido. The Shogun's capital.",
                    "type": "major"
                },
                "geometry": {"type": "Point", "coordinates": [139.7690, 35.6812]}
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Hakone",
                    "number": 10,
                    "description": "Famous checkpoint in the mountains. Strategic location.",
                    "type": "checkpoint"
                },
                "geometry": {"type": "Point", "coordinates": [139.0710, 35.1887]}
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Hamamatsu",
                    "number": 29,
                    "description": "Castle town, an important stop along the route.",
                    "type": "major"
                },
                "geometry": {"type": "Point", "coordinates": [137.7342, 34.7094]}
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Nagoya",
                    "number": 41,
                    "description": "Major castle town and commercial center.",
                    "type": "major"
                },
                "geometry": {"type": "Point", "coordinates": [136.9066, 35.1802]}
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Ōtsu",
                    "number": 53,
                    "description": "Last station before Kyoto. Lakeside town.",
                    "type": "major"
                },
                "geometry": {"type": "Point", "coordinates": [135.7581, 35.0117]}
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Kyoto",
                    "number": 54,
                    "description": "The Imperial capital. Final destination.",
                    "type": "major"
                },
                "geometry": {"type": "Point", "coordinates": [135.7681, 35.0117]}
            }
        ]
    };

    // Event data for the Kodoku competition
    const events = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "title": "The Beginning",
                    "date": "Day 1 - Edo",
                    "location": "Edo (Tokyo)",
                    "description": "Twenty skilled warriors gather at the Nihonbashi bridge in Edo to begin the deadly Kodoku competition. Only one will survive the journey to Kyoto.",
                    "importance": "high"
                },
                "geometry": {"type": "Point", "coordinates": [139.7690, 35.6812]}
            },
            {
                "type": "Feature",
                "properties": {
                    "title": "Mountain Ambush",
                    "date": "Day 3 - Hakone",
                    "location": "Hakone Pass",
                    "description": "The first major confrontation occurs at the treacherous Hakone checkpoint. Three warriors fall in the mountain mists.",
                    "importance": "high"
                },
                "geometry": {"type": "Point", "coordinates": [139.0710, 35.1887]}
            },
            {
                "type": "Feature",
                "properties": {
                    "title": "Duel at Dawn",
                    "date": "Day 7 - Hamamatsu",
                    "location": "Hamamatsu Castle Town",
                    "description": "A formal duel between two former allies. The betrayal marks a turning point in the competition.",
                    "importance": "medium"
                },
                "geometry": {"type": "Point", "coordinates": [137.7342, 34.7094]}
            },
            {
                "type": "Feature",
                "properties": {
                    "title": "The Alliance Forms",
                    "date": "Day 10 - Nagoya",
                    "location": "Nagoya",
                    "description": "The remaining five warriors form an uneasy alliance, but trust is in short supply.",
                    "importance": "medium"
                },
                "geometry": {"type": "Point", "coordinates": [136.9066, 35.1802]}
            },
            {
                "type": "Feature",
                "properties": {
                    "title": "The Final Confrontation",
                    "date": "Day 14 - Ōtsu",
                    "location": "Ōtsu",
                    "description": "By the shores of Lake Biwa, the alliance crumbles. Only two warriors remain standing.",
                    "importance": "high"
                },
                "geometry": {"type": "Point", "coordinates": [135.7581, 35.0117]}
            },
            {
                "type": "Feature",
                "properties": {
                    "title": "Victory",
                    "date": "Day 15 - Kyoto",
                    "location": "Kyoto",
                    "description": "The last samurai standing reaches Kyoto. The Kodoku competition concludes, but at what cost?",
                    "importance": "high"
                },
                "geometry": {"type": "Point", "coordinates": [135.7681, 35.0117]}
            }
        ]
    };

    // Application state
    let map = null;
    let routeVisible = true;

    // Initialize the application
    function init() {
        initMap();
        initTimeline();
        initEventListeners();
    }

    // Initialize the map
    function initMap() {
        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }
                },
                layers: [{
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                    minzoom: 0,
                    maxzoom: 19
                }]
            },
            center: [137.5, 35.0],
            zoom: 7,
            maxZoom: 15,
            minZoom: 6
        });

        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        // Wait for map to load before adding data
        map.on('load', function() {
            addRouteToMap();
            addStationsToMap();
            addEventsToMap();
        });
    }

    // Add the Tokaido route to the map
    function addRouteToMap() {
        map.addSource('tokaido-route', {
            type: 'geojson',
            data: tokaidoRoute
        });

        map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'tokaido-route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#e74c3c',
                'line-width': 4,
                'line-opacity': 0.8
            }
        });
    }

    // Add station markers to the map
    function addStationsToMap() {
        map.addSource('stations', {
            type: 'geojson',
            data: stations
        });

        map.addLayer({
            id: 'station-circles',
            type: 'circle',
            source: 'stations',
            paint: {
                'circle-radius': [
                    'case',
                    ['==', ['get', 'type'], 'major'], 8,
                    ['==', ['get', 'type'], 'checkpoint'], 7,
                    6
                ],
                'circle-color': '#3498db',
                'circle-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add labels for stations
        map.addLayer({
            id: 'station-labels',
            type: 'symbol',
            source: 'stations',
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Regular'],
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
                'text-size': 12
            },
            paint: {
                'text-color': '#2c3e50',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });

        // Add popup on click
        map.on('click', 'station-circles', function(e) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            
            new maplibregl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <h3>${properties.name}</h3>
                    <p><strong>Station #${properties.number}</strong></p>
                    <p>${properties.description}</p>
                `)
                .addTo(map);
        });

        // Change cursor on hover
        map.on('mouseenter', 'station-circles', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'station-circles', function() {
            map.getCanvas().style.cursor = '';
        });
    }

    // Add event markers to the map
    function addEventsToMap() {
        map.addSource('events', {
            type: 'geojson',
            data: events
        });

        map.addLayer({
            id: 'event-circles',
            type: 'circle',
            source: 'events',
            paint: {
                'circle-radius': [
                    'case',
                    ['==', ['get', 'importance'], 'high'], 10,
                    8
                ],
                'circle-color': '#f39c12',
                'circle-opacity': 0.9,
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add popup on click
        map.on('click', 'event-circles', function(e) {
            const properties = e.features[0].properties;
            showEventModal(properties);
        });

        // Change cursor on hover
        map.on('mouseenter', 'event-circles', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'event-circles', function() {
            map.getCanvas().style.cursor = '';
        });
    }

    // Initialize timeline in sidebar
    function initTimeline() {
        const timeline = document.getElementById('timeline');
        
        events.features.forEach(function(feature, index) {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.dataset.index = index;
            
            const date = document.createElement('div');
            date.className = 'timeline-date';
            date.textContent = feature.properties.date;
            
            const description = document.createElement('div');
            description.className = 'timeline-description';
            description.textContent = feature.properties.title;
            
            item.appendChild(date);
            item.appendChild(description);
            timeline.appendChild(item);
            
            // Add click handler
            item.addEventListener('click', function() {
                const coords = feature.geometry.coordinates;
                map.flyTo({
                    center: coords,
                    zoom: 10,
                    duration: 2000
                });
                
                // Update active state
                document.querySelectorAll('.timeline-item').forEach(function(el) {
                    el.classList.remove('active');
                });
                item.classList.add('active');
                
                // Show event details
                setTimeout(function() {
                    showEventModal(feature.properties);
                }, 2000);
            });
        });
    }

    // Show event modal
    function showEventModal(properties) {
        const modal = document.getElementById('eventModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        
        title.textContent = properties.title;
        body.innerHTML = `
            <p><strong>${properties.date}</strong></p>
            <p><strong>Location:</strong> ${properties.location}</p>
            <p>${properties.description}</p>
        `;
        
        modal.classList.remove('hidden');
    }

    // Initialize event listeners
    function initEventListeners() {
        // Reset view button
        document.getElementById('resetView').addEventListener('click', function() {
            map.flyTo({
                center: [137.5, 35.0],
                zoom: 7,
                duration: 1500
            });
        });

        // Toggle route button
        document.getElementById('toggleRoute').addEventListener('click', function() {
            routeVisible = !routeVisible;
            const visibility = routeVisible ? 'visible' : 'none';
            map.setLayoutProperty('route-line', 'visibility', visibility);
            this.classList.toggle('active');
        });

        // Close modal
        document.getElementById('closeModal').addEventListener('click', function() {
            document.getElementById('eventModal').classList.add('hidden');
        });

        // Close modal on background click
        document.getElementById('eventModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }

    // Start the application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
