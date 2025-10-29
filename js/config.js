// ========================================
// グローバル設定と定数
// ========================================

/**
 * 時間範囲の設定
 * 明治11年5月5日0時 〜 明治11年6月7日0時
 */
const START_DATE = new Date(1878, 4, 5, 0, 0, 0); // 月は0始まり
const END_DATE = new Date(1878, 5, 7, 0, 0, 0);
const TOTAL_MILLISECONDS = END_DATE - START_DATE;

/**
 * 各巻の終了日時
 */
const VOLUME_END_DATES = {
    1: new Date(1878, 4, 9, 15, 0, 0),  // 明治11年5月9日15時
    2: new Date(1878, 4, 12, 15, 0, 0), // 明治11年5月12日15時
    3: new Date(1878, 4, 30, 15, 0, 0), // 明治11年5月30日15時
    4: new Date(1878, 5, 7, 0, 0, 0)    // 明治11年6月7日0時
};

/**
 * 再生速度の設定
 * 実時間1秒あたりに進む仮想時間（分単位）
 * 1分、5分、30分、60分、180分、720分、1440分
 */
const SPEED_OPTIONS = [-60, -30, -5, -1, 1, 5, 30, 60, 180, 720, 1440];
const DEFAULT_SPEED_INDEX = 7; // デフォルトは60分（インデックス7）

/**
 * アプリケーション状態
 */
const AppState = {
    isPlaying: false,
    animationFrame: null,
    speedIndex: DEFAULT_SPEED_INDEX,
    playbackSpeed: SPEED_OPTIONS[DEFAULT_SPEED_INDEX],
    enabledCharacters: new Set(),
    currentVolume: 1, // 現在の既読巻数
    maxDate: VOLUME_END_DATES[1] // 現在の最大日時
};

/**
 * 速度インデックスを更新
 * @param {number} newIndex - 新しい速度インデックス
 */
function updateSpeedIndex(newIndex) {
    if (newIndex >= 0 && newIndex < SPEED_OPTIONS.length) {
        AppState.speedIndex = newIndex;
        AppState.playbackSpeed = SPEED_OPTIONS[newIndex];
        return true;
    }
    return false;
}

/**
 * 再生状態を更新
 * @param {boolean} playing - 再生中かどうか
 */
function setPlayingState(playing) {
    AppState.isPlaying = playing;
}

/**
 * アニメーションフレームIDを設定
 * @param {number|null} frameId - アニメーションフレームID
 */
function setAnimationFrame(frameId) {
    AppState.animationFrame = frameId;
}

/**
 * 既読巻数を更新
 * @param {number} volume - 既読巻数（1-4）
 */
function setCurrentVolume(volume) {
    if (volume >= 1 && volume <= 4) {
        AppState.currentVolume = volume;
        AppState.maxDate = VOLUME_END_DATES[volume];
        return true;
    }
    return false;
}
