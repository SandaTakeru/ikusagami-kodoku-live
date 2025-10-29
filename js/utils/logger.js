// ========================================
// ログユーティリティ
// ========================================

/**
 * デバッグモード設定
 * 本番環境ではfalseに設定してログを無効化
 * URLパラメータ ?debug=true で一時的に有効化可能
 */
const urlParams = new URLSearchParams(window.location.search);
const DEBUG_MODE = urlParams.get('debug') === 'true' ? true : true; // 開発中はtrue、本番ではfalseに変更

/**
 * ログレベル
 */
const LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

/**
 * ロガークラス
 */
class Logger {
    constructor(namespace) {
        this.namespace = namespace;
    }

    /**
     * エラーログ（常に出力）
     */
    error(message, ...args) {
        console.error(`[${this.namespace}]`, message, ...args);
    }

    /**
     * 警告ログ（常に出力）
     */
    warn(message, ...args) {
        console.warn(`[${this.namespace}]`, message, ...args);
    }

    /**
     * 情報ログ（デバッグモード時のみ）
     */
    info(message, ...args) {
        if (DEBUG_MODE) {
            console.log(`ℹ️ [${this.namespace}]`, message, ...args);
        }
    }

    /**
     * デバッグログ（デバッグモード時のみ）
     */
    debug(message, ...args) {
        if (DEBUG_MODE) {
            console.debug(`🔍 [${this.namespace}]`, message, ...args);
        }
    }
}

// デバッグモードの状態を表示
if (DEBUG_MODE) {
    console.log('🐛 デバッグモード: 有効');
} else {
    console.log('🚀 本番モード: デバッグログは無効');
}

/**
 * ロガーインスタンスを取得
 * @param {string} namespace - 名前空間
 * @returns {Logger} ロガーインスタンス
 */
function getLogger(namespace) {
    return new Logger(namespace);
}

// グローバルに公開
window.Logger = Logger;
window.getLogger = getLogger;
