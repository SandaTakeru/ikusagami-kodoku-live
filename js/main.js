// ========================================
// アプリケーションエントリーポイント
// ========================================

const mainLogger = getLogger('Main');

/**
 * アプリケーション初期化
 * 
 * 初期化フェーズ:
 * 1. UI要素の初期化と表示（最優先）
 * 2. 地図の初期化（バックグラウンド）
 * 3. ルート表示の初期化
 * 4. キャラクターマーカーの初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    mainLogger.info('イクサガミ蠱毒マップ 初期化開始');
    
    // ========================================
    // フェーズ1: UI要素の初期化
    // ========================================
    
    initializeUIComponents();
    
    // ========================================
    // フェーズ2: 地図の初期化
    // ========================================
    
    initializeMapComponent();
    
    // ========================================
    // フェーズ3: ルート表示の初期化
    // ========================================
    
    initializeRouteDisplay();
    
    // ========================================
    // フェーズ4: キャラクターマーカーの初期化
    // ========================================
    
    initializeCharacterMarkersWithRetry();
});

/**
 * UIコンポーネントを初期化
 */
function initializeUIComponents() {
    // ハンバーガーメニュー
    if (typeof initHamburgerMenu === 'function') {
        initHamburgerMenu();
    }
    
    // ネタバレフィルタ
    if (typeof initSpoilerFilter === 'function') {
        initSpoilerFilter();
    }
    
    // 言語トグル
    if (typeof initLanguageToggle === 'function') {
        initLanguageToggle();
    }
    
    // 言語検出と初期設定
    const detectedLang = typeof detectUserLanguage === 'function' ? detectUserLanguage() : 'ja';
    if (typeof updateUILanguage === 'function') {
        updateUILanguage(detectedLang);
    }
    
    // 背景地図トグル
    if (typeof initBaseMapToggle === 'function') {
        initBaseMapToggle();
    }
    
    // タイムラインスライダー
    if (typeof initTimelineSlider === 'function') {
        initTimelineSlider();
    }
    
    // インフォリンク
    if (typeof initInfoLink === 'function') {
        initInfoLink();
    }
    
    // キャラクターフィルタ
    const initialVolume = parseInt(document.getElementById('spoiler-filter').value);
    if (typeof initCharacterFilter === 'function') {
        initCharacterFilter(initialVolume, detectedLang);
    }
    
    // メニューパネルの高さ調整
    setTimeout(() => {
        if (typeof adjustMenuHeight === 'function') {
            adjustMenuHeight();
        }
    }, UI_CONSTANTS?.MENU_ADJUST_DELAY_MS || 100);
    
    // キャラクタートラッキング
    if (typeof initializeTracking === 'function') {
        initializeTracking();
    }
}

/**
 * 地図コンポーネントを初期化
 */
function initializeMapComponent() {
    if (typeof initMap === 'function') {
        initMap();
    }
}

/**
 * ルート表示を初期化
 */
function initializeRouteDisplay() {
    if (typeof initRouteDisplay === 'function') {
        const waitForMap = () => {
            if (map) {
                initRouteDisplay();
            } else {
                const checkInterval = UI_CONSTANTS?.MAP_INIT_CHECK_INTERVAL_MS || 100;
                setTimeout(waitForMap, checkInterval);
            }
        };
        waitForMap();
    }
}

/**
 * キャラクターマーカーをリトライ機能付きで初期化
 */
function initializeCharacterMarkersWithRetry() {
    if (typeof initCharacterMarkers !== 'function') return;
    
    let markersInitialized = false;
    
    const initMarkers = () => {
        if (markersInitialized) return;
        markersInitialized = true;
        
        initCharacterMarkers()
            .then(() => {
                mainLogger.info('全ての初期化が完了しました');
            })
            .catch(err => {
                mainLogger.error('キャラクターマーカー初期化エラー:', err);
            });
    };
    
    // 地図が既に準備できている場合
    if (map && map.isStyleLoaded()) {
        initMarkers();
        return;
    }
    
    // 地図のロードイベントを監視
    if (map) {
        map.on('load', initMarkers);
        
        // タイムアウト: 最長で一定時間後に強制初期化
        const timeout = UI_CONSTANTS?.MARKER_INIT_TIMEOUT_MS || 500;
        setTimeout(() => {
            if (!markersInitialized && map) {
                initMarkers();
            }
        }, timeout);
    } else {
        // 地図オブジェクト作成を待つ
        const checkInterval = UI_CONSTANTS?.MAP_INIT_CHECK_INTERVAL_MS || 100;
        setTimeout(() => {
            if (!markersInitialized && map) {
                if (map.isStyleLoaded()) {
                    initMarkers();
                } else {
                    map.on('load', initMarkers);
                }
            }
        }, checkInterval);
    }
}

