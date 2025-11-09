// ========================================
// キャラクタートラッキング機能
// ========================================

const trackingLogger = getLogger('CharacterTracking');

/**
 * 現在トラッキング中のキャラクターID
 */
let currentTrackingCharacterId = null;

/**
 * トラッキングモードが有効かどうか
 */
let isTrackingMode = false;

/**
 * 各キャラクターの最後に表示した点数を記録
 */
const lastDisplayedScores = {};

/**
 * 前回のスライダー位置（巻き戻しを検知するため）
 */
let lastSliderPosition = 0;

/**
 * アクティブな点数変化ポップアップの情報
 * { characterId: { element, startTime } }
 */
const activeScorePopups = {};

/**
 * 日時をフォーマットする
 * @param {Date} date - フォーマットする日時
 * @returns {string} フォーマットされた日時文字列
 */
function formatDateTime(date) {
    const lang = window.currentLanguage || 'ja';
    const texts = UI_TEXTS[lang];
    
    if (lang === 'en') {
        // 英語: "May 5"
        const monthName = texts.months[date.getMonth()];
        const day = date.getDate();
        return `${monthName} ${day}`;
    } else {
        // 日本語: "5月5日"
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    }
}

/**
 * トラッキングカードの初期化
 */
function initializeTracking() {
    // 閉じるボタンのイベント
    const closeBtn = document.getElementById('tracking-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideTrackingCard);
    }

    // 前へボタンのイベント
    const prevBtn = document.getElementById('tracking-prev');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateTracking('prev'));
    }

    // 次へボタンのイベント
    const nextBtn = document.getElementById('tracking-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateTracking('next'));
    }

    // 初期状態では非表示
    hideTrackingCard();
    
    // 地図の移動・ズーム時にポップアップ位置を更新
    if (map) {
        map.on('move', updateAllScorePopupPositions);
        map.on('zoom', updateAllScorePopupPositions);
    }
}

/**
 * トラッキングカードを表示
 * @param {string} characterId - キャラクターID
 */
function showTrackingCard(characterId) {
    const character = CHARACTERS[characterId];
    if (!character) {
        trackingLogger.error(`Character ${characterId} not found`);
        return;
    }

    currentTrackingCharacterId = characterId;
    isTrackingMode = true;

    // カード要素を取得
    const card = document.getElementById('tracking-card');

    // カードの縁の色を設定
    card.style.setProperty('--tracking-color', character.color);

    // カードを表示
    card.style.display = 'block';

    // 現在の時系列位置に基づいて情報を更新
    updateTrackingInfo();
    
    // キャラクターの現在位置に地図を移動（初回は短いアニメーション）
    centerMapOnCharacter(characterId, false);
}

/**
 * トラッキングカードを非表示
 */
function hideTrackingCard() {
    const card = document.getElementById('tracking-card');
    card.style.display = 'none';
    
    // トラッキングカード用の点数変化表示を削除
    const cardScoreChange = card.querySelector('.tracking-card-score-change');
    if (cardScoreChange) {
        cardScoreChange.remove();
    }
    
    currentTrackingCharacterId = null;
    isTrackingMode = false;
}

/**
 * 地図をキャラクターの位置に中心移動
 * @param {string} characterId - キャラクターID
 * @param {boolean} instant - 即座に移動するか（デフォルト: true）
 */
function centerMapOnCharacter(characterId, instant = true) {
    if (!map || typeof getCharacterCurrentPosition !== 'function') {
        return;
    }
    
    const position = getCharacterCurrentPosition(characterId);
    if (position && position.geometry && position.geometry.coordinates) {
        const coords = position.geometry.coordinates;
        
        if (instant) {
            // アニメーションなしで即座に移動
            map.jumpTo({
                center: coords
            });
        } else {
            // 短いアニメーションで移動（初回表示時のみ）
            map.easeTo({
                center: coords,
                duration: 300,
                easing: (t) => t
            });
        }
    }
}

/**
 * トラッキング中のキャラクター情報を更新
 * （時系列スライダーが動いた時などに呼ばれる想定）
 */
function updateTrackingInfo() {
    // すべてのキャラクターの点数変化をチェック
    updateAllCharacterScores();
    
    // アクティブなポップアップの位置を更新
    updateAllScorePopupPositions();
    
    const pointsData = getAllPointsData();
    if (!currentTrackingCharacterId || !pointsData) {
        return;
    }
    
    // トラッキング中は常にキャラクターを画面中央に固定
    if (isTrackingMode) {
        centerMapOnCharacter(currentTrackingCharacterId, true);
    }

    const character = CHARACTERS[currentTrackingCharacterId];
    if (!character) return;

    // 現在の時刻を取得
    const slider = document.getElementById('timeline-slider');
    const percentage = parseFloat(slider.value);
    const currentMilliseconds = (percentage / 100) * TOTAL_MILLISECONDS;
    
    // START_DATEはnew Date(1878, 4, 5, 0, 0, 0)でローカルタイム（JST）として作成
    // 1878年当時の日本標準時はUTC+9:18:59だったため、
    // GeoJSON（現代のJST=UTC+9:00で作成）との比較のため18分59秒を補正
    const HISTORICAL_JST_OFFSET = 18 * 60 * 1000 + 59 * 1000; // 18分59秒
    const currentDate = new Date(START_DATE.getTime() + currentMilliseconds + HISTORICAL_JST_OFFSET);

    // このキャラクターの全ての地点データを取得
    const characterPoints = allPointsData.features.filter(
        feature => feature.properties.character_id === parseInt(currentTrackingCharacterId)
    );

    if (characterPoints.length === 0) {
        return;
    }

    // 現在時刻以前の地点を全て取得してソート
    const validPoints = characterPoints
        .filter(point => {
            const pointDate = new Date(point.properties.timestamp);
            return pointDate.getTime() <= currentDate.getTime();
        })
        .sort((a, b) => {
            // 新しい順にソート
            const dateA = new Date(a.properties.timestamp);
            const dateB = new Date(b.properties.timestamp);
            return dateB.getTime() - dateA.getTime();
        });

    // カード要素を更新
    const nameEl = document.getElementById('tracking-name');
    const idEl = document.getElementById('tracking-id');
    const scoreEl = document.getElementById('tracking-score');
    const lastInfoEl = document.getElementById('tracking-last-info');

    // 現在の言語を取得
    const lang = window.currentLanguage || 'ja';
    const texts = UI_TEXTS[lang];

    // キャラクター名とID
    nameEl.textContent = lang === 'en' ? character.nameEn : character.name;
    idEl.textContent = `${texts.trackingId} ${currentTrackingCharacterId}`;

    if (validPoints.length > 0) {
        // 最新の点数を表示（1件目）
        const latestPoint = validPoints[0];
        const score = latestPoint.properties.score;
        scoreEl.textContent = `${score} ${texts.trackingScore}`;

        // 全ての情報を表示
        const infoLines = [];
        
        for (let i = 0; i < validPoints.length; i++) {
            const point = validPoints[i];
            const pointDate = new Date(point.properties.timestamp);
            
            // 言語に応じてmemoまたはmemo_enを使用
            const memo = lang === 'en' 
                ? (point.properties.memo_en || point.properties.memo || 'No information')
                : (point.properties.memo || '情報なし');
            
            // pointDateから歴史的なJST補正分（18分59秒）を引いて表示
            const displayDate = new Date(pointDate.getTime() - HISTORICAL_JST_OFFSET);
            const dateTimeStr = formatDateTime(displayDate);
            
            infoLines.push(`${dateTimeStr}: ${memo}`);
        }
        
        // 改行で連結して表示
        lastInfoEl.textContent = infoLines.join('\n');
        
        // 点数変化をチェックして表示
        checkAndShowScoreChange(currentTrackingCharacterId, score);
    } else {
        // まだ情報がない場合
        scoreEl.textContent = `— ${texts.trackingScore}`;
        lastInfoEl.textContent = texts.trackingNoInfo;
    }
}

/**
 * すべてのキャラクターの点数変化をチェック
 */
function updateAllCharacterScores() {
    const pointsGeoJSON = getAllPointsData();
    if (!pointsGeoJSON) return;
    
    // スライダーの位置を取得
    const slider = document.getElementById('timeline-slider');
    const percentage = parseFloat(slider.value);
    
    // 巻き戻している場合は点数変化を表示しない
    const isRewinding = percentage < lastSliderPosition;
    lastSliderPosition = percentage;
    
    if (isRewinding) {
        // 巻き戻し時は点数を更新するが、表示はしない
        const svgMarkers = document.querySelectorAll('#interactive-markers g[data-character-id]');
        svgMarkers.forEach(marker => {
            const characterId = marker.getAttribute('data-character-id');
            if (!characterId) return;
            
            const currentMilliseconds = (percentage / 100) * TOTAL_MILLISECONDS;
            const HISTORICAL_JST_OFFSET = 18 * 60 * 1000 + 59 * 1000;
            const currentDate = new Date(START_DATE.getTime() + currentMilliseconds + HISTORICAL_JST_OFFSET);
            
            const characterPoints = pointsGeoJSON.features.filter(
                feature => feature.properties.character_id === parseInt(characterId)
            );
            
            if (characterPoints.length === 0) return;
            
            let latestPoint = null;
            for (const point of characterPoints) {
                const pointDate = new Date(point.properties.timestamp);
                
                if (pointDate.getTime() <= currentDate.getTime()) {
                    if (!latestPoint) {
                        latestPoint = point;
                    } else {
                        const latestDate = new Date(latestPoint.properties.timestamp);
                        if (pointDate.getTime() > latestDate.getTime()) {
                            latestPoint = point;
                        }
                    }
                }
            }
            
            if (latestPoint) {
                // 表示せずに点数だけ更新
                lastDisplayedScores[characterId] = latestPoint.properties.score;
            }
        });
        return;
    }
    
    // すべてのSVGマーカーのキャラクターをチェック
    const svgMarkers = document.querySelectorAll('#interactive-markers g[data-character-id]');
    svgMarkers.forEach(marker => {
        const characterId = marker.getAttribute('data-character-id');
        if (!characterId) return;
        
        // 現在の時刻を取得
        const percentage = parseFloat(slider.value);
        const currentMilliseconds = (percentage / 100) * TOTAL_MILLISECONDS;
        const HISTORICAL_JST_OFFSET = 18 * 60 * 1000 + 59 * 1000;
        const currentDate = new Date(START_DATE.getTime() + currentMilliseconds + HISTORICAL_JST_OFFSET);
        
        // このキャラクターの全ての地点データを取得
        const characterPoints = pointsGeoJSON.features.filter(
            feature => feature.properties.character_id === parseInt(characterId)
        );
        
        if (characterPoints.length === 0) return;
        
        // 現在時刻以前の最新の地点を取得
        let latestPoint = null;
        for (const point of characterPoints) {
            const pointDate = new Date(point.properties.timestamp);
            
            if (pointDate.getTime() <= currentDate.getTime()) {
                if (!latestPoint) {
                    latestPoint = point;
                } else {
                    const latestDate = new Date(latestPoint.properties.timestamp);
                    if (pointDate.getTime() > latestDate.getTime()) {
                        latestPoint = point;
                    }
                }
            }
        }
        
        if (latestPoint) {
            checkAndShowScoreChange(characterId, latestPoint.properties.score);
        }
    });
}

/**
 * 点数変化をチェックしてアイコン上に表示
 * @param {string} characterId - キャラクターID
 * @param {number} newScore - 新しい点数
 */
function checkAndShowScoreChange(characterId, newScore) {
    const lastScore = lastDisplayedScores[characterId];
    
    // 初回または点数が変化していない場合は何もしない
    if (lastScore === undefined || lastScore === newScore) {
        lastDisplayedScores[characterId] = newScore;
        return;
    }
    
    const scoreChange = newScore - lastScore;
    lastDisplayedScores[characterId] = newScore;
    
    // 点数変化を表示
    showScoreChangeOnIcon(characterId, scoreChange);
}

/**
 * キャラクターアイコンの上に点数変化を表示
 * @param {string} characterId - キャラクターID
 * @param {number} change - 点数の変化量
 */
function showScoreChangeOnIcon(characterId, change) {
    if (change === 0) return;
    
    // フィルタ状態を確認：フィルタで非表示の場合はポップアップを表示しない
    const numId = parseInt(characterId);
    const character = CHARACTERS[numId];
    if (!character) return;
    
    const isWithinVolume = character.volume <= AppState.currentVolume;
    const isEnabled = AppState.enabledCharacters.has(numId);
    const shouldShow = isWithinVolume && isEnabled;
    
    if (!shouldShow) {
        // フィルタで非表示の場合、既存のポップアップも削除
        if (activeScorePopups[characterId]) {
            const existing = activeScorePopups[characterId];
            if (existing.element && existing.element.parentNode) {
                existing.element.remove();
            }
            if (existing.cardElement && existing.cardElement.parentNode) {
                existing.cardElement.remove();
            }
            delete activeScorePopups[characterId];
        }
        return;
    }
    
    // 既存の点数変化表示を削除（同じキャラクターID用）
    if (activeScorePopups[characterId]) {
        const existing = activeScorePopups[characterId];
        if (existing.element && existing.element.parentNode) {
            existing.element.remove();
        }
        if (existing.cardElement && existing.cardElement.parentNode) {
            existing.cardElement.remove();
        }
        delete activeScorePopups[characterId];
    }
    
    // 新しい点数変化要素を作成（HTML要素として）
    const changeEl = document.createElement('div');
    changeEl.className = `score-change ${change > 0 ? 'positive' : 'negative'}`;
    changeEl.setAttribute('data-character-id', characterId);
    changeEl.textContent = change > 0 ? `+${change}` : `${change}`;
    changeEl.style.position = 'absolute';
    changeEl.style.pointerEvents = 'none';
    changeEl.style.zIndex = '800';
    
    // 地図コンテナに追加
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.appendChild(changeEl);
    }
    
    // トラッキングカード用の点数変化要素を作成（トラッキング中の場合）
    let cardChangeEl = null;
    if (isTrackingMode && currentTrackingCharacterId === characterId) {
        cardChangeEl = createTrackingCardScoreChange(change);
    }
    
    // アクティブなポップアップとして記録
    activeScorePopups[characterId] = {
        element: changeEl,
        cardElement: cardChangeEl,
        startTime: Date.now()
    };
    
    // 初期位置を設定
    updateScorePopupPosition(characterId);
    
    // 1秒後に削除
    setTimeout(() => {
        if (activeScorePopups[characterId] && activeScorePopups[characterId].element === changeEl) {
            changeEl.remove();
            if (cardChangeEl && cardChangeEl.parentNode) {
                cardChangeEl.remove();
            }
            delete activeScorePopups[characterId];
        }
    }, 1000);
}

/**
 * トラッキングカードに点数変化を表示
 * @param {number} change - 点数の変化量
 * @returns {HTMLElement} 作成した要素
 */
function createTrackingCardScoreChange(change) {
    const trackingScore = document.getElementById('tracking-score');
    if (!trackingScore) return null;
    
    // 既存のトラッキングカード用点数変化を削除
    const existingCardChange = trackingScore.parentElement.querySelector('.tracking-card-score-change');
    if (existingCardChange) {
        existingCardChange.remove();
    }
    
    // 新しい点数変化要素を作成
    const cardChangeEl = document.createElement('div');
    cardChangeEl.className = `score-change tracking-card-score-change ${change > 0 ? 'positive' : 'negative'}`;
    cardChangeEl.textContent = change > 0 ? `+${change}` : `${change}`;
    cardChangeEl.style.position = 'absolute';
    cardChangeEl.style.pointerEvents = 'none';
    cardChangeEl.style.zIndex = '1000'; // トラッキングカード(900)の前面
    cardChangeEl.style.left = '95%';
    cardChangeEl.style.top = '-30px';
    cardChangeEl.style.transform = 'translateX(-50%)';
    
    // tracking-headerに追加（相対位置指定のため）
    const trackingHeader = trackingScore.closest('.tracking-header');
    if (trackingHeader) {
        // tracking-headerをrelative配置に設定
        trackingHeader.style.position = 'relative';
        trackingHeader.appendChild(cardChangeEl);
    }
    
    return cardChangeEl;
}

/**
 * 点数変化ポップアップの位置を更新
 * @param {string} characterId - キャラクターID
 */
function updateScorePopupPosition(characterId) {
    const popup = activeScorePopups[characterId];
    if (!popup || !popup.element) return;
    
    // フィルタ状態を確認：非表示の場合はポップアップを削除
    const numId = parseInt(characterId);
    const character = CHARACTERS[numId];
    if (character) {
        const isWithinVolume = character.volume <= AppState.currentVolume;
        const isEnabled = AppState.enabledCharacters.has(numId);
        const shouldShow = isWithinVolume && isEnabled;
        
        if (!shouldShow) {
            // フィルタで非表示の場合、ポップアップを削除
            if (popup.element && popup.element.parentNode) {
                popup.element.remove();
            }
            if (popup.cardElement && popup.cardElement.parentNode) {
                popup.cardElement.remove();
            }
            delete activeScorePopups[characterId];
            return;
        }
    }
    
    // SVGマーカーを取得
    const marker = document.querySelector(`#interactive-markers g[data-character-id="${characterId}"]`);
    if (!marker) return;
    
    // マーカーのcircle要素から位置を取得（半径20または23の円を探す）
    const circle = marker.querySelector('circle[r="20"]') || marker.querySelector('circle[r="23"]');
    if (!circle) return;
    
    const cx = parseFloat(circle.getAttribute('cx'));
    const cy = parseFloat(circle.getAttribute('cy'));
    
    // ポップアップの位置を更新（マーカーの上に配置）
    popup.element.style.left = `${cx}px`;
    popup.element.style.top = `${cy - 30}px`;
}

/**
 * すべてのアクティブな点数変化ポップアップの位置を更新
 */
function updateAllScorePopupPositions() {
    Object.keys(activeScorePopups).forEach(characterId => {
        updateScorePopupPosition(characterId);
    });
}

/**
 * フィルタで非表示になったキャラクターのポップアップをクリーンアップ
 */
function cleanupHiddenScorePopups() {
    Object.keys(activeScorePopups).forEach(characterId => {
        const numId = parseInt(characterId);
        const character = CHARACTERS[numId];
        if (!character) return;
        
        const isWithinVolume = character.volume <= AppState.currentVolume;
        const isEnabled = AppState.enabledCharacters.has(numId);
        const shouldShow = isWithinVolume && isEnabled;
        
        // フィルタで非表示の場合、ポップアップを削除
        if (!shouldShow) {
            const popup = activeScorePopups[characterId];
            if (popup) {
                if (popup.element && popup.element.parentNode) {
                    popup.element.remove();
                }
                if (popup.cardElement && popup.cardElement.parentNode) {
                    popup.cardElement.remove();
                }
                delete activeScorePopups[characterId];
            }
        }
    });
}

/**
 * 現在トラッキング中のキャラクターIDを取得
 * @returns {string|null} キャラクターID
 */
function getCurrentTrackingCharacterId() {
    return currentTrackingCharacterId;
}

/**
 * 表示中のキャラクターIDのリストを取得（ID順でソート）
 * @returns {number[]} 表示中のキャラクターIDの配列
 */
function getVisibleCharacterIds() {
    const visibleIds = [];
    
    // AppStateから有効なキャラクターを取得
    if (typeof AppState !== 'undefined' && AppState.enabledCharacters) {
        AppState.enabledCharacters.forEach(id => {
            const character = CHARACTERS[id];
            if (character && character.volume <= AppState.currentVolume) {
                visibleIds.push(id);
            }
        });
    }
    
    // ID順でソート
    return visibleIds.sort((a, b) => a - b);
}

/**
 * トラッキング対象を前後に切り替え
 * @param {string} direction - 'prev' または 'next'
 */
function navigateTracking(direction) {
    if (!currentTrackingCharacterId) return;
    
    const visibleIds = getVisibleCharacterIds();
    if (visibleIds.length === 0) return;
    
    const currentId = parseInt(currentTrackingCharacterId);
    const currentIndex = visibleIds.indexOf(currentId);
    
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'prev') {
        // 前のキャラクターへ（最初の場合は最後に戻る）
        nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleIds.length - 1;
    } else {
        // 次のキャラクターへ（最後の場合は最初に戻る）
        nextIndex = currentIndex < visibleIds.length - 1 ? currentIndex + 1 : 0;
    }
    
    const nextCharacterId = visibleIds[nextIndex].toString();
    showTrackingCard(nextCharacterId);
}


// ========================================
// エクスポート（グローバルスコープに公開）
// ========================================
window.initializeTracking = initializeTracking;
window.showTrackingCard = showTrackingCard;
window.hideTrackingCard = hideTrackingCard;
window.updateTrackingInfo = updateTrackingInfo;
window.getCurrentTrackingCharacterId = getCurrentTrackingCharacterId;
window.updateAllScorePopupPositions = updateAllScorePopupPositions;
window.cleanupHiddenScorePopups = cleanupHiddenScorePopups;

// トラッキング状態を外部から参照できるように
Object.defineProperty(window, 'currentTrackingCharacterId', {
    get: function() { return currentTrackingCharacterId; },
    enumerable: true
});
