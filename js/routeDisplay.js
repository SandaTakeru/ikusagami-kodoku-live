// ========================================
// ルート表示機能
// ========================================

const routeLogger = getLogger('RouteDisplay');

/**
 * GeoJSONルートデータ
 */
let routeData = null;

/**
 * GeoJSON宿場データ
 */
let syukubaData = null;

/**
 * ルート表示の初期化
 */
async function initRouteDisplay() {
    if (!map) {
        routeLogger.error('Map is not initialized');
        return;
    }

    routeLogger.info('ルート表示の初期化を開始');

    // GeoJSONデータを読み込む
    await loadRouteData();
    await loadSyukubaData();

    // 地図のスタイルが読み込まれるまで待機
    const waitForStyleLoad = () => {
        if (map.isStyleLoaded()) {
            addRouteLayer();
            addSyukubaLayer();
            routeLogger.info('ルートとシュクバのレイヤー追加完了');
        } else {
            routeLogger.info('地図スタイルの読み込みを待機中...');
            setTimeout(waitForStyleLoad, 50);
        }
    };

    waitForStyleLoad();
}

/**
 * ルートGeoJSONデータを読み込む
 */
async function loadRouteData() {
    try {
        const response = await fetch('./data/kaidou.geojson');
        routeData = await response.json();
        routeLogger.info(`Loaded route data with ${routeData.features.length} features`);
    } catch (error) {
        routeLogger.error('Failed to load kaidou.geojson:', error);
    }
}

/**
 * 宿場GeoJSONデータを読み込む
 */
async function loadSyukubaData() {
    try {
        const response = await fetch('./data/syukuba.geojson');
        syukubaData = await response.json();
        routeLogger.info(`Loaded syukuba data with ${syukubaData.features.length} features`);
    } catch (error) {
        routeLogger.error('Failed to load syukuba.geojson:', error);
    }
}

/**
 * ルートレイヤーをマップに追加
 */
function addRouteLayer() {
    if (!routeData) {
        routeLogger.error('Route data not loaded');
        return;
    }

    if (!map.isStyleLoaded()) {
        routeLogger.warn('Map style not loaded yet');
        return;
    }

    // ソースを追加（存在しない場合のみ）
    if (!map.getSource('route-source')) {
        map.addSource('route-source', {
            type: 'geojson',
            data: routeData
        });
        routeLogger.info('ルートソースを追加');
    } else {
        // 既存ソースのデータを更新
        map.getSource('route-source').setData(routeData);
    }

    // その他のルートレイヤー（東海道以外）
    if (!map.getLayer('route-layer-other')) {
        map.addLayer({
            id: 'route-layer-other',
            type: 'line',
            source: 'route-source',
            filter: ['!=', ['get', 'name'], '東海道'],
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#666666',
                'line-width': 2,
                'line-opacity': 1
            }
        });
        routeLogger.info('その他のルートレイヤーを追加');
    }

    // 東海道レイヤー
    if (!map.getLayer('route-layer-tokaido')) {
        map.addLayer({
            id: 'route-layer-tokaido',
            type: 'line',
            source: 'route-source',
            filter: ['==', ['get', 'name'], '東海道'],
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#BE3C32',
                'line-width': 5,
                'line-opacity': 1
            }
        });
        routeLogger.info('東海道レイヤーを追加');
    }

    // その他のルートのラベル
    if (!map.getLayer('route-label-other')) {
        map.addLayer({
            id: 'route-label-other',
            type: 'symbol',
            source: 'route-source',
            filter: ['!=', ['get', 'name'], '東海道'],
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 12,
                'symbol-placement': 'line',
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'viewport'
            },
            paint: {
                'text-color': '#666666',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2
            }
        });
        routeLogger.info('その他のルートラベルを追加');
    }

    // 東海道のラベル
    if (!map.getLayer('route-label-tokaido')) {
        map.addLayer({
            id: 'route-label-tokaido',
            type: 'symbol',
            source: 'route-source',
            filter: ['==', ['get', 'name'], '東海道'],
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-size': 16,
                'symbol-placement': 'line',
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'viewport'
            },
            paint: {
                'text-color': '#BE3C32',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2.5
            }
        });
        routeLogger.info('東海道ラベルを追加');
    }

    routeLogger.info('ルートレイヤーの追加完了');
}

/**
 * 宿場レイヤーをマップに追加
 */
function addSyukubaLayer() {
    if (!syukubaData) {
        routeLogger.error('Syukuba data not loaded');
        return;
    }

    if (!map.isStyleLoaded()) {
        routeLogger.warn('Map style not loaded yet');
        return;
    }

    // ソースを追加（存在しない場合のみ）
    if (!map.getSource('syukuba-source')) {
        map.addSource('syukuba-source', {
            type: 'geojson',
            data: syukubaData
        });
        routeLogger.info('シュクバソースを追加');
    } else {
        // 既存ソースのデータを更新
        map.getSource('syukuba-source').setData(syukubaData);
    }

    // 関所（蠱毒通過点数 > 0）の外側の大きな円レイヤー
    if (!map.getLayer('syukuba-sekisho-outer')) {
        map.addLayer({
            id: 'syukuba-sekisho-outer',
            type: 'circle',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            paint: {
                'circle-radius': 12,
                'circle-color': '#BE3C32',
                'circle-opacity': 1
            }
        });
    }

    // 関所の中間の白い円レイヤー
    if (!map.getLayer('syukuba-sekisho-middle')) {
        map.addLayer({
            id: 'syukuba-sekisho-middle',
            type: 'circle',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            paint: {
                'circle-radius': 8,
                'circle-color': '#FFFFFF',
                'circle-opacity': 1
            }
        });
    }

    // 関所の中心の黒い円レイヤー
    if (!map.getLayer('syukuba-sekisho-center')) {
        map.addLayer({
            id: 'syukuba-sekisho-center',
            type: 'circle',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            paint: {
                'circle-radius': 6,
                'circle-color': '#000000',
                'circle-opacity': 1
            }
        });
    }

    // 通常の宿場の円レイヤー
    if (!map.getLayer('syukuba-circle')) {
        map.addLayer({
            id: 'syukuba-circle',
            type: 'circle',
            source: 'syukuba-source',
            filter: ['==', ['get', '蠱毒通過点数'], 0],
            paint: {
                'circle-radius': 4,
                'circle-color': '#FFFFFF',
                'circle-stroke-width': 4,
                'circle-stroke-color': '#BE3C32',
                'circle-stroke-opacity': 1
            }
        });
    }

    // 関所の通過点数ラベル用の黒い円背景
    if (!map.getLayer('syukuba-sekisho-point-bg')) {
        map.addLayer({
            id: 'syukuba-sekisho-point-bg',
            type: 'circle',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            paint: {
                'circle-radius': 18,
                'circle-color': '#000000',
                'circle-translate': [0, -32]
            }
        });
    }

    // 通常の宿場名のラベル
    if (!map.getLayer('syukuba-label')) {
        map.addLayer({
            id: 'syukuba-label',
            type: 'symbol',
            source: 'syukuba-source',
            filter: ['==', ['get', '蠱毒通過点数'], 0],
            layout: {
                'text-field': ['get', '宿場名'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 11,
                'text-offset': [1.5, 0],
                'text-anchor': 'left',
                'text-writing-mode': ['vertical']
            },
            paint: {
                'text-color': '#333333',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1.5
            }
        });
    }

    // 関所の宿場名のラベル
    if (!map.getLayer('syukuba-sekisho-label')) {
        map.addLayer({
            id: 'syukuba-sekisho-label',
            type: 'symbol',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            layout: {
                'text-field': ['get', '宿場名'],
                'text-font': ['Noto Sans Bold'],
                'text-size': 14,
                'text-offset': [1.5, 0],
                'text-anchor': 'left',
                'text-writing-mode': ['vertical']
            },
            paint: {
                'text-color': '#333333',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2
            }
        });
    }

    // 関所の通過点数ラベル
    if (!map.getLayer('syukuba-sekisho-point-label')) {
        map.addLayer({
            id: 'syukuba-sekisho-point-label',
            type: 'symbol',
            source: 'syukuba-source',
            filter: ['>', ['get', '蠱毒通過点数'], 0],
            layout: {
                'text-field': ['concat', ['get', '漢字_蠱毒通過点数'], '点'],
                'text-font': ['Noto Sans Bold'],
                'text-size': 9,
                'text-offset': [-3.5, 0],
                'text-anchor': 'center',
                'text-writing-mode': ['vertical']
            },
            paint: {
                'text-color': '#FFFFFF',
                'text-halo-color': 'rgba(0, 0, 0, 0)',
                'text-halo-width': 0
            }
        });
    }

    routeLogger.info('シュクバレイヤーの追加完了');
}

/**
 * 背景地図切替時にルートレイヤーを再追加
 */
function readdRouteLayer() {
    if (!map) {
        routeLogger.error('Map is not initialized');
        return;
    }
    
    if (!map.isStyleLoaded()) {
        routeLogger.warn('Map style is not loaded yet');
        return;
    }
    
    addRouteLayer();
    addSyukubaLayer();
}
