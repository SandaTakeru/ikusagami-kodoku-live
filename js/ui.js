// ========================================
// UI制御
// ========================================

/**
 * UI翻訳テキスト
 */
window.UI_TEXTS = {
    ja: {
        siteTitle: 'イクサガミ蠱毒Live β',
        spoilerFilterTitle: 'ネタバレフィルタ',
        spoilerOptions: [
            'イクサガミ天（1巻読了）',
            'イクサガミ地（2巻読了）',
            'イクサガミ人（3巻読了）',
            'イクサガミ神（4巻読了）'
        ],
        languageTitle: '言語 / Language',
        baseMapTitle: '背景地図 / Base Map',
        baseMapButtons: {
            ryoseikoku: '令制国',
            none: '背景なし',
            rekichizu: 'れきちず',
            osm: 'OSM',
            gsiStd: '地理院タイル<br/>標準地図',
            gsiEnglish: 'GSI<br/>English',
            gsiSeamless: '地理院タイル<br/>全国最新写真'
        },
        characterFilterTitle: 'キャラクターフィルタ',
        trackingClose: '閉じる',
        trackingId: '木札No.',
        trackingScore: '点',
        trackingNoInfo: 'まだ蠱毒が開始されていません',
        playTitle: '再生/一時停止',
        speedDownTitle: '速度ダウン',
        speedUpTitle: '速度アップ',
        infoTitle: 'このサイトについて',
        infoContent: {
            title: 'このサイトについて',
            description: '当サイトは『イクサガミ』世界を地図で可視化した個人制作のファンサイトです。各キャラクターの現在位置や得点を、リアルタイムな地図アニメーションで表現しています。',
            copyright: '著作権は著者・出版社・制作会社・背景地図配信者に帰属します。商用利用・転載を禁じます。なお、権利者または関係各社からの修正・削除等の要請があった場合は、速やかかつ誠実に対応いたします。',
            note: '出典や使い方などの情報ページは準備中です。'
        },
        ampm: ['午前', '午後'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    en: {
        siteTitle: 'Last Samurai Standing<br>Kodoku Live β',
        spoilerFilterTitle: 'Spoiler Filter',
        spoilerOptions: [
            'Last Samurai Standing TEN (Vol.1)',
            'Last Samurai Standing CHI (Vol.2)',
            'Last Samurai Standing JIN (Vol.3)',
            'Last Samurai Standing SHIN (Vol.4)'
        ],
        languageTitle: '言語 / Language',
        baseMapTitle: '背景地図 / Base Map',
        baseMapButtons: {
            ryoseikoku: 'Ryoseikoku',
            none: 'No Base',
            rekichizu: 'Rekichizu',
            osm: 'OSM',
            gsiStd: 'GSI Standard',
            gsiEnglish: 'GSI<br/>English',
            gsiSeamless: 'GSI Photo'
        },
        characterFilterTitle: 'Character Filter',
        trackingClose: 'Close',
        trackingId: 'Tag No.',
        trackingScore: 'pt',
        trackingNoInfo: 'The Kodoku has not started yet',
        playTitle: 'Play/Pause',
        speedDownTitle: 'Slow Down',
        speedUpTitle: 'Speed Up',
        infoTitle: 'About',
        infoContent: {
            title: 'About This Site',
            description: 'This is a fan-made website that visualizes the world of "Last Samurai Standing" on a map. It represents the current positions and scores of each character through real-time map animations.',
            copyright: 'Copyright belongs to the author, publisher, production company, and base map providers. Commercial use and reproduction are prohibited. If there is a request for correction or deletion from the rights holder or related parties, we will respond promptly and sincerely.',
            note: 'Information pages about sources and usage are in preparation.'
        },
        ampm: ['AM', 'PM'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
};

/**
 * ハンバーガーメニューの初期化
 */
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const menuPanel = document.getElementById('menu-panel');
    
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        menuPanel.classList.toggle('show');
    });
    
    // メニュー外をクリックしたら閉じる
    document.addEventListener('click', (e) => {
        if (!document.getElementById('menu-container').contains(e.target)) {
            hamburgerBtn.classList.remove('active');
            menuPanel.classList.remove('show');
        }
    });
    
    // ウィンドウリサイズ時のみメニュー高さを再調整
    window.addEventListener('resize', () => {
        adjustMenuHeight();
    });
}

/**
 * メニューパネルの高さを時系列スライダーに被らないように調整
 */
function adjustMenuHeight() {
    const menuPanel = document.getElementById('menu-panel');
    const timelineContainer = document.querySelector('.timeline-container');
    
    if (!menuPanel || !timelineContainer) return;
    
    // ビューポートの高さ
    const viewportHeight = window.innerHeight;
    
    // メニューの上端位置（ハンバーガーボタンの下）
    const menuTop = menuPanel.offsetTop;
    
    // タイムラインの位置情報を取得
    const timelineRect = timelineContainer.getBoundingClientRect();
    const timelineTop = timelineRect.top;
    
    // メニューとタイムラインの間に最低限必要な余白（ピクセル）
    const minGap = 30;
    
    // 利用可能な最大高さを計算
    const maxHeight = timelineTop - menuTop - minGap;
    
    // 最小高さを設定（コンテンツが見えなくなりすぎないように）
    const minHeight = 200;
    
    // 計算した高さを適用（最小値との大きい方を採用）
    const finalHeight = Math.max(minHeight, maxHeight);
    menuPanel.style.maxHeight = `${finalHeight}px`;
    
    // キャラクターフィルタの高さも調整
    adjustCharacterFilterHeight();
}

/**
 * キャラクターフィルタの高さを動的に調整
 * メニューパネル内の他の要素を考慮して、残りスペースを最大限活用
 */
function adjustCharacterFilterHeight() {
    const menuPanel = document.getElementById('menu-panel');
    const characterFilters = document.getElementById('character-filters');
    
    if (!menuPanel || !characterFilters) return;
    
    // メニューパネルの最大高さを取得（CSSで設定された値）
    const menuPanelMaxHeight = parseFloat(menuPanel.style.maxHeight) || parseFloat(window.getComputedStyle(menuPanel).maxHeight);
    
    // キャラクターフィルタのセクション
    const filterSection = characterFilters.closest('.menu-section');
    if (!filterSection) return;
    
    // キャラクターフィルタのコントロールボタン（全選択/解除）の高さ
    const filterControls = filterSection.querySelector('.character-filter-controls');
    const controlsHeight = filterControls ? filterControls.offsetHeight : 0;
    
    // キャラクターフィルタより前にある全ての要素の高さを計算
    let usedHeight = 0;
    const allSections = menuPanel.querySelectorAll('.menu-section');
    
    for (const section of allSections) {
        if (section === filterSection) {
            // キャラクターフィルタのセクションに到達したら
            // セクション内のヘッダー（h4）の高さも含める
            const sectionHeader = section.querySelector('h4');
            if (sectionHeader) {
                usedHeight += sectionHeader.offsetHeight;
                // マージンも考慮
                const headerStyle = window.getComputedStyle(sectionHeader);
                usedHeight += parseFloat(headerStyle.marginTop) + parseFloat(headerStyle.marginBottom);
            }
            // コントロールボタンの高さも追加
            if (filterControls) {
                const controlsStyle = window.getComputedStyle(filterControls);
                usedHeight += controlsHeight;
                usedHeight += parseFloat(controlsStyle.marginTop) + parseFloat(controlsStyle.marginBottom);
            }
            break;
        } else {
            // 他のセクションの高さを加算
            usedHeight += section.offsetHeight;
            // セクション間のマージンも考慮
            const sectionStyle = window.getComputedStyle(section);
            usedHeight += parseFloat(sectionStyle.marginBottom);
        }
    }
    
    // メニューパネルのパディングも考慮
    const menuPanelStyle = window.getComputedStyle(menuPanel);
    const menuPadding = parseFloat(menuPanelStyle.paddingTop) + parseFloat(menuPanelStyle.paddingBottom);
    
    // キャラクターフィルタのパディング/マージンも考慮
    const filterStyle = window.getComputedStyle(characterFilters);
    const filterPadding = parseFloat(filterStyle.paddingTop) + parseFloat(filterStyle.paddingBottom);
    const filterMargin = parseFloat(filterStyle.marginTop) + parseFloat(filterStyle.marginBottom);
    
    // 余裕を持たせるための余白（最小限に）
    const extraPadding = 10;
    
    // キャラクターフィルタに割り当てられる高さを計算
    const availableHeight = menuPanelMaxHeight - usedHeight - menuPadding - filterPadding - filterMargin - extraPadding;
    
    // 最小高さ（少なくとも2-3個のキャラクターが見えるように）
    const minFilterHeight = 120;
    
    // 最大高さを適用
    const finalFilterHeight = Math.max(minFilterHeight, availableHeight);
    characterFilters.style.maxHeight = `${finalFilterHeight}px`;
}

/**
 * ネタバレフィルタの初期化
 */
function initSpoilerFilter() {
    const spoilerFilter = document.getElementById('spoiler-filter');
    
    spoilerFilter.addEventListener('change', (e) => {
        const readVolume = parseInt(e.target.value);
        applySpoilerFilter(readVolume);
    });
    
    // 初期値を適用
    const initialVolume = parseInt(spoilerFilter.value);
    applySpoilerFilter(initialVolume);
}

/**
 * ネタバレフィルタの適用
 * @param {number} readVolume - 既読巻数
 */
function applySpoilerFilter(readVolume) {
    // 既読巻数を更新
    if (typeof setCurrentVolume === 'function') {
        setCurrentVolume(readVolume);
    }
    
    // 時系列スライダーの範囲を更新
    if (typeof updateTimelineRange === 'function') {
        updateTimelineRange(readVolume);
    }
    
    // キャラクターフィルタを更新
    const currentLang = document.getElementById('lang-en').classList.contains('active') ? 'en' : 'ja';
    if (typeof initCharacterFilter === 'function') {
        initCharacterFilter(readVolume, currentLang);
    }
    
    // マーカーの表示/非表示を更新
    if (typeof updateCharacterMarkerVisibility === 'function') {
        updateCharacterMarkerVisibility();
    }
}

/**
 * 言語トグルの初期化
 */
function initLanguageToggle() {
    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    
    langJaBtn.addEventListener('click', () => {
        langJaBtn.classList.add('active');
        langEnBtn.classList.remove('active');
        
        // UI言語を更新
        updateUILanguage('ja');
        
        // キャラクターフィルタの言語を更新
        if (typeof updateCharacterFilterLanguage === 'function') {
            updateCharacterFilterLanguage('ja');
        }
        
        // マーカーの言語を更新
        if (typeof updateMarkerLanguage === 'function') {
            updateMarkerLanguage('ja');
        }
    });
    
    langEnBtn.addEventListener('click', () => {
        langEnBtn.classList.add('active');
        langJaBtn.classList.remove('active');
        
        // UI言語を更新
        updateUILanguage('en');
        
        // キャラクターフィルタの言語を更新
        if (typeof updateCharacterFilterLanguage === 'function') {
            updateCharacterFilterLanguage('en');
        }
        
        // マーカーの言語を更新
        if (typeof updateMarkerLanguage === 'function') {
            updateMarkerLanguage('en');
        }
    });
}

/**
 * UI言語の更新
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateUILanguage(lang) {
    // 現在の言語をグローバルに保存
    window.currentLanguage = lang;
    
    const texts = UI_TEXTS[lang];
    
    // サイトタイトル
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        siteTitle.innerHTML = texts.siteTitle;
    }
    
    // インフォメーションアイコンのタイトル
    const infoLink = document.getElementById('info-link');
    if (infoLink) {
        infoLink.title = texts.infoTitle;
    }
    
    // ネタバレフィルタセクション
    const spoilerTitle = document.querySelector('.menu-section:nth-of-type(1) h4');
    if (spoilerTitle) {
        spoilerTitle.textContent = texts.spoilerFilterTitle;
    }
    
    // ネタバレフィルタのオプション
    const spoilerSelect = document.getElementById('spoiler-filter');
    if (spoilerSelect) {
        const options = spoilerSelect.querySelectorAll('option');
        options.forEach((option, index) => {
            if (index < texts.spoilerOptions.length) {
                option.textContent = texts.spoilerOptions[index];
            }
        });
    }
    
    // 言語セクションタイトル（変更不要だが念のため）
    const langTitle = document.querySelector('.menu-section:nth-of-type(2) h4');
    if (langTitle) {
        langTitle.textContent = texts.languageTitle;
    }
    
    // 背景地図セクション
    const mapTitle = document.querySelector('.menu-section:nth-of-type(3) h4');
    if (mapTitle) {
        mapTitle.textContent = texts.baseMapTitle;
    }
    
    // 背景地図ボタン
    const mapRyoseikoku = document.getElementById('map-ryoseikoku');
    if (mapRyoseikoku) {
        mapRyoseikoku.innerHTML = texts.baseMapButtons.ryoseikoku;
    }
    
    const mapNone = document.getElementById('map-none');
    if (mapNone) {
        mapNone.innerHTML = texts.baseMapButtons.none;
    }
    
    const mapRekichizu = document.getElementById('map-rekichizu');
    if (mapRekichizu) {
        mapRekichizu.innerHTML = texts.baseMapButtons.rekichizu;
    }
    
    const mapOsm = document.getElementById('map-osm');
    if (mapOsm) {
        mapOsm.innerHTML = texts.baseMapButtons.osm;
    }
    
    const mapGsiStd = document.getElementById('map-gsi-std');
    const mapGsiEnglish = document.getElementById('map-gsi-english');
    
    // 言語に応じて地理院地図の標準版と英語版を切り替え
    if (lang === 'en') {
        // 英語モード: 標準版を非表示、英語版を表示
        if (mapGsiStd) {
            mapGsiStd.style.display = 'none';
        }
        if (mapGsiEnglish) {
            mapGsiEnglish.style.display = 'block';
            mapGsiEnglish.innerHTML = texts.baseMapButtons.gsiEnglish;
        }
    } else {
        // 日本語モード: 標準版を表示、英語版を非表示
        if (mapGsiStd) {
            mapGsiStd.style.display = 'block';
            mapGsiStd.innerHTML = texts.baseMapButtons.gsiStd;
        }
        if (mapGsiEnglish) {
            mapGsiEnglish.style.display = 'none';
        }
    }
    
    const mapGsiSeamless = document.getElementById('map-gsi-seamless');
    if (mapGsiSeamless) {
        mapGsiSeamless.innerHTML = texts.baseMapButtons.gsiSeamless;
    }
    
    // キャラクターフィルタセクション
    const characterTitle = document.querySelector('.menu-section:nth-of-type(4) h4');
    if (characterTitle) {
        characterTitle.textContent = texts.characterFilterTitle;
    }
    
    // トラッキングカードの閉じるボタン
    const trackingClose = document.getElementById('tracking-close');
    if (trackingClose) {
        trackingClose.title = texts.trackingClose;
    }
    
    // トラッキング情報を更新（現在トラッキング中の場合）
    if (typeof updateTrackingInfo === 'function' && typeof getCurrentTrackingCharacterId === 'function') {
        const trackingId = getCurrentTrackingCharacterId();
        if (trackingId) {
            updateTrackingInfo();
        }
    }
    
    // タイムラインコントロールのタイトル
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.title = texts.playTitle;
    }
    
    const speedDownBtn = document.getElementById('speed-down');
    if (speedDownBtn) {
        speedDownBtn.title = texts.speedDownTitle;
    }
    
    const speedUpBtn = document.getElementById('speed-up');
    if (speedUpBtn) {
        speedUpBtn.title = texts.speedUpTitle;
    }
    
    // 日時表示を更新（現在の言語で再描画）
    if (typeof updateDateTimeDisplay === 'function') {
        const slider = document.getElementById('timeline-slider');
        if (slider) {
            updateDateTimeDisplay(parseFloat(slider.value), lang);
        }
    }
}

/**
 * 背景地図トグルの初期化
 */
function initBaseMapToggle() {
    const mapButtons = {
        'rekichizu': document.getElementById('map-rekichizu'),
        'osm': document.getElementById('map-osm'),
        'gsi-std': document.getElementById('map-gsi-std'),
        'gsi-english': document.getElementById('map-gsi-english'),
        'gsi-seamless': document.getElementById('map-gsi-seamless'),
        'ryoseikoku': document.getElementById('map-ryoseikoku'),
        'none': document.getElementById('map-none')
    };
    
    // 各ボタンにイベントリスナーを設定
    Object.entries(mapButtons).forEach(([styleKey, button]) => {
        if (!button) return; // ボタンが存在しない場合はスキップ
        
        button.addEventListener('click', () => {
            // 全てのボタンのactiveクラスを削除
            Object.values(mapButtons).forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
            // クリックされたボタンにactiveクラスを追加
            button.classList.add('active');
            
            // 地図スタイルを変更
            if (typeof changeBaseMapStyle === 'function') {
                changeBaseMapStyle(styleKey);
            }
        });
    });
}

/**
 * インフォメーションリンクの初期化
 */
function initInfoLink() {
    const infoLink = document.getElementById('info-link');
    
    infoLink.addEventListener('click', (e) => {
        e.preventDefault();
        const texts = UI_TEXTS[window.currentLanguage || 'ja'];
        const info = texts.infoContent;
        alert(
            `${info.title}\n\n` +
            `${info.description}\n\n` +
            `${info.copyright}\n\n` +
            `${info.note}`
        );
    });
}
