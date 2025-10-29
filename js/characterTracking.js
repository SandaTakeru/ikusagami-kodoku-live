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
 * 日時をフォーマットする
 * @param {Date} date - フォーマットする日時
 * @returns {string} フォーマットされた日時文字列
 */
function formatDateTime(date) {
    // 月日のみのシンプルな表示
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${month}月${day}日`;
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

    // 初期状態では非表示
    hideTrackingCard();
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
    // すべてのデバッグアイコンのキャラクターの点数変化をチェック
    updateAllCharacterScores();
    
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

    // キャラクター名とID
    nameEl.textContent = character.name;
    idEl.textContent = `木札No. ${currentTrackingCharacterId}`;

    if (validPoints.length > 0) {
        // 最新の点数を表示（1件目）
        const latestPoint = validPoints[0];
        const score = latestPoint.properties.score;
        scoreEl.textContent = `${score} 点`;

        // 全ての情報を表示
        const infoLines = [];
        
        for (let i = 0; i < validPoints.length; i++) {
            const point = validPoints[i];
            const pointDate = new Date(point.properties.timestamp);
            const memo = point.properties.memo || '情報なし';
            
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
        scoreEl.textContent = '— 点';
        lastInfoEl.textContent = 'まだ蠱毒が開始されていません';
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
        const debugIcons = document.querySelectorAll('.debug-icon');
        debugIcons.forEach(icon => {
            const characterId = icon.getAttribute('data-character-id');
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
    
    // すべてのデバッグアイコンのキャラクターをチェック
    const debugIcons = document.querySelectorAll('.debug-icon');
    debugIcons.forEach(icon => {
        const characterId = icon.getAttribute('data-character-id');
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
    
    // デバッグアイコンを取得
    const icon = document.querySelector(`.debug-icon[data-character-id="${characterId}"]`);
    if (!icon) return;
    
    // 既存の点数変化表示を削除
    const existingChange = icon.querySelector('.score-change');
    if (existingChange) {
        existingChange.remove();
    }
    
    // 新しい点数変化要素を作成
    const changeEl = document.createElement('div');
    changeEl.className = `score-change ${change > 0 ? 'positive' : 'negative'}`;
    changeEl.textContent = change > 0 ? `+${change}` : `${change}`;
    
    // アイコンに追加
    icon.appendChild(changeEl);
    
    // 1秒後に削除
    setTimeout(() => {
        changeEl.remove();
    }, 1000);
}

/**
 * 現在トラッキング中のキャラクターIDを取得
 * @returns {string|null} キャラクターID
 */
function getCurrentTrackingCharacterId() {
    return currentTrackingCharacterId;
}

// ========================================
// エクスポート（グローバルスコープに公開）
// ========================================
window.initializeTracking = initializeTracking;
window.showTrackingCard = showTrackingCard;
window.hideTrackingCard = hideTrackingCard;
window.updateTrackingInfo = updateTrackingInfo;
window.getCurrentTrackingCharacterId = getCurrentTrackingCharacterId;

// トラッキング状態を外部から参照できるように
Object.defineProperty(window, 'currentTrackingCharacterId', {
    get: function() { return currentTrackingCharacterId; },
    enumerable: true
});
