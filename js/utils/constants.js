// ========================================
// 共通定数定義
// ========================================

/**
 * MapLibreスタイル定数
 */
const MAP_CONSTANTS = {
    // 初期カメラ位置（京都：天龍寺〜三条大橋周辺）
    INITIAL_CENTER: [135.678, 35.011],
    INITIAL_ZOOM: 13,
    INITIAL_PITCH: 0,
    INITIAL_BEARING: 0,
    
    // 背景色
    BG_COLOR_RYOSEIKOKU: '#264348',
    BG_COLOR_DEFAULT: '#C9BA96'
};

/**
 * UI定数
 */
const UI_CONSTANTS = {
    // アニメーション
    MENU_ADJUST_DELAY_MS: 100,
    MARKER_INIT_TIMEOUT_MS: 500,
    MAP_INIT_CHECK_INTERVAL_MS: 100,
    
    // メニュー
    MIN_MENU_HEIGHT_PX: 200,
    MENU_TIMELINE_GAP_PX: 30
};

/**
 * GeoJSONデータファイルパス
 */
const DATA_FILES = {
    LINES: './data/line.geojson',
    ROUTES: './data/route.geojson',
    SYUKUBA: './data/syukuba.geojson',
    LANDMARK: './data/landmark.geojson',
    POINTS: './data/points.geojson',
    RYOSEIKOKU: './data/ryoseikoku.geojson'
};
