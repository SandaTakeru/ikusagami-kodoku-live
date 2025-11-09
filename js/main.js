// ========================================
// メインエントリーポイント
// ========================================

const mainLogger = getLogger('Main');

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    mainLogger.info('イクサガミ蠱毒マップ 初期化開始');
    
    // ========================================
    // フェーズ1: UI要素を最優先で初期化・表示
    // ========================================
    
    // 各UIコンポーネントの初期化
    if (typeof initHamburgerMenu === 'function') {
        initHamburgerMenu();
    }
    if (typeof initSpoilerFilter === 'function') {
        initSpoilerFilter();
    }
    
    // 言語トグルを初期化（ブラウザ言語設定を検出して自動設定）
    if (typeof initLanguageToggle === 'function') {
        initLanguageToggle();
    }
    
    // 検出された言語でUI言語を設定
    const detectedLang = typeof detectUserLanguage === 'function' ? detectUserLanguage() : 'ja';
    if (typeof updateUILanguage === 'function') {
        updateUILanguage(detectedLang);
    }
    
    if (typeof initBaseMapToggle === 'function') {
        initBaseMapToggle();
    }
    if (typeof initTimelineSlider === 'function') {
        initTimelineSlider();
    }
    if (typeof initInfoLink === 'function') {
        initInfoLink();
    }
    
    // キャラクターフィルタの初期化（検出された言語を使用）
    const initialVolume = parseInt(document.getElementById('spoiler-filter').value);
    if (typeof initCharacterFilter === 'function') {
        initCharacterFilter(initialVolume, detectedLang);
    }
    
    // メニューパネルの高さを初期設定（画面サイズに応じた最大長に）
    setTimeout(() => {
        if (typeof adjustMenuHeight === 'function') {
            adjustMenuHeight();
        }
    }, 100);
    
    // キャラクタートラッキングの初期化
    if (typeof initializeTracking === 'function') {
        initializeTracking();
    }
    
    // ========================================
    // フェーズ2: 地図の初期化（バックグラウンドで実行）
    // ========================================
    
    // MapLibre地図の初期化（背景地図の読み込み開始）
    if (typeof initMap === 'function') {
        initMap();
    }
    
    // ========================================
    // フェーズ3: ルート表示の初期化
    // ========================================
    
    if (typeof initRouteDisplay === 'function') {
        // 地図が準備できるまで待機してから初期化
        const waitForMap = () => {
            if (map) {
                initRouteDisplay();
            } else {
                setTimeout(waitForMap, 100);
            }
        };
        waitForMap();
    }
    
    // ========================================
    // フェーズ4: キャラクターマーカーの初期化（ルートの後、または早期タイムアウト）
    // ========================================
    
    if (typeof initCharacterMarkers === 'function') {
        let markersInitialized = false;
        
        const initMarkers = () => {
            if (markersInitialized) return;
            markersInitialized = true;
            
            initCharacterMarkers().then(() => {
                mainLogger.info('全ての初期化が完了しました');
            }).catch(err => {
                mainLogger.error('キャラクターマーカー初期化エラー:', err);
            });
        };
        
        if (map && map.isStyleLoaded()) {
            initMarkers();
        } else if (map) {
            map.on('load', initMarkers);
            // タイムアウト: 最長500msでキャラクターマーカーを表示（高速化）
            setTimeout(() => {
                if (!markersInitialized && map) {
                    initMarkers();
                }
            }, 500);
        }
        
        // 地図オブジェクトの作成を待つ追加タイムアウト
        if (!map) {
            setTimeout(() => {
                if (!markersInitialized && map) {
                    if (map.isStyleLoaded()) {
                        initMarkers();
                    } else {
                        map.on('load', initMarkers);
                    }
                }
            }, 200);
        }
    }
});
