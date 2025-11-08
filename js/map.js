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
        const viewState = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch()
        };
        
        // スタイル変更後にビューステートとレイヤーを復元
        map.once('styledata', () => {
            map.jumpTo(viewState);
            if (typeof readdRouteLayer === 'function') {
                readdRouteLayer();
            }
        });
        
        map.setStyle(styleConfig.style);
        return;
    }
    
    // れきちずから他のスタイルへ切り替える場合
    if (isFromRekichizu) {
        mapLogger.debug('れきちずのレイヤーをクリーンアップ');
        
        // れきちずのレイヤーを削除（line/syukuba/landmark以外）
        map.getStyle().layers.forEach(layer => {
            const isLineOrSyukubaOrLandmark = layer.id.startsWith('line-') || 
                                               layer.id.startsWith('syukuba-') || 
                                               layer.id.startsWith('landmark-');
            if (!isLineOrSyukubaOrLandmark && map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        });
        
        // れきちずのソースを削除（straight-lines/syukuba/landmark以外）
        Object.keys(map.getStyle().sources).forEach(sourceId => {
            if (sourceId !== 'straight-lines-source' && 
                sourceId !== 'syukuba-source' && 
                sourceId !== 'landmark-source' && 
                map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        });
    }
    
    // 既存の背景レイヤーとソースを削除
    const backgroundIds = ['osm', 'gsi-std', 'gsi-english', 'gsi-seamless'];
    backgroundIds.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
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
    
    // 新しい背景ソースを追加
    if (!map.getSource(sourceKey)) {
        map.addSource(sourceKey, newStyle.sources[sourceKey]);
    }
    
    // 新しい背景レイヤーを追加（最下層に配置）
    if (!map.getLayer(layerConfig.id)) {
        const firstLayer = map.getStyle().layers[0];
        map.addLayer(layerConfig, firstLayer ? firstLayer.id : undefined);
    }
    
    // ルートとシュクバレイヤーを再追加して最前面に
    if (typeof readdRouteLayer === 'function') {
        readdRouteLayer();
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
            mapLogger.info(`令制国データ読み込み完了: ${data.features.length}件`);
            
            // ソースを追加
            if (!map.getSource('ryoseikoku-source')) {
                map.addSource('ryoseikoku-source', {
                    type: 'geojson',
                    data: data
                });
            }
            
            // 直線レイヤーがあればその前に、なければ最背面に配置
            const lineLayerId = map.getLayer('line-layer-other') ? 'line-layer-other' : undefined;
            
            // 塗りつぶしレイヤーを追加（最背面または直線レイヤーの前）
            if (!map.getLayer('ryoseikoku-fill')) {
                map.addLayer({
                    id: 'ryoseikoku-fill',
                    type: 'fill',
                    source: 'ryoseikoku-source',
                    paint: {
                        'fill-color': '#C9BA96',
                        'fill-opacity': 1
                    }
                }, lineLayerId);
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
                }, lineLayerId);
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
                        'text-writing-mode': ['vertical'],
                        'symbol-placement': 'point',
                        'symbol-avoid-edges': true,
                        'text-variable-anchor': ['center'],
                        'text-radial-offset': 0,
                        'text-justify': 'auto',
                        'text-allow-overlap': false,
                        'text-optional': true,
                        'text-padding': 100,
                        'symbol-spacing': 500
                    },
                    paint: {
                        'text-color': '#362F2D',
                        'text-halo-color': '#fff',
                        'text-halo-width': 2
                    }
                }, lineLayerId);
            }
            
            // 直線レイヤーとシュクバレイヤーが追加されていない場合は追加
            if (!lineLayerId && typeof readdRouteLayer === 'function') {
                mapLogger.info('令制国ロード後に直線レイヤーを追加');
                setTimeout(() => {
                    if (map.isStyleLoaded()) {
                        readdRouteLayer();
                    }
                }, 100);
            }
        })
        .catch(error => {
            mapLogger.error('令制国GeoJSONの読み込みエラー:', error);
        });
}

/**
 * マップラベルの言語を更新
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateMapLabelsLanguage(lang) {
    if (!map) {
        console.error('Map is not initialized');
        return;
    }
    
    console.log(`Starting language update to: ${lang}`);
    
    try {
        // 令制国ラベル
        if (map.getLayer('ryoseikoku-label')) {
            const textField = lang === 'en' 
                ? ['get', 'en_国名']
                : ['concat', ['get', '国名'], '国'];
            const writingMode = lang === 'en' ? [] : ['vertical'];
            
            console.log('Updating ryoseikoku-label with:', { textField, writingMode });
            map.setLayoutProperty('ryoseikoku-label', 'text-field', textField);
            map.setLayoutProperty('ryoseikoku-label', 'text-writing-mode', writingMode);
            console.log('✓ ryoseikoku-label updated');
        } else {
            console.warn('ryoseikoku-label layer not found');
        }
        
        // 宿場ラベル（通常）
        if (map.getLayer('syukuba-label')) {
            const fieldName = lang === 'en' ? 'en_name' : '宿場名';
            map.setLayoutProperty('syukuba-label', 'text-field', ['get', fieldName]);
            console.log('✓ syukuba-label updated');
        }
        
        // 宿場ラベル（関所）
        if (map.getLayer('syukuba-checkpoint-label')) {
            const fieldName = lang === 'en' ? 'en_name' : '宿場名';
            map.setLayoutProperty('syukuba-checkpoint-label', 'text-field', ['get', fieldName]);
            console.log('✓ syukuba-checkpoint-label updated');
        }
        
        // 宿場ラベル（関所・太字）
        if (map.getLayer('syukuba-sekisho-label')) {
            const fieldName = lang === 'en' ? 'en_name' : '宿場名';
            const writingMode = lang === 'en' ? [] : ['vertical'];
            map.setLayoutProperty('syukuba-sekisho-label', 'text-field', ['get', fieldName]);
            map.setLayoutProperty('syukuba-sekisho-label', 'text-writing-mode', writingMode);
            console.log('✓ syukuba-sekisho-label updated');
        }
        
        // 宿場の点数ラベル（関所）
        if (map.getLayer('syukuba-sekisho-point-label')) {
            const textField = lang === 'en' 
                ? ['concat', ['get', '蠱毒通過点数'], ' pts']
                : ['concat', ['get', '漢字_蠱毒通過点数'], '点'];
            const writingMode = lang === 'en' ? [] : ['vertical'];
            map.setLayoutProperty('syukuba-sekisho-point-label', 'text-field', textField);
            map.setLayoutProperty('syukuba-sekisho-point-label', 'text-writing-mode', writingMode);
            console.log('✓ syukuba-sekisho-point-label updated');
        }
        
        // ランドマークラベル
        if (map.getLayer('landmark-label')) {
            const fieldName = lang === 'en' ? 'en_名前' : '名前';
            map.setLayoutProperty('landmark-label', 'text-field', ['get', fieldName]);
            console.log('✓ landmark-label updated');
        }
        
        mapLogger.info(`Map labels updated to ${lang}`);
        console.log(`Language update completed: ${lang}`);
    } catch (error) {
        console.error('Failed to update map labels:', error);
        mapLogger.error('Failed to update map labels:', error);
    }
}

// グローバルに公開
window.updateMapLabelsLanguage = updateMapLabelsLanguage;

