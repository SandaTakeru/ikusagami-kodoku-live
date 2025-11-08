// ========================================
// ルート表示機能
// ========================================

const routeLogger = getLogger('RouteDisplay');

/**
 * GeoJSON直線データ (line.geojson - 地図上の直線的な道路や線路)
 */
let straightLinesData = null;

/**
 * GeoJSON宿場データ (syukuba.geojson)
 */
let syukubaData = null;

/**
 * GeoJSONランドマークデータ (landmark.geojson)
 */
let landmarkData = null;

/**
 * GeoJSON曲線ルートデータ (route.geojson - キャラクター移動用の詳細な曲線ルート)
 */
let curvedRoutesData = null;

/**
 * 定期リトライのタイマーID配列
 */
let retryTimers = [];

/**
 * レイヤーが正常に表示されているかチェック
 */
function areLayersVisible() {
    if (!map) return false;
    
    const lineLayerExists = map.getLayer('line-layer-tokaido') && map.getLayer('line-layer-other');
    const syukubaLayerExists = map.getLayer('syukuba-circle') && map.getLayer('syukuba-label');
    const landmarkLayerExists = map.getLayer('landmark-label');
    
    return lineLayerExists && syukubaLayerExists && landmarkLayerExists;
}

/**
 * 定期的にレイヤー追加を試行するスケジューラーを設定
 */
function scheduleLayerRetries() {
    // 既存のタイマーをクリア
    retryTimers.forEach(timer => clearTimeout(timer));
    retryTimers = [];
    
    // リトライのタイミング（ミリ秒）を削減: 1秒、5秒、10秒
    const retryIntervals = [1000, 5000, 10000];
    
    retryIntervals.forEach((interval, index) => {
        const timer = setTimeout(() => {
            if (areLayersVisible()) {
            routeLogger.info(`リトライ不要 (${interval/1000}秒後)`);
                return;
            }
            
            routeLogger.info(`レイヤー追加を再試行 (${index + 1}/${retryIntervals.length})`);
            
            if (map && map.isStyleLoaded() && straightLinesData && curvedRoutesData && syukubaData && landmarkData) {
                try {
                    addStraightLinesLayer();
                    addSyukubaLayer();
                    addLandmarkLayer();
                } catch (error) {
                    routeLogger.error('レイヤー追加エラー:', error);
                }
            }
        }, interval);
        
        retryTimers.push(timer);
    });
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
    await loadStraightLinesData();
    await loadCurvedRoutesData();
    await loadSyukubaData();
    await loadLandmarkData();

    // レイヤー追加を試行する関数
    const tryAddLayers = () => {
        if (map.isStyleLoaded() && straightLinesData && curvedRoutesData && syukubaData && landmarkData) {
            addStraightLinesLayer();
            addSyukubaLayer();
            addLandmarkLayer();
            routeLogger.info('レイヤー追加完了');
            return true;
        }
        return false;
    };

    // 即座にレイヤー追加を試行
    if (tryAddLayers()) {
        scheduleLayerRetries();
        return;
    }

    // イベントリスナーでレイヤー追加を試行
    let layersAdded = false;
    const addLayersOnce = () => {
        if (!layersAdded && tryAddLayers()) {
            layersAdded = true;
        }
    };

    map.on('load', addLayersOnce);
    map.on('styledata', addLayersOnce);
    
    // 定期リトライスケジューラーを設定
    scheduleLayerRetries();
}

/**
 * 直線GeoJSONデータを読み込む (line.geojson - 地図表示用の直線)
 */
async function loadStraightLinesData() {
    try {
        const response = await fetch('./data/line.geojson');
        straightLinesData = await response.json();
        routeLogger.info(`Loaded straight lines data with ${straightLinesData.features.length} features`);
    } catch (error) {
        routeLogger.error('Failed to load line.geojson:', error);
    }
}

/**
 * 曲線ルートGeoJSONデータを読み込む (route.geojson - キャラクター移動用の詳細ルート)
 */
async function loadCurvedRoutesData() {
    try {
        const response = await fetch('./data/route.geojson');
        curvedRoutesData = await response.json();
        routeLogger.info(`Loaded curved routes data with ${curvedRoutesData.features.length} features`);
    } catch (error) {
        routeLogger.error('Failed to load route.geojson:', error);
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
 * ランドマークGeoJSONデータを読み込む
 */
async function loadLandmarkData() {
    try {
        const response = await fetch('./data/landmark.geojson');
        landmarkData = await response.json();
        routeLogger.info(`Loaded landmark data with ${landmarkData.features.length} features`);
    } catch (error) {
        routeLogger.error('Failed to load landmark.geojson:', error);
    }
}

/**
 * 直線レイヤーをマップに追加 (line.geojson - 地図表示用)
 */
function addStraightLinesLayer() {
    if (!straightLinesData) {
        routeLogger.error('Straight lines data not loaded');
        return;
    }

    // ソースを追加または更新
    if (!map.getSource('straight-lines-source')) {
        map.addSource('straight-lines-source', {
            type: 'geojson',
            data: straightLinesData
        });
    } else {
        map.getSource('straight-lines-source').setData(straightLinesData);
    }

    // 陸蒸気（明治時代の鉄道路線）
    // ムカデのような線形で表現
    map.addLayer({
        id: 'line-layer-rikujouki',
        type: 'line',
        source: 'straight-lines-source',
        filter: ['all',
            ['==', ['get', 'name'], '陸蒸気'],
            ['>', ['get', 'filter'], 0]
        ],
        layout: {
            'line-join': 'miter',
            'line-cap': 'butt'
        },
        paint: {
            'line-color': '#2C3E50',
            'line-width': 4,
            'line-dasharray': [0.5, 0.5],
            'line-gap-width': 0
        }
    });

    // その他の線（東海道・陸蒸気以外）
    // filter値が1以上のもののみ表示
    map.addLayer({
        id: 'line-layer-other',
        type: 'line',
        source: 'straight-lines-source',
        filter: ['all', 
            ['!=', ['get', 'name'], '東海道'],
            ['!=', ['get', 'name'], '陸蒸気'],
            ['>', ['get', 'filter'], 0]
        ],
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
    // filter値が1以上のもののみ表示
    map.addLayer({
        id: 'line-layer-tokaido',
        type: 'line',
        source: 'straight-lines-source',
        filter: ['all',
            ['==', ['get', 'name'], '東海道'],
            ['>', ['get', 'filter'], 0]
        ],
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#BE3C32',
            'line-width': 5
        }
    });

    // その他の線ラベル（陸蒸気と東海道以外）
    map.addLayer({
        id: 'line-label-other',
        type: 'symbol',
        source: 'straight-lines-source',
        filter: ['all',
            ['!=', ['get', 'name'], '東海道'],
            ['!=', ['get', 'name'], '陸蒸気']
        ],
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 12,
            'symbol-placement': 'line-center',
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
        id: 'line-label-tokaido',
        type: 'symbol',
        source: 'straight-lines-source',
        filter: ['==', ['get', 'name'], '東海道'],
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 16,
            'symbol-placement': 'line',
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'symbol-spacing': 999,
        },
        paint: {
            'text-color': '#BE3C32',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 2.5
        }
    });

    // 陸蒸気ラベル
    map.addLayer({
        id: 'line-label-rikujouki',
        type: 'symbol',
        source: 'straight-lines-source',
        filter: ['==', ['get', 'name'], '陸蒸気'],
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 13,
            'symbol-placement': 'line',
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'symbol-spacing': 400
        },
        paint: {
            'text-color': '#2C3E50',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 2
        }
    });
    
    // 初期フィルタを適用（ネタバレフィルタの現在値を取得）
    const spoilerFilterElement = document.getElementById('spoiler-filter');
    if (spoilerFilterElement) {
        const currentVolume = parseInt(spoilerFilterElement.value);
        updateStraightLinesVisibility(currentVolume);
    }
}

/**
 * 宿場レイヤーをマップに追加
 */
function addSyukubaLayer() {
    if (!syukubaData) {
        routeLogger.error('Syukuba data not loaded');
        return;
    }

    // ソースを追加または更新
    if (!map.getSource('syukuba-source')) {
        map.addSource('syukuba-source', {
            type: 'geojson',
            data: syukubaData
        });
    } else {
        map.getSource('syukuba-source').setData(syukubaData);
    }

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

    // 関所の通過点数ラベル（縦書き、白文字に黒縁取り）
    map.addLayer({
        id: 'syukuba-sekisho-point-label',
        type: 'symbol',
        source: 'syukuba-source',
        filter: ['>', ['get', '蠱毒通過点数'], 0],
        layout: {
            'text-field': ['concat', ['get', '漢字_蠱毒通過点数'], '点'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 14,
            'text-offset': [-3, 0],
            'text-anchor': 'center',
            'text-writing-mode': ['vertical']
        },
        paint: {
            'text-color': '#333333',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5
        }
    });
}

/**
 * ランドマークレイヤーを追加
 */
function addLandmarkLayer() {
    if (!landmarkData) {
        routeLogger.error('Landmark data not loaded');
        return;
    }

    // ソースを追加または更新
    if (!map.getSource('landmark-source')) {
        map.addSource('landmark-source', {
            type: 'geojson',
            data: landmarkData
        });
    } else {
        map.getSource('landmark-source').setData(landmarkData);
    }

    // 種類ごとのSVGアイコン定義を地図に追加
    const iconDefinitions = {
        '鉄道駅': createStationIcon(),
        '山': createMountainIcon(),
        '海路': createSeaRouteIcon(),
        '水域': createWaterIcon(),
        '峠': createPassIcon(),
        '橋': createBridgeIcon(),
        '和風建物': createJapaneseBuildingIcon(),
        '洋風建物': createWesternBuildingIcon(),
        '街': createTownIcon(),
        '寺': createTempleIcon(),
        '史跡': createHistoricSiteIcon(),
        '郵便局': createPostOfficeIcon(),
        '旅籠': createInnIcon(),
        '宿場': createPostTownIcon(),
        '砂浜': createBeachIcon(),
        '住居': createHouseIcon(),
        '坂道': createSlopeIcon(),
        '門': createGateIcon(),
        '警察署': createPoliceStationIcon(),
        '茶屋': createTeaHouseIcon(),
        '灯台': createLighthouseIcon(),
        '港': createPortIcon(),
        '劇場': createTheaterIcon(),
        '軍施設': createMilitaryFacilityIcon(),
        '土手': createDikeIcon(),
        '神社': createShrineIcon(),
        '城': createCastleIcon(),
        'default': createDefaultIcon()
    };

    // アイコンを地図に追加
    const iconPromises = Object.entries(iconDefinitions).map(([type, svgString]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                if (!map.hasImage(`landmark-${type}`)) {
                    map.addImage(`landmark-${type}`, img);
                }
                resolve();
            };
            img.onerror = reject;
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        });
    });

    Promise.all(iconPromises).then(() => {
        // アイコンレイヤー
        map.addLayer({
            id: 'landmark-icon',
            type: 'symbol',
            source: 'landmark-source',
            layout: {
                'icon-image': [
                    'case',
                    ['all', ['has', '種類'], ['!=', ['get', '種類'], null], ['!=', ['get', '種類'], '']],
                    ['concat', 'landmark-', ['get', '種類']],
                    'landmark-default'
                ],
                'icon-size': 0.8,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }
        });

        // ラベルレイヤー
        map.addLayer({
            id: 'landmark-label',
            type: 'symbol',
            source: 'landmark-source',
            layout: {
                'text-field': ['get', '名前'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 10,
                'text-offset': [0, 1.2],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#666666',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1
            }
        });
        
        // 初期フィルタを適用（ネタバレフィルタの現在値を取得）
        const spoilerFilterElement = document.getElementById('spoiler-filter');
        if (spoilerFilterElement) {
            const currentVolume = parseInt(spoilerFilterElement.value);
            updateLandmarkVisibility(currentVolume);
        }
    }).catch(error => {
        routeLogger.error('Failed to add landmark icons:', error);
    });
}

// SVGアイコン生成関数
function createStationIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" fill="#4285F4" stroke="#1967D2" stroke-width="2"/>
    </svg>`;
}

function createMountainIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4 L18 17 L6 17 Z" fill="#8B4513" stroke="#654321" stroke-width="1.5"/>
    </svg>`;
}

function createSeaRouteIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12 Q7 9 12 12 T20 12" fill="none" stroke="#0066CC" stroke-width="3"/>
        <circle cx="4" cy="12" r="2" fill="#0066CC"/>
        <circle cx="20" cy="12" r="2" fill="#0066CC"/>
    </svg>`;
}

function createWaterIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/>
    </svg>`;
}

function createPassIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18 L9 9 L15 13 L21 6" fill="none" stroke="#795548" stroke-width="3"/>
    </svg>`;
}

function createBridgeIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="10" width="18" height="3" fill="#8D6E63"/>
        <rect x="6" y="7" width="1.5" height="6" fill="#8D6E63"/>
        <rect x="16.5" y="7" width="1.5" height="6" fill="#8D6E63"/>
    </svg>`;
}

function createJapaneseBuildingIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="7" width="12" height="11" fill="#D32F2F" stroke="#B71C1C" stroke-width="1.5"/>
        <path d="M4 7 L20 7 L21 4 L3 4 Z" fill="#B71C1C"/>
    </svg>`;
}

function createWesternBuildingIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="12" height="12" fill="#9E9E9E" stroke="#616161" stroke-width="1.5"/>
        <rect x="9" y="9" width="3" height="3" fill="#FFF"/>
        <rect x="13.5" y="9" width="3" height="3" fill="#FFF"/>
    </svg>`;
}

function createTownIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="9" width="6" height="9" fill="#757575"/>
        <rect x="14" y="6" width="6" height="12" fill="#757575"/>
    </svg>`;
}

function createTempleIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4 L18 9 L18 18 L6 18 L6 9 Z" fill="#FF9800" stroke="#F57C00" stroke-width="1.5"/>
        <rect x="10.5" y="12" width="3" height="6" fill="#5D4037"/>
    </svg>`;
}

function createHistoricSiteIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#9C27B0" stroke="#7B1FA2" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" font-size="11" fill="white" font-family="serif">史</text>
    </svg>`;
}

function createPostOfficeIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" fill="#E53935" stroke="#C62828" stroke-width="1.5"/>
        <text x="12" y="16" text-anchor="middle" font-size="10" fill="white" font-weight="bold">〒</text>
    </svg>`;
}

function createInnIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="7" width="12" height="11" fill="#6D4C41" stroke="#4E342E" stroke-width="1.5"/>
        <rect x="9.5" y="12" width="5" height="6" fill="#8D6E63"/>
    </svg>`;
}

function createPostTownIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="9" width="16" height="9" fill="#795548" stroke="#5D4037" stroke-width="1.5"/>
        <path d="M3 9 L12 4 L21 9" fill="#8D6E63"/>
    </svg>`;
}

function createBeachIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 15 L21 15 L21 18 L3 18 Z" fill="#FFD54F"/>
        <path d="M3 12 L21 12 L21 15 L3 15 Z" fill="#81D4FA"/>
    </svg>`;
}

function createHouseIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4 L20 10 L20 20 L4 20 L4 10 Z" fill="#BCAAA4" stroke="#8D6E63" stroke-width="1.5"/>
        <rect x="9" y="13" width="6" height="7" fill="#6D4C41"/>
    </svg>`;
}

function createSlopeIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18 L20 6" stroke="#795548" stroke-width="3" stroke-linecap="round"/>
        <path d="M6 18 L8 18 L8 16 Z" fill="#8D6E63"/>
    </svg>`;
}

function createGateIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="6" width="3" height="12" fill="#8D6E63"/>
        <rect x="16" y="6" width="3" height="12" fill="#8D6E63"/>
        <rect x="4" y="6" width="16" height="3" fill="#6D4C41"/>
        <rect x="8" y="9" width="8" height="9" fill="#D32F2F" stroke="#B71C1C" stroke-width="1"/>
    </svg>`;
}

function createPoliceStationIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="11" fill="#1976D2" stroke="#0D47A1" stroke-width="1.5"/>
        <circle cx="12" cy="13" r="3" fill="#FF9800" stroke="#F57C00" stroke-width="1"/>
        <text x="12" y="15" text-anchor="middle" font-size="5" fill="#FFF" font-weight="bold">警</text>
    </svg>`;
}

function createTeaHouseIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="10" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
        <path d="M4 8 L20 8 L21 6 L3 6 Z" fill="#6D4C41"/>
        <circle cx="12" cy="13" r="2.5" fill="#4CAF50" stroke="#388E3C" stroke-width="1"/>
    </svg>`;
}

function createLighthouseIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 18 L14 18 L13 6 L11 6 Z" fill="#E53935" stroke="#C62828" stroke-width="1"/>
        <rect x="9" y="18" width="6" height="2" fill="#757575"/>
        <circle cx="12" cy="5" r="2" fill="#FFD54F" stroke="#FFA000" stroke-width="1"/>
    </svg>`;
}

function createPortIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16 L20 16 L20 18 L4 18 Z" fill="#0288D1"/>
        <path d="M8 10 L10 16 L14 16 L16 10" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
        <path d="M12 6 L12 10" stroke="#424242" stroke-width="1.5"/>
        <path d="M12 6 L16 8 L12 10" fill="#E53935"/>
    </svg>`;
}

function createTheaterIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="7" width="14" height="11" fill="#9C27B0" stroke="#7B1FA2" stroke-width="1.5"/>
        <rect x="8" y="11" width="3" height="4" fill="#FFD54F"/>
        <rect x="13" y="11" width="3" height="4" fill="#FFD54F"/>
        <path d="M5 7 L19 7 L17 4 L7 4 Z" fill="#7B1FA2"/>
    </svg>`;
}

function createMilitaryFacilityIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="10" fill="#424242" stroke="#212121" stroke-width="1.5"/>
        <circle cx="12" cy="13" r="3" fill="#F44336"/>
        <path d="M12 10 L12 16 M9 13 L15 13" stroke="#FFF" stroke-width="1.5"/>
    </svg>`;
}

function createDikeIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18 L8 12 L12 14 L16 10 L21 14" fill="#8BC34A" stroke="#689F38" stroke-width="1.5"/>
        <path d="M3 18 L21 18 L21 20 L3 20 Z" fill="#795548"/>
    </svg>`;
}

function createShrineIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="4" height="8" fill="#E53935"/>
        <path d="M6 10 L18 10 L19 8 L5 8 Z" fill="#C62828"/>
        <path d="M8 8 L16 8 L17 6 L7 6 Z" fill="#E53935"/>
        <circle cx="12" cy="14" r="1.5" fill="#FFD54F"/>
    </svg>`;
}

function createCastleIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="12" width="10" height="7" fill="#9E9E9E" stroke="#616161" stroke-width="1.5"/>
        <rect x="5" y="8" width="14" height="4" fill="#757575" stroke="#424242" stroke-width="1"/>
        <path d="M5 8 L12 4 L19 8" fill="#BDBDBD"/>
        <rect x="9" y="14" width="2" height="2" fill="#424242"/>
        <rect x="13" y="14" width="2" height="2" fill="#424242"/>
    </svg>`;
}

function createDefaultIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="6" fill="#9E9E9E" stroke="#616161" stroke-width="1.5"/>
    </svg>`;
}

/**
 * 背景地図切替時にレイヤーを再追加
 */
function readdRouteLayer() {
    if (!map) {
        routeLogger.error('Map is not initialized');
        return;
    }
    
    if (!straightLinesData || !curvedRoutesData || !syukubaData || !landmarkData) {
        routeLogger.error('Straight lines, Curved routes, Syukuba or Landmark data not loaded');
        return;
    }
    
    // 既存のリトライタイマーをクリアして新しくスケジュール
    scheduleLayerRetries();
    
    // スタイルがロードされるまで待機（最大10回まで再試行）
    let retryCount = 0;
    const maxRetries = 10;
    
    const addLayers = () => {
        if (map.isStyleLoaded()) {
            // まず既存のレイヤーをすべて削除
            const allLayerIds = [
                'line-layer-rikujouki', 'line-layer-other', 'line-layer-tokaido',
                'line-label-other', 'line-label-tokaido', 'line-label-rikujouki',
                'syukuba-circle', 'syukuba-sekisho-outer', 'syukuba-sekisho-middle',
                'syukuba-sekisho-center', 'syukuba-label', 'syukuba-sekisho-label',
                'syukuba-sekisho-point-label',
                'landmark-icon', 'landmark-label'
            ];
            
            allLayerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    try {
                        map.removeLayer(layerId);
                        routeLogger.debug(`Removed layer: ${layerId}`);
                    } catch (e) {
                        routeLogger.warn(`Failed to remove layer ${layerId}:`, e);
                    }
                }
            });
            
            // レイヤー追加
            addStraightLinesLayer();
            addSyukubaLayer();
            addLandmarkLayer();
        } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(addLayers, 50);
        } else {
            routeLogger.warn('スタイル読み込みタイムアウト（定期リトライで回復を試みます）');
        }
    };
    
    addLayers();
}

/**
 * ランドマークの表示/非表示をネタバレフィルタで制御
 * @param {number} readVolume - 既読巻数
 */
function updateLandmarkVisibility(readVolume) {
    if (!map) {
        routeLogger.debug('Map is not yet initialized, skipping landmark visibility update');
        return;
    }

    // レイヤーが存在しない場合は終了
    if (!map.getLayer('landmark-icon') || !map.getLayer('landmark-label')) {
        routeLogger.debug('Landmark layers not found, skipping visibility update');
        return;
    }

    // filterプロパティの値に基づいてフィルタリング
    // filter値が既読巻数以下のものだけ表示
    const visibilityFilter = ['<=', ['get', 'filter'], readVolume];

    map.setFilter('landmark-icon', visibilityFilter);
    map.setFilter('landmark-label', visibilityFilter);

    routeLogger.info(`Landmark visibility updated for volume ${readVolume}`);
}

/**
 * 直線(line)の表示/非表示をネタバレフィルタで制御
 * @param {number} readVolume - 既読巻数
 */
function updateStraightLinesVisibility(readVolume) {
    if (!map) {
        routeLogger.debug('Map is not yet initialized, skipping straight lines visibility update');
        return;
    }

    // レイヤーが存在しない場合は終了
    if (!map.getLayer('line-layer-other') || !map.getLayer('line-layer-tokaido') || !map.getLayer('line-layer-rikujouki')) {
        routeLogger.debug('Straight line layers not found, skipping visibility update');
        return;
    }

    // filter値が既読巻数以下かつ1以上のもののみライン表示
    // filter=0のものはラベルのみ表示（ジオメトリ非表示）
    const lineFilterRikujouki = ['all',
        ['==', ['get', 'name'], '陸蒸気'],
        ['<=', ['get', 'filter'], readVolume],
        ['>', ['get', 'filter'], 0]
    ];
    
    const lineFilterOther = ['all', 
        ['!=', ['get', 'name'], '東海道'],
        ['!=', ['get', 'name'], '陸蒸気'],
        ['<=', ['get', 'filter'], readVolume],
        ['>', ['get', 'filter'], 0]
    ];
    
    const lineFilterTokaido = ['all',
        ['==', ['get', 'name'], '東海道'],
        ['<=', ['get', 'filter'], readVolume],
        ['>', ['get', 'filter'], 0]
    ];
    
    // ラベルは filter値が既読巻数以下のものすべて表示（filter=0を含む）
    const labelFilterRikujouki = ['all',
        ['==', ['get', 'name'], '陸蒸気'],
        ['<=', ['get', 'filter'], readVolume]
    ];
    
    const labelFilterOther = ['all',
        ['!=', ['get', 'name'], '東海道'],
        ['!=', ['get', 'name'], '陸蒸気'],
        ['<=', ['get', 'filter'], readVolume]
    ];
    
    const labelFilterTokaido = ['all',
        ['==', ['get', 'name'], '東海道'],
        ['<=', ['get', 'filter'], readVolume]
    ];

    map.setFilter('line-layer-rikujouki', lineFilterRikujouki);
    map.setFilter('line-layer-other', lineFilterOther);
    map.setFilter('line-layer-tokaido', lineFilterTokaido);
    map.setFilter('line-label-rikujouki', labelFilterRikujouki);
    map.setFilter('line-label-other', labelFilterOther);
    map.setFilter('line-label-tokaido', labelFilterTokaido);

    routeLogger.info(`Straight lines visibility updated for volume ${readVolume}`);
}

/**
 * 直線データへのグローバルアクセス用関数
 * （interpolationUtils.jsなど他のモジュールから東海道ルートを参照するため）
 * @returns {Object|null} straightLinesData (line.geojson - 東海道の曲線ルートを含む)
 */
function getStraightLinesData() {
    return straightLinesData;
}

/**
 * 曲線ルートデータへのグローバルアクセス用関数
 * （interpolationUtils.jsなど他のモジュールから参照するため）
 * @returns {Object|null} curvedRoutesData (route.geojson - キャラクター専用ルート)
 */
function getCurvedRoutesData() {
    return curvedRoutesData;
}
