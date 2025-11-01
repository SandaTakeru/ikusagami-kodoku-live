// ========================================
// 時系列コントロール
// ========================================

/**
 * 時系列スライダーの初期化
 */
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
        const newState = !AppState.isPlaying;
        setPlayingState(newState);
        togglePlayButton(newState);
        
        if (newState) {
            startAnimation();
        } else {
            stopAnimation();
        }
    });
    
    // 速度ダウンボタン
    speedDownBtn.addEventListener('click', () => {
        if (updateSpeedIndex(AppState.speedIndex - 1)) {
            updateSpeedDisplay();
        }
    });
    
    // 速度アップボタン
    speedUpBtn.addEventListener('click', () => {
        if (updateSpeedIndex(AppState.speedIndex + 1)) {
            updateSpeedDisplay();
        }
    });
    
    // 初期表示
    updateDateTime(0);
    updateSpeedDisplay();
    
    // 初期のスライダー範囲を設定
    updateTimelineRange(AppState.currentVolume);
}

/**
 * 再生/一時停止ボタンの表示切り替え
 * @param {boolean} playing - 再生中かどうか
 */
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

/**
 * 速度表示の更新
 */
function updateSpeedDisplay() {
    const speedDisplay = document.getElementById('speed-display');
    const speed = AppState.playbackSpeed;
    
    if (speedDisplay) {
        speedDisplay.textContent = `×${speed}min`;
    }
}

/**
 * アニメーション開始
 */
function startAnimation() {
    const slider = document.getElementById('timeline-slider');
    let lastTimestamp = null;
    
    function animate(timestamp) {
        if (!AppState.isPlaying) return;
        
        if (lastTimestamp === null) {
            lastTimestamp = timestamp;
        }
        
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // スライダーの進行
        // 実時間1秒あたり、playbackSpeed分だけ仮想時間を進める
        const virtualMillisecondsPerSecond = AppState.playbackSpeed * 60 * 1000;
        const percentagePerSecond = (virtualMillisecondsPerSecond / TOTAL_MILLISECONDS) * 100;
        const increment = (deltaTime / 1000) * percentagePerSecond;
        
        let currentValue = parseFloat(slider.value);
        currentValue += increment;
        
        // 現在の巻数に応じた最大値を計算
        const maxDate = AppState.maxDate;
        const maxMilliseconds = maxDate - START_DATE;
        const maxPercentage = (maxMilliseconds / TOTAL_MILLISECONDS) * 100;
        
        // 終端に達したら停止
        if (currentValue >= maxPercentage) {
            currentValue = maxPercentage;
            setPlayingState(false);
            togglePlayButton(false);
        }
        
        slider.value = currentValue;
        updateDateTime(currentValue);
        
        if (AppState.isPlaying) {
            const frameId = requestAnimationFrame(animate);
            setAnimationFrame(frameId);
        }
    }
    
    const frameId = requestAnimationFrame(animate);
    setAnimationFrame(frameId);
}

/**
 * アニメーション停止
 */
function stopAnimation() {
    if (AppState.animationFrame) {
        cancelAnimationFrame(AppState.animationFrame);
        setAnimationFrame(null);
    }
}

/**
 * 日時表示の更新
 * @param {number} percentage - 0-100のパーセンテージ
 */
function updateDateTime(percentage) {
    // 現在の言語を取得
    const currentLang = document.getElementById('lang-en').classList.contains('active') ? 'en' : 'ja';
    updateDateTimeDisplay(percentage, currentLang);
}

/**
 * 日時表示の更新（言語対応版）
 * @param {number} percentage - 0-100のパーセンテージ
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateDateTimeDisplay(percentage, lang = 'ja') {
    const currentMilliseconds = (percentage / 100) * TOTAL_MILLISECONDS;
    const currentDate = new Date(START_DATE.getTime() + currentMilliseconds);
    
    let dateStr, timeStr;
    
    if (lang === 'en') {
        // 英語: 西暦表示
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
        
        // 時刻のフォーマット（AM/PM + 0埋め）
        const hours = currentDate.getHours();
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ampm = hours < 12 ? 'AM' : 'PM';
        const displayHours = String(hours % 12 || 12).padStart(2, '0');
        timeStr = `${ampm} ${displayHours}:${minutes}`;
    } else {
        // 日本語: 明治表示
        const year = '明治11年';
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dateStr = `${year}${month}月${day}日`;
        
        // 時刻のフォーマット（午前/午後 + 0埋め）
        const hours = currentDate.getHours();
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ampm = hours < 12 ? '午前' : '午後';
        const displayHours = String(hours).padStart(2, '0');
        timeStr = `${ampm}${displayHours}時${minutes}分`;
    }
    
    // 表示更新
    const dateElement = document.querySelector('.datetime-date');
    const timeElement = document.querySelector('.datetime-time');
    
    if (dateElement && timeElement) {
        dateElement.textContent = dateStr;
        timeElement.textContent = timeStr;
    }
    
    // キャラクターマーカーの位置を更新
    if (typeof updateCharacterPositions === 'function') {
        updateCharacterPositions(currentDate);
    }
    
    // トラッキングカードの情報も更新
    if (typeof updateTrackingInfo === 'function') {
        updateTrackingInfo();
    }
    
    // 天文条件の更新
    if (typeof updateAstronomyDisplay === 'function') {
        updateAstronomyDisplay(currentDate, lang);
    }
}

/**
 * 天文条件の表示を更新（絵文字アイコン）
 * @param {Date} currentDate - 現在の日時
 * @param {string} lang - 言語コード ('ja' or 'en')
 */
function updateAstronomyDisplay(currentDate, lang = 'ja') {
    // astronomyData.jsのgetAstronomyConditions関数を使用
    if (typeof getAstronomyConditions !== 'function') {
        return;
    }
    
    const conditions = getAstronomyConditions(currentDate);
    const iconElement = document.getElementById('astronomy-icon');
    
    if (!iconElement) {
        return;
    }
    
    // 日の出・日の入り時刻をDateオブジェクトに変換
    const sunriseTime = parseTimeStringForConditions(currentDate, conditions.sunrise);
    const sunsetTime = parseTimeStringForConditions(currentDate, conditions.sunset);
    
    // 日の出・日の入りの前後0.5時間の範囲を計算
    const halfHourMs = 30 * 60 * 1000; // 30分のミリ秒
    const sunriseStart = new Date(sunriseTime.getTime() - halfHourMs);
    const sunriseEnd = new Date(sunriseTime.getTime() + halfHourMs);
    const sunsetStart = new Date(sunsetTime.getTime() - halfHourMs);
    const sunsetEnd = new Date(sunsetTime.getTime() + halfHourMs);

    // 絵文字とツールチップテキストを条件に応じて変更
    let emoji = '';
    let tooltipText = '';
    
    // 日の出前後1時間の判定
    if (currentDate >= sunriseStart && currentDate < sunriseEnd) {
        emoji = '🌅';
        tooltipText = lang === 'ja' ? `日の出（${conditions.sunrise}）` : `Sunrise (${conditions.sunrise})`;
    }
    // 日の入り前後1時間の判定
    else if (currentDate >= sunsetStart && currentDate < sunsetEnd) {
        emoji = '🌇';
        tooltipText = lang === 'ja' ? `日の入り（${conditions.sunset}）` : `Sunset (${conditions.sunset})`;
    }
    // 通常の日中
    else if (conditions.isDaytime) {
        emoji = '☀️';
        tooltipText = lang === 'ja' ? '日中' : 'Daytime';
    }
    // 月が見える時
    else if (conditions.isMoonVisible) {
        emoji = getMoonPhaseEmoji(conditions.moonPhase);
        const moonPhaseName = getMoonPhaseName(conditions.moonPhase, lang);
        tooltipText = lang === 'ja' 
            ? `${moonPhaseName}（月齢${conditions.moonAge.toFixed(1)}）`
            : `${moonPhaseName} (Age: ${conditions.moonAge.toFixed(1)})`;
    }
    // 夜間（星のみ）
    else {
        emoji = '✨';
        tooltipText = lang === 'ja' ? '夜間' : 'Night';
    }
    
    iconElement.textContent = emoji;
    iconElement.setAttribute('title', tooltipText);
}

/**
 * 時刻文字列(HH:MM)を現在日付のDateオブジェクトに変換
 * @param {Date} baseDate - 基準となる日付
 * @param {string} timeStr - 時刻文字列 (HH:MM)
 * @returns {Date} 時刻を設定したDateオブジェクト
 */
function parseTimeStringForConditions(baseDate, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * 時系列スライダーの範囲を更新
 * @param {number} volume - 既読巻数（1-4）
 */
function updateTimelineRange(volume) {
    const slider = document.getElementById('timeline-slider');
    if (!slider) return;
    
    // 巻数に応じた終了日時を取得
    const maxDate = VOLUME_END_DATES[volume];
    const maxMilliseconds = maxDate - START_DATE;
    const maxPercentage = (maxMilliseconds / TOTAL_MILLISECONDS) * 100;
    
    // 現在のスライダー位置を取得
    const currentValue = parseFloat(slider.value);
    
    // スライダーの最大値を更新
    slider.max = maxPercentage;
    
    // 現在位置が新しい最大値を超えていたら、最大値に設定
    if (currentValue > maxPercentage) {
        slider.value = maxPercentage;
        updateDateTime(maxPercentage);
    }
}


