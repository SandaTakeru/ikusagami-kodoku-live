// ========================================
// グローバル変数
// ========================================
let map = null; // MapLibre地図オブジェクト
let isPlaying = false;
let animationFrame = null;

// 再生速度の設定（実時間1秒あたりに進む仮想時間：分単位）
const SPEED_OPTIONS = [-60, -30, -5, -1, 1, 5, 30, 60, 180, 720, 1440]; // 1分、5分、30分、60分、180分、720分、1440分
let speedIndex = 7; // デフォルトは60分（インデックス7）
let playbackSpeed = SPEED_OPTIONS[speedIndex];

// 時間範囲の設定（明治11年5月5日0時 〜 明治11年6月7日0時）
const START_DATE = new Date(1878, 4, 5, 0, 0, 0); // 月は0始まり
const END_DATE = new Date(1878, 5, 7, 0, 0, 0);
const TOTAL_MILLISECONDS = END_DATE - START_DATE;

// ========================================
// 背景地図スタイルの定義
// ========================================
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
            ]
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
            ]
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
            ]
        }
    },
    'ryoseikoku': {
        name: '令制国',
        style: {
            version: 8,
            sources: {},
            layers: []
        }
    },
    'none': {
        name: '背景なし',
        style: {
            version: 8,
            sources: {},
            layers: []
        }
    }
};

// ========================================
// ハンバーガーメニュー
// ========================================
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
}

// ========================================
// ネタバレフィルタ
// ========================================
function initSpoilerFilter() {
    const spoilerFilter = document.getElementById('spoiler-filter');
    
    spoilerFilter.addEventListener('change', (e) => {
        const readVolume = parseInt(e.target.value);
        // TODO: マップ上の表示を既読巻に応じてフィルタリング
        applySpoilerFilter(readVolume);
    });
    
    // 初期値を適用
    const initialVolume = parseInt(spoilerFilter.value);
    applySpoilerFilter(initialVolume);
}

// ネタバレフィルタの適用
function applySpoilerFilter(readVolume) {
    // キャラクターフィルタを更新
    const currentLang = document.getElementById('lang-en').classList.contains('active') ? 'en' : 'ja';
    if (typeof initCharacterFilter === 'function') {
        initCharacterFilter(readVolume, currentLang);
    }
    
    // TODO: 地図上のレイヤーやポイントの表示/非表示を制御
    // 例: 
    // - 0巻: ルートと宿場のみ表示
    // - 1巻: 一巻の内容まで表示
    // - 2巻: 二巻の内容まで表示
    // - 3巻: 三巻の内容まで表示
    // - 4巻: すべて表示
}

// ========================================
// 言語トグル
// ========================================
function initLanguageToggle() {
    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    
    langJaBtn.addEventListener('click', () => {
        langJaBtn.classList.add('active');
        langEnBtn.classList.remove('active');
        
        // キャラクターフィルタの言語を更新
        if (typeof updateCharacterFilterLanguage === 'function') {
            updateCharacterFilterLanguage('ja');
        }
    });
    
    langEnBtn.addEventListener('click', () => {
        langEnBtn.classList.add('active');
        langJaBtn.classList.remove('active');
        
        // キャラクターフィルタの言語を更新
        if (typeof updateCharacterFilterLanguage === 'function') {
            updateCharacterFilterLanguage('en');
        }
    });
}

// ========================================
// 背景地図切り替え
// ========================================
function initBaseMapToggle() {
    const mapButtons = {
        'rekichizu': document.getElementById('map-rekichizu'),
        'osm': document.getElementById('map-osm'),
        'gsi-std': document.getElementById('map-gsi-std'),
        'gsi-seamless': document.getElementById('map-gsi-seamless'),
        'ryoseikoku': document.getElementById('map-ryoseikoku'),
        'none': document.getElementById('map-none')
    };
    
    Object.entries(mapButtons).forEach(([styleKey, button]) => {
        if (!button) return; // ボタンが存在しない場合はスキップ
        
        button.addEventListener('click', () => {
            // 全てのボタンから active クラスを削除
            Object.values(mapButtons).forEach(btn => btn && btn.classList.remove('active'));
            
            // クリックされたボタンに active クラスを追加
            button.classList.add('active');
            
            // 地図スタイルを変更
            changeBaseMapStyle(styleKey);
        });
    });
}

/**
 * 背景地図のスタイルを変更する
 * @param {string} styleKey - BASE_MAP_STYLES のキー
 */
function changeBaseMapStyle(styleKey) {
    if (!map) {
        console.error('Map object is not initialized');
        return;
    }
    
    const styleConfig = BASE_MAP_STYLES[styleKey];
    if (!styleConfig) {
        console.error(`Unknown style key: ${styleKey}`);
        return;
    }
    
    // 背景色を変更（令制国の場合のみ #264348、それ以外は #C9BA96）
    document.body.style.backgroundColor = styleKey === 'ryoseikoku' ? '#264348' : '#C9BA96';
    
    // 現在の地図の状態を保存
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    
    // スタイルを変更
    map.setStyle(styleConfig.style);
    
    // スタイル変更完了後に状態を復元し、データレイヤーを再追加
    map.once('styledata', () => {
        // カメラ位置を復元
        map.jumpTo({
            center: currentCenter,
            zoom: currentZoom,
            bearing: currentBearing,
            pitch: currentPitch
        });
        
        // データレイヤーの再追加
        // TODO: GeoJSONデータソースとレイヤーを再追加する処理を実装
        // 例: addDataLayers();
    });
}

// ========================================
// 時系列スライダー
// ========================================
function initTimelineSlider() {
    const slider = document.getElementById('timeline-slider');
    const playBtn = document.getElementById('play-btn');
    const speedDownBtn = document.getElementById('speed-down');
    const speedUpBtn = document.getElementById('speed-up');
    
    // スライダー変更時
    slider.addEventListener('input', (e) => {
        const percentage = e.target.value;
        updateDateTime(percentage);
    });
    
    // 再生/一時停止ボタン
    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        togglePlayButton(isPlaying);
        
        if (isPlaying) {
            startAnimation();
        } else {
            stopAnimation();
        }
    });
    
    // 速度ダウンボタン
    speedDownBtn.addEventListener('click', () => {
        if (speedIndex > 0) {
            speedIndex--;
            playbackSpeed = SPEED_OPTIONS[speedIndex];
            updateSpeedDisplay();
        }
    });
    
    // 速度アップボタン
    speedUpBtn.addEventListener('click', () => {
        if (speedIndex < SPEED_OPTIONS.length - 1) {
            speedIndex++;
            playbackSpeed = SPEED_OPTIONS[speedIndex];
            updateSpeedDisplay();
        }
    });
    
    // 初期表示
    updateDateTime(0);
}

// 再生/一時停止ボタンの表示切り替え
function togglePlayButton(playing) {
    const iconPlay = document.querySelector('.icon-play');
    const iconPause = document.querySelector('.icon-pause');
    
    if (playing) {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
    } else {
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
    }
}

// 速度表示の更新（速度変更時のログ出力用）
function updateSpeedDisplay() {
    // 速度表示の更新処理（必要に応じて実装）
}

// アニメーション開始
function startAnimation() {
    const slider = document.getElementById('timeline-slider');
    let lastTimestamp = null;
    
    function animate(timestamp) {
        if (!isPlaying) return;
        
        if (lastTimestamp === null) {
            lastTimestamp = timestamp;
        }
        
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // スライダーの進行
        // 実時間1秒あたり、playbackSpeed分だけ仮想時間を進める
        // 総期間に対する割合を計算してパーセンテージに変換
        const virtualMinutesPerSecond = playbackSpeed; // 分/秒
        const virtualMillisecondsPerSecond = virtualMinutesPerSecond * 60 * 1000;
        const percentagePerSecond = (virtualMillisecondsPerSecond / TOTAL_MILLISECONDS) * 100;
        const increment = (deltaTime / 1000) * percentagePerSecond;
        
        let currentValue = parseFloat(slider.value);
        currentValue += increment;
        
        // 終端に達したら停止
        if (currentValue >= 100) {
            currentValue = 100;
            isPlaying = false;
            togglePlayButton(false);
        }
        
        slider.value = currentValue;
        updateDateTime(currentValue);
        
        if (isPlaying) {
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
}

// アニメーション停止
function stopAnimation() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

// 日時表示の更新
function updateDateTime(percentage) {
    const currentMilliseconds = (percentage / 100) * TOTAL_MILLISECONDS;
    const currentDate = new Date(START_DATE.getTime() + currentMilliseconds);
    
    // 日付のフォーマット（0埋め）
    const year = '明治11年';
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}月${day}日`;
    
    // 時刻のフォーマット（午前/午後 + 0埋め）
    let hours = currentDate.getHours();
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '午前' : '午後';
    const displayHours = String(hours).padStart(2, '0');
    const timeStr = `${ampm}${displayHours}時${minutes}分`;
    
    // 表示更新
    const dateElement = document.querySelector('.datetime-date');
    const timeElement = document.querySelector('.datetime-time');
    
    if (dateElement && timeElement) {
        dateElement.textContent = dateStr;
        timeElement.textContent = timeStr;
    }
}

// ========================================
// インフォメーションリンク
// ========================================
function initInfoLink() {
    const infoLink = document.getElementById('info-link');
    
    infoLink.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: 別ページへのリンクを実装
        alert('このサイトについて\n\n当サイトは個人作成のファンサイトです。著者や出版社とは一切の関係がありません。出典や使い方などの情報ページは準備中です。');
    });
}

// ========================================
// キャラクターフィルタイベントハンドラ
// ========================================
document.addEventListener('characterFilterChanged', (e) => {
    const { characterId, enabled, enabledCharacters } = e.detail;
    
    // TODO: 地図上のキャラクターマーカーの表示/非表示を制御
    // 例: map.setLayoutProperty(`character-${characterId}`, 'visibility', enabled ? 'visible' : 'none');
});

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('イクサガミ蠱毒マップ 初期化開始');
    
    // MapLibre地図の初期化
    initMap();
    
    // 各コンポーネントの初期化
    initHamburgerMenu();
    initSpoilerFilter();
    initLanguageToggle();
    initBaseMapToggle();
    initTimelineSlider();
    initInfoLink();
    
    // キャラクターフィルタの初期化
    const initialVolume = parseInt(document.getElementById('spoiler-filter').value);
    if (typeof initCharacterFilter === 'function') {
        initCharacterFilter(initialVolume, 'ja');
    }
    
    console.log('初期化完了');
});

// ========================================
// MapLibre地図の初期化
// ========================================
function initMap() {
    // 初期背景色を設定（令制国の場合は #264348）
    document.body.style.backgroundColor = '#264348';
    
    map = new maplibregl.Map({
        container: 'map',
        style: BASE_MAP_STYLES['ryoseikoku'].style, // 初期スタイルは「令制国」
        center: [135.678, 35.011], // 初期中心座標（京都：天龍寺〜三条大橋周辺）
        zoom: 13, // 初期ズームレベル
        pitch: 0,
        bearing: 0
    });
    
    // 地図読み込み完了後の処理
    map.on('load', () => {
        console.log('地図の読み込み完了');
        
        // TODO: GeoJSONデータの読み込みとレイヤーの追加
        // 例:
        // addDataLayers();
    });
    
    // ナビゲーションコントロール（ズーム・回転ボタン）を追加
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // スケールコントロールを追加
    map.addControl(new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
    }), 'bottom-left');
}
