// ========================================
// 地図制御
// ========================================

const mapLogger = getLogger('Map');

// グローバル変数
let map = null;

// 背景地図スタイルの定義
const BASE_MAP_STYLES = {
    'rekichizu': {
        name: 'れきちず',
        style: 'https://mierune.github.io/rekichizu-style/styles/street/style.json'
    },
    'osm': {
        name: 'OpenStreetMap',
        style: {
            version: 8,
            sources: {
                'osm': {
                    type: 'raster',
                    tiles: [
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            },
            layers: [
                {
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                    minzoom: 0,
                    maxzoom: 19
                }
            ],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        }
    },
    'gsi-std': {
        name: '地理院タイル（標準地図）',
        style: {
            version: 8,
            sources: {
                'gsi-std': {
                    type: 'raster',
                    tiles: [
                        'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>'
                }
            },
            layers: [
                {
                    id: 'gsi-std',
                    type: 'raster',
                    source: 'gsi-std',
                    minzoom: 0,
                    maxzoom: 18
                }
            ],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        }
    },
    'gsi-english': {
        name: 'GSI English Map',
        style: {
            version: 8,
            sources: {
                'gsi-english': {
                    type: 'raster',
                    tiles: [
                        'https://cyberjapandata.gsi.go.jp/xyz/english/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Tiles</a>'
                }
            },
            layers: [
                {
                    id: 'gsi-english',
                    type: 'raster',
                    source: 'gsi-english',
                    minzoom: 0,
                    maxzoom: 18
                }
            ],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        }
    },
    'gsi-seamless': {
        name: '地理院タイル（全国最新写真）',
        style: {
            version: 8,
            sources: {
                'gsi-seamless': {
                    type: 'raster',
                    tiles: [
                        'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
                    ],
                    tileSize: 256,
                    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>'
                }
            },
            layers: [
                {
                    id: 'gsi-seamless',
                    type: 'raster',
                    source: 'gsi-seamless',
                    minzoom: 0,
                    maxzoom: 18
                }
            ],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        }
    },
    'ryoseikoku': {
        name: '令制国',
        style: {
            version: 8,
            sources: {},
            layers: [],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        useGeoJSON: true,
        geoJSONPath: 'data/ryoseikoku.geojson'
    },
    'none': {
        name: '背景なし',
        style: {
            version: 8,
            sources: {},
            layers: [],
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        }
    }
};

/**
 * MapLibre地図の初期化
 */
function initMap() {
    // 画面サイズに応じて初期表示範囲を設定
    const isMobile = window.innerWidth <= 768;
    
    // 天龍寺の座標
    const tenryujiCoords = [135.673855636293695, 35.015832308485045];
    // 三条大橋の座標
    const sanjoCoords = [135.77177, 35.00906];
    // 草津宿の座標
    const kusatsuCoords = [135.95906296559636, 35.01592415444923];
    
    // 初期表示の中心座標とズームレベルを計算
    let initialCenter, initialZoom;
    
    if (isMobile) {
        // スマホサイズ: 天龍寺から草津宿まで広域表示（天龍寺が見切れないように）
        initialCenter = [
            (tenryujiCoords[0] + kusatsuCoords[0]) / 2,
            (tenryujiCoords[1] + kusatsuCoords[1]) / 2
        ];
        initialZoom = 9; // ズームレベルを一段下げて広域表示
    } else {
        // PCサイズ: 天龍寺から草津宿
        initialCenter = [
            (tenryujiCoords[0] + kusatsuCoords[0]) / 2,
            (tenryujiCoords[1] + kusatsuCoords[1]) / 2
        ];
        initialZoom = 10;
    }
    
    // 初期背景色を設定（令制国の場合は #264348）
    document.body.style.backgroundColor = '#264348';
    
    map = new maplibregl.Map({
        container: 'map',
        style: BASE_MAP_STYLES['ryoseikoku'].style, // 初期スタイルは「令制国」
        center: initialCenter,
        zoom: initialZoom,
        pitch: 0,
        bearing: 0,
        attributionControl: false // デフォルトのAttributionControlを無効化
    });
    
    // 地図読み込み完了後の処理
    map.on('load', () => {
        mapLogger.info('地図の読み込み完了');
        
        // 令制国のGeoJSONを読み込む
        const ryoseikokuConfig = BASE_MAP_STYLES['ryoseikoku'];
        if (ryoseikokuConfig.geoJSONPath) {
            loadRyoseikokuGeoJSON(ryoseikokuConfig.geoJSONPath);
        }
    });
    
    // ナビゲーションコントロール（ズーム・回転ボタン）を追加
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // カスタムAttributionControlを追加（初期表示は令制国なので表示なし、必要に応じて更新）
    const customAttribution = new maplibregl.AttributionControl({
        compact: false,
        customAttribution: '' // 令制国の場合は空
    });
    map.addControl(customAttribution, 'bottom-right');
    
    // スケールコントロールを追加（出典の上部に配置）
    map.addControl(new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
    }), 'bottom-right');
}

/**
 * 背景地図のスタイルを変更する
 * @param {string} styleKey - BASE_MAP_STYLES のキー
 */
function changeBaseMapStyle(styleKey) {
    if (!map) {
        mapLogger.error('Map object is not initialized');
        return;
    }
    
    const styleConfig = BASE_MAP_STYLES[styleKey];
    if (!styleConfig) {
        mapLogger.error(`Unknown style key: ${styleKey}`);
        return;
    }
    
    mapLogger.info(`背景地図を切り替え: ${styleKey}`);
    
    // 背景色を変更
    document.body.style.backgroundColor = styleKey === 'ryoseikoku' ? '#264348' : '#C9BA96';
    
    // 現在のスタイルを確認
    const currentStyle = map.getStyle();
    const isFromRekichizu = currentStyle && currentStyle.sprite && currentStyle.sprite.includes('rekichizu');
    
    // れきちずの場合は完全なスタイル変更が必要（MapLibre の制約）
    if (styleKey === 'rekichizu') {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const currentBearing = map.getBearing();
        const currentPitch = map.getPitch();
        
        const onStyleLoad = () => {
            if (!map.isStyleLoaded()) {
                setTimeout(onStyleLoad, 100);
                return;
            }
            
            map.jumpTo({
                center: currentCenter,
                zoom: currentZoom,
                bearing: currentBearing,
                pitch: currentPitch
            });
            
            // ルートとシュクバレイヤーを再追加
            if (typeof readdRouteLayer === 'function') {
                readdRouteLayer();
            }
        };
        
        map.once('idle', onStyleLoad);
        map.setStyle(styleConfig.style);
        return;
    }
    
    // れきちずから他のスタイルへ切り替える場合
    if (isFromRekichizu) {
        mapLogger.info('れきちずから切り替え: レイヤーをクリーンアップ');
        
        // れきちずのレイヤーを削除（route/syukuba以外）
        const allLayers = map.getStyle().layers;
        allLayers.forEach(layer => {
            const isRouteOrSyukuba = layer.id.startsWith('route-') || layer.id.startsWith('syukuba-');
            if (!isRouteOrSyukuba && map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        });
        
        // れきちずのソースを削除（route/syukuba以外）
        const allSources = Object.keys(map.getStyle().sources);
        allSources.forEach(sourceId => {
            if (sourceId !== 'route-source' && sourceId !== 'syukuba-source' && map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        });
    }
    
    // 既存の背景レイヤーとソースを削除
    const backgroundLayerIds = ['osm', 'gsi-std', 'gsi-english', 'gsi-seamless'];
    backgroundLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
    });
    
    const backgroundSourceIds = ['osm', 'gsi-std', 'gsi-english', 'gsi-seamless'];
    backgroundSourceIds.forEach(sourceId => {
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    });
    
    // 令制国レイヤーの表示/非表示を制御
    const ryoseikokuLayerIds = ['ryoseikoku-fill', 'ryoseikoku-line', 'ryoseikoku-label'];
    const showRyoseikoku = styleKey === 'ryoseikoku';
    
    ryoseikokuLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', showRyoseikoku ? 'visible' : 'none');
        }
    });
    
    // 令制国の場合で、まだレイヤーがない場合は追加
    if (showRyoseikoku && !map.getLayer('ryoseikoku-fill')) {
        if (styleConfig.geoJSONPath) {
            loadRyoseikokuGeoJSON(styleConfig.geoJSONPath);
        }
    }
    
    // 背景なしの場合は終了
    if (styleKey === 'none' || styleKey === 'ryoseikoku') {
        return;
    }
    
    // ラスタータイル背景（OSM、地理院タイル）の場合
    const newStyle = styleConfig.style;
    const sourceKey = Object.keys(newStyle.sources)[0];
    const layerConfig = newStyle.layers[0];
    
    // ルートレイヤーの前に挿入するため、最初のルートレイヤーを探す
    const routeLayerId = map.getLayer('route-layer-other') ? 'route-layer-other' : undefined;
    
    // 新しい背景ソースを追加
    if (!map.getSource(sourceKey)) {
        map.addSource(sourceKey, newStyle.sources[sourceKey]);
        mapLogger.info(`背景ソース追加: ${sourceKey}`);
    }
    
    // 新しい背景レイヤーを追加（ルートレイヤーの下に配置）
    if (!map.getLayer(layerConfig.id)) {
        map.addLayer(layerConfig, routeLayerId);
        mapLogger.info(`背景レイヤー追加: ${layerConfig.id}`);
    }
}

/**
 * 令制国のGeoJSONを読み込んで表示する
 * @param {string} geoJSONPath - GeoJSONファイルのパス
 */
function loadRyoseikokuGeoJSON(geoJSONPath) {
    mapLogger.info(`令制国GeoJSONの読み込み開始: ${geoJSONPath}`);
    
    fetch(geoJSONPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${geoJSONPath}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            mapLogger.info(`令制国GeoJSONの読み込み完了: ${data.features.length} features`);
            
            // ソースを追加
            if (!map.getSource('ryoseikoku-source')) {
                map.addSource('ryoseikoku-source', {
                    type: 'geojson',
                    data: data
                });
                mapLogger.info('令制国ソースを追加');
            }
            
            // ルートレイヤーがあればその前に、なければ最背面に配置
            const routeLayerId = map.getLayer('route-layer-other') ? 'route-layer-other' : undefined;
            
            // 塗りつぶしレイヤーを追加（最背面またはルートの前）
            if (!map.getLayer('ryoseikoku-fill')) {
                map.addLayer({
                    id: 'ryoseikoku-fill',
                    type: 'fill',
                    source: 'ryoseikoku-source',
                    paint: {
                        'fill-color': '#C9BA96',
                        'fill-opacity': 1
                    }
                }, routeLayerId);
                mapLogger.info('令制国塗りつぶしレイヤーを追加');
            }
            
            // 境界線レイヤーを追加
            if (!map.getLayer('ryoseikoku-line')) {
                map.addLayer({
                    id: 'ryoseikoku-line',
                    type: 'line',
                    source: 'ryoseikoku-source',
                    paint: {
                        'line-color': '#362F2D',
                        'line-width': 2
                    }
                }, routeLayerId);
                mapLogger.info('令制国境界線レイヤーを追加');
            }
            
            // ラベルレイヤーを追加
            if (!map.getLayer('ryoseikoku-label')) {
                map.addLayer({
                    id: 'ryoseikoku-label',
                    type: 'symbol',
                    source: 'ryoseikoku-source',
                    layout: {
                        'text-field': ['concat', ['get', '国名'], '国'],
                        'text-size': 20,
                        'text-font': ['Noto Sans CJK JP Regular'],
                        'text-writing-mode': ['vertical'],
                        'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
                        'text-radial-offset': 0.5,
                        'text-justify': 'auto',
                        'text-allow-overlap': false,
                        'text-optional': true
                    },
                    paint: {
                        'text-color': '#362F2D',
                        'text-halo-color': '#fff',
                        'text-halo-width': 2
                    }
                }, routeLayerId);
                mapLogger.info('令制国ラベルレイヤーを追加');
            }
        })
        .catch(error => {
            mapLogger.error('令制国GeoJSONの読み込みエラー:', error);
        });
}

