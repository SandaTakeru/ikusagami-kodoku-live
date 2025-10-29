// ========================================
// 幾何計算ユーティリティ
// ========================================

/**
 * 2点間の座標を線形補間
 * @param {Array} coord1 - [lon, lat]
 * @param {Array} coord2 - [lon, lat]
 * @param {number} t - 補間係数 (0.0 ~ 1.0)
 * @returns {Array} 補間された座標 [lon, lat]
 */
function interpolateCoordinates(coord1, coord2, t) {
    return [
        coord1[0] + (coord2[0] - coord1[0]) * t,
        coord1[1] + (coord2[1] - coord1[1]) * t
    ];
}

/**
 * 2点間の距離を計算（Haversine公式）
 * @param {Array} coord1 - [lon, lat]
 * @param {Array} coord2 - [lon, lat]
 * @returns {number} 距離（メートル）
 */
function calculateDistance(coord1, coord2) {
    const R = 6371000; // 地球の半径（メートル）
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * ルート上の累積距離を計算
 * @param {Array} routeCoordinates - ルートの座標配列
 * @returns {Array} 各ポイントまでの累積距離の配列
 */
function calculateCumulativeDistances(routeCoordinates) {
    const distances = [0];
    let cumulative = 0;
    
    for (let i = 1; i < routeCoordinates.length; i++) {
        const dist = calculateDistance(routeCoordinates[i - 1], routeCoordinates[i]);
        cumulative += dist;
        distances.push(cumulative);
    }
    
    return distances;
}

/**
 * 指定距離における位置を取得
 * @param {number} targetDistance - 目標距離
 * @param {Array} routeCoordinates - ルート座標配列
 * @param {Array} cumulativeDistances - 累積距離配列
 * @returns {Array|null} [lon, lat] または null
 */
function getPositionAtDistance(targetDistance, routeCoordinates, cumulativeDistances) {
    if (!routeCoordinates || routeCoordinates.length === 0) {
        return null;
    }
    
    // 目標距離が範囲外の場合
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    if (targetDistance <= 0) {
        return routeCoordinates[0];
    }
    if (targetDistance >= totalDistance) {
        return routeCoordinates[routeCoordinates.length - 1];
    }
    
    // 目標距離を含むセグメントを探す
    for (let i = 1; i < cumulativeDistances.length; i++) {
        if (cumulativeDistances[i] >= targetDistance) {
            const segmentStart = cumulativeDistances[i - 1];
            const segmentEnd = cumulativeDistances[i];
            const segmentLength = segmentEnd - segmentStart;
            
            if (segmentLength === 0) {
                return routeCoordinates[i - 1];
            }
            
            const t = (targetDistance - segmentStart) / segmentLength;
            return interpolateCoordinates(routeCoordinates[i - 1], routeCoordinates[i], t);
        }
    }
    
    return routeCoordinates[routeCoordinates.length - 1];
}

// ========================================
// エクスポート（グローバルスコープに公開）
// ========================================
window.interpolateCoordinates = interpolateCoordinates;
window.calculateDistance = calculateDistance;
window.calculateCumulativeDistances = calculateCumulativeDistances;
window.getPositionAtDistance = getPositionAtDistance;
