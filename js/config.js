// ========================================
// アプリケーション設定と状態管理
// ========================================

// ========================================
// 定数定義
// ========================================

/**
 * 時間範囲の設定
 * 明治11年5月5日0時 〜 明治11年6月7日0時
 */
const TIME_RANGE = {
    START: new Date(1878, 4, 5, 0, 0, 0),  // 月は0始まり
    END: new Date(1878, 5, 7, 0, 0, 0),
    get TOTAL_MS() {
        return this.END - this.START;
    }
};

// 後方互換性のためのエイリアス
const START_DATE = TIME_RANGE.START;
const END_DATE = TIME_RANGE.END;
const TOTAL_MILLISECONDS = TIME_RANGE.TOTAL_MS;

/**
 * 各巻の終了日時
 */
const VOLUME_END_DATES = {
    1: new Date(1878, 4, 9, 15, 0, 0),   // 明治11年5月9日15時
    2: new Date(1878, 4, 12, 15, 0, 0),  // 明治11年5月12日15時
    3: new Date(1878, 4, 20, 18, 0, 0),  // 明治11年5月20日18時
    4: new Date(1878, 5, 7, 0, 0, 0)     // 明治11年6月7日0時
};

/**
 * 各巻の初期日時（サイトアクセス時・ネタバレフィルタ変更時）
 */
const VOLUME_INITIAL_DATES = {
    1: new Date(1878, 4, 5, 0, 0, 0),    // 明治11年5月5日0時
    2: new Date(1878, 4, 9, 22, 0, 0),   // 明治11年5月9日22時
    3: new Date(1878, 4, 12, 12, 0, 0),  // 明治11年5月12日12時
    4: new Date(1878, 5, 5, 10, 0, 0)    // 明治11年6月5日10時
};

/**
 * 再生速度の設定
 * 実時間1秒あたりに進む仮想時間（分単位）
 */
const PLAYBACK = {
    SPEED_OPTIONS: [-60, -30, -5, -1, 1, 5, 30, 60, 180, 720, 1440],
    DEFAULT_SPEED_INDEX: 7  // デフォルトは60分（インデックス7）
};

// 後方互換性のためのエイリアス
const SPEED_OPTIONS = PLAYBACK.SPEED_OPTIONS;
const DEFAULT_SPEED_INDEX = PLAYBACK.DEFAULT_SPEED_INDEX;

// ========================================
// アプリケーション状態管理
// ========================================

/**
 * アプリケーションの状態を一元管理するオブジェクト
 */
const AppState = {
    // 再生状態
    isPlaying: false,
    animationFrame: null,
    
    // 速度設定
    speedIndex: PLAYBACK.DEFAULT_SPEED_INDEX,
    get playbackSpeed() {
        return PLAYBACK.SPEED_OPTIONS[this.speedIndex];
    },
    
    // キャラクター表示
    enabledCharacters: new Set(),
    
    // 巻数とタイムライン
    currentVolume: 1,
    get maxDate() {
        return VOLUME_END_DATES[this.currentVolume];
    }
};

// ========================================
// 状態更新関数
// ========================================

/**
 * 速度インデックスを更新
 * @param {number} newIndex - 新しい速度インデックス
 * @returns {boolean} 更新成功の場合true
 */
function updateSpeedIndex(newIndex) {
    if (newIndex >= 0 && newIndex < PLAYBACK.SPEED_OPTIONS.length) {
        AppState.speedIndex = newIndex;
        return true;
    }
    return false;
}

/**
 * 再生状態を更新
 * @param {boolean} playing - 再生中かどうか
 */
function setPlayingState(playing) {
    AppState.isPlaying = !!playing;
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
 * @returns {boolean} 更新成功の場合true
 */
function setCurrentVolume(volume) {
    if (volume >= 1 && volume <= 4) {
        AppState.currentVolume = volume;
        return true;
    }
    return false;
}
