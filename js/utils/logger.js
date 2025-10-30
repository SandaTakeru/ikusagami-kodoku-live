// ========================================
// ログユーティリティ
// ========================================

/**
 * デバッグモード設定
 * 本番環境ではfalseに設定してログを無効化
 * URLパラメータ ?debug=true で一時的に有効化可能
 */
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

/**
 * ロガークラス
 */
class Logger {
    constructor(namespace) {
        this.namespace = namespace;
    }

    error(message, ...args) {
        console.error(`[${this.namespace}]`, message, ...args);
    }

    warn(message, ...args) {
        console.warn(`[${this.namespace}]`, message, ...args);
    }

    info(message, ...args) {
        if (DEBUG_MODE) {
            console.log(`[${this.namespace}]`, message, ...args);
        }
    }

    debug(message, ...args) {
        if (DEBUG_MODE) {
            console.debug(`[${this.namespace}]`, message, ...args);
        }
    }
}

/**
 * ロガーインスタンスを取得
 * @param {string} namespace - 名前空間
 * @returns {Logger} ロガーインスタンス
 */
function getLogger(namespace) {
    return new Logger(namespace);
}
