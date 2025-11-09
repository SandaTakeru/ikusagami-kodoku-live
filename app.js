// ========================================
// アプリケーションエントリーポイント
// ========================================

/**
 * グローバル変数
 */
window.currentLanguage = 'ja'; // 現在の言語設定（'ja' または 'en'）

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    const mainLogger = getLogger('App');
    mainLogger.info('イクサガミ蠱毒マップ 初期化開始');
    
    try {
        // MapLibre地図の初期化
        await initializeMap();
        
        // 各UIコンポーネントの初期化
        if (typeof initHamburgerMenu === 'function') {
            initHamburgerMenu();
        }
        
        if (typeof initSpoilerFilter === 'function') {
            initSpoilerFilter();
        }
        
        // 言語トグルの初期化
        if (typeof initLanguageToggle === 'function') {
            initLanguageToggle();
        }
        
        // 言語検出と初期設定
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
        
        // キャラクターフィルタの初期化
        const initialVolume = parseInt(document.getElementById('spoiler-filter').value);
        if (typeof initCharacterFilter === 'function') {
            initCharacterFilter(initialVolume);
        }
        
        // メニュー高さ調整
        setTimeout(() => {
            if (typeof adjustMenuHeight === 'function') {
                adjustMenuHeight();
            }
        }, 100);
        
        // トラッキング機能の初期化
        if (typeof initializeTracking === 'function') {
            initializeTracking();
        }
        
        mainLogger.info('初期化完了');
    } catch (error) {
        mainLogger.error('初期化エラー:', error);
    }
});

