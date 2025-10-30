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
 * 定期リトライのタイマーID配列
 */
let retryTimers = [];

/**
 * レイヤーが正常に表示されているかチェック
 */
function areLayersVisible() {
    if (!map) return false;
    
    const routeLayerExists = map.getLayer('route-layer-tokaido') && map.getLayer('route-layer-other');
    const syukubaLayerExists = map.getLayer('syukuba-circle') && map.getLayer('syukuba-label');
    
    return routeLayerExists && syukubaLayerExists;
}

/**
 * 定期的にレイヤー追加を試行するスケジューラーを設定
 */
function scheduleLayerRetries() {
    // 既存のタイマーをクリア
    retryTimers.forEach(timer => clearTimeout(timer));
    retryTimers = [];
    
    // リトライのタイミング（ミリ秒）: 1秒、3秒、5秒、10秒、20秒、30秒
    const retryIntervals = [1000, 3000, 5000, 10000, 20000, 30000];
    
    retryIntervals.forEach((interval, index) => {
        const timer = setTimeout(() => {
            // レイヤーが既に表示されていればスキップ
            if (areLayersVisible()) {
                routeLogger.info(`リトライ不要: レイヤーは既に表示されています (${interval/1000}秒後)`);
                return;
            }
            
            routeLogger.info(`定期リトライ ${index + 1}/${retryIntervals.length}: レイヤー追加を試行 (${interval/1000}秒後)`);
            
            if (map && map.isStyleLoaded() && routeData && syukubaData) {
                try {
                    addRouteLayer();
                    addSyukubaLayer();
                    routeLogger.info('定期リトライでレイヤー追加成功');
                } catch (error) {
                    routeLogger.error('定期リトライでエラー:', error);
                }
            } else {
                routeLogger.warn('リトライ条件未達: map, routeData, syukubaDataを確認してください');
            }
        }, interval);
        
        retryTimers.push(timer);
    });
    
    routeLogger.info('定期リトライスケジューラーを設定しました (1秒, 3秒, 5秒, 10秒, 20秒, 30秒後)');
}

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

    // レイヤー追加を試行する関数
    const tryAddLayers = () => {
        if (map.isStyleLoaded() && routeData && syukubaData) {
            addRouteLayer();
            addSyukubaLayer();
            routeLogger.info('ルートと宿場のレイヤー追加完了');
            return true;
        }
        return false;
    };

    // 地図のスタイルが読み込まれるまで待機
    if (tryAddLayers()) {
        scheduleLayerRetries(); // 定期リトライを設定
        return;
    }

    // loadイベントとstyledataイベントの両方を待機
    let layersAdded = false;
    
    const addLayersOnce = () => {
        if (!layersAdded && tryAddLayers()) {
            layersAdded = true;
        }
    };

    map.on('load', addLayersOnce);
    map.on('styledata', addLayersOnce);

    // フォールバック: 一定時間後に再試行（タイムアウト対策）
    setTimeout(() => {
        if (!layersAdded) {
            routeLogger.info('タイムアウト後のレイヤー追加を試行');
            addLayersOnce();
        }
    }, 1000);
    
    // 定期リトライスケジューラーを設定
    scheduleLayerRetries();
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

    // ソースを追加または更新
    if (!map.getSource('route-source')) {
        map.addSource('route-source', {
            type: 'geojson',
            data: routeData
        });
        routeLogger.info('ルートソースを追加');
    } else {
        map.getSource('route-source').setData(routeData);
        routeLogger.info('ルートソースを更新');
    }

    // 既存のレイヤーを削除
    const routeLayerIds = [
        'route-layer-other',
        'route-layer-tokaido',
        'route-label-other',
        'route-label-tokaido'
    ];
    
    routeLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
    });

    // その他のルート（東海道以外）
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
            'line-width': 2
        }
    });

    // 東海道
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
            'line-width': 5
        }
    });

    // その他のルートラベル
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

    // 東海道ラベル
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

    routeLogger.info('ルートレイヤーの追加完了');
}

/**
 * 宿場レイヤーをマップに追加
 */
function addSyukubaLayer() {
    routeLogger.info('addSyukubaLayer() called');
    
    if (!syukubaData) {
        routeLogger.error('Syukuba data not loaded');
        return;
    }
    
    routeLogger.info(`宿場データ: ${syukubaData.features.length} features`);

    // ソースを追加または更新
    if (!map.getSource('syukuba-source')) {
        map.addSource('syukuba-source', {
            type: 'geojson',
            data: syukubaData
        });
        routeLogger.info('宿場ソースを追加');
    } else {
        map.getSource('syukuba-source').setData(syukubaData);
        routeLogger.info('宿場ソースを更新');
    }

    // 既存のレイヤーを削除
    const syukubaLayerIds = [
        'syukuba-circle',
        'syukuba-sekisho-outer',
        'syukuba-sekisho-middle',
        'syukuba-sekisho-center',
        'syukuba-label',
        'syukuba-sekisho-label',
        'syukuba-sekisho-point-bg',
        'syukuba-sekisho-point-label'
    ];
    
    syukubaLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
    });

    // 通常の宿場（蠱毒通過点数 = 0）
    map.addLayer({
        id: 'syukuba-circle',
        type: 'circle',
        source: 'syukuba-source',
        filter: ['==', ['get', '蠱毒通過点数'], 0],
        paint: {
            'circle-radius': 4,
            'circle-color': '#FFFFFF',
            'circle-stroke-width': 4,
            'circle-stroke-color': '#BE3C32'
        }
    });

    // 関所（蠱毒通過点数 > 0）- 外側の円
    map.addLayer({
        id: 'syukuba-sekisho-outer',
        type: 'circle',
        source: 'syukuba-source',
        filter: ['>', ['get', '蠱毒通過点数'], 0],
        paint: {
            'circle-radius': 12,
            'circle-color': '#BE3C32'
        }
    });

    // 関所 - 中間の白い円
    map.addLayer({
        id: 'syukuba-sekisho-middle',
        type: 'circle',
        source: 'syukuba-source',
        filter: ['>', ['get', '蠱毒通過点数'], 0],
        paint: {
            'circle-radius': 8,
            'circle-color': '#FFFFFF'
        }
    });

    // 関所 - 中心の黒い円
    map.addLayer({
        id: 'syukuba-sekisho-center',
        type: 'circle',
        source: 'syukuba-source',
        filter: ['>', ['get', '蠱毒通過点数'], 0],
        paint: {
            'circle-radius': 6,
            'circle-color': '#000000'
        }
    });

    // 通常の宿場名ラベル（縦書き）
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

    // 関所の宿場名ラベル（縦書き）
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

    // 関所の通過点数ラベル用の黒丸背景
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

    // 関所の通過点数ラベル（縦書き）
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
            'text-color': '#FFFFFF'
        }
    });

    routeLogger.info('宿場レイヤーの追加完了');
}

/**
 * 背景地図切替時にルートレイヤーを再追加
 */
function readdRouteLayer() {
    if (!map) {
        routeLogger.error('Map is not initialized');
        return;
    }
    
    if (!routeData || !syukubaData) {
        routeLogger.error('Route or Syukuba data not loaded');
        return;
    }
    
    // 既存のリトライタイマーをクリアして新しくスケジュール
    scheduleLayerRetries();
    
    // スタイルがロードされるまで待機（最大10回まで再試行）
    let retryCount = 0;
    const maxRetries = 10;
    
    const addLayers = () => {
        if (map.isStyleLoaded()) {
            addRouteLayer();
            addSyukubaLayer();
            routeLogger.info('ルートと宿場のレイヤー再追加完了');
        } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(addLayers, 50);
        } else {
            routeLogger.error('スタイル読み込みのタイムアウト: レイヤー追加を中止');
            routeLogger.info('定期リトライで回復を試みます');
        }
    };
    
    addLayers();
}
