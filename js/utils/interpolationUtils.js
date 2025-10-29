// ========================================
// ルート補間ユーティリティ
// ========================================

/**
 * ルート上の距離情報キャッシュ（グローバル）
 */
const routeInterpolationCache = {};

/**
 * 東海道のルート上で2点間を補間
 * @param {Array} startCoord - 開始座標 [lon, lat]
 * @param {Array} endCoord - 終了座標 [lon, lat]
 * @param {number} startTime - 開始時刻のタイムスタンプ
 * @param {number} endTime - 終了時刻のタイムスタンプ
 * @param {number} targetTime - 対象時刻のタイムスタンプ
 * @returns {Array|null} 補間された座標 [lon, lat]
 */
function interpolateAlongTokaido(startCoord, endCoord, startTime, endTime, targetTime) {
    // ルートデータが利用可能か確認
    if (typeof routeData === 'undefined' || !routeData || !routeData.features) {
        return null;
    }
    
    // 東海道のルートを取得（id: 1）
    const tokaidoFeature = routeData.features.find(f => f.properties.id === 1);
    if (!tokaidoFeature || !tokaidoFeature.geometry || !tokaidoFeature.geometry.coordinates) {
        return null;
    }
    
    const tokaidoCoords = tokaidoFeature.geometry.coordinates[0]; // MultiLineStringの最初の配列
    if (!tokaidoCoords || tokaidoCoords.length < 2) {
        return null;
    }
    
    // キャッシュキーを生成
    const cacheKey = `${startCoord.join(',')}_${endCoord.join(',')}`;
    
    // キャッシュから取得または計算
    if (!routeInterpolationCache[cacheKey]) {
        // 開始点と終了点の東海道上の最近接点を探す
        const startProjection = findNearestPointOnLine(startCoord, tokaidoCoords);
        const endProjection = findNearestPointOnLine(endCoord, tokaidoCoords);
        
        if (!startProjection || !endProjection) {
            return null;
        }
        
        // 2点間のルート部分を抽出
        const routeSegment = extractRouteSegment(
            tokaidoCoords,
            startProjection.index,
            startProjection.t,
            endProjection.index,
            endProjection.t
        );
        
        if (!routeSegment || routeSegment.length < 2) {
            return null;
        }
        
        // 累積距離を計算
        const cumulativeDists = calculateCumulativeDistances(routeSegment);
        
        routeInterpolationCache[cacheKey] = {
            segment: routeSegment,
            cumulativeDistances: cumulativeDists,
            totalDistance: cumulativeDists[cumulativeDists.length - 1]
        };
    }
    
    const cached = routeInterpolationCache[cacheKey];
    
    // 時間の割合を計算
    const timeT = (targetTime - startTime) / (endTime - startTime);
    
    // ルート上の距離を計算
    const targetDistance = cached.totalDistance * timeT;
    
    // ルート上の位置を取得
    return getPositionAtDistance(targetDistance, cached.segment, cached.cumulativeDistances);
}

/**
 * ライン上の最近接点を探す
 * @param {Array} point - 点の座標 [lon, lat]
 * @param {Array} lineCoords - ラインの座標配列
 * @returns {Object|null} { index: セグメントのインデックス, t: セグメント内の位置(0-1), distance: 距離 }
 */
function findNearestPointOnLine(point, lineCoords) {
    let minDistance = Infinity;
    let bestIndex = 0;
    let bestT = 0;
    
    for (let i = 0; i < lineCoords.length - 1; i++) {
        const segStart = lineCoords[i];
        const segEnd = lineCoords[i + 1];
        
        // セグメント上の最近接点を計算
        const dx = segEnd[0] - segStart[0];
        const dy = segEnd[1] - segStart[1];
        
        if (dx === 0 && dy === 0) {
            const dist = calculateDistance(point, segStart);
            if (dist < minDistance) {
                minDistance = dist;
                bestIndex = i;
                bestT = 0;
            }
            continue;
        }
        
        const t = Math.max(0, Math.min(1,
            ((point[0] - segStart[0]) * dx + (point[1] - segStart[1]) * dy) /
            (dx * dx + dy * dy)
        ));
        
        const projectedPoint = interpolateCoordinates(segStart, segEnd, t);
        const dist = calculateDistance(point, projectedPoint);
        
        if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i;
            bestT = t;
        }
    }
    
    return { index: bestIndex, t: bestT, distance: minDistance };
}

/**
 * ルートの一部を抽出
 * @param {Array} routeCoords - ルートの座標配列
 * @param {number} startIndex - 開始セグメントのインデックス
 * @param {number} startT - 開始セグメント内の位置(0-1)
 * @param {number} endIndex - 終了セグメントのインデックス
 * @param {number} endT - 終了セグメント内の位置(0-1)
 * @returns {Array} 抽出されたルートの座標配列
 */
function extractRouteSegment(routeCoords, startIndex, startT, endIndex, endT) {
    const segment = [];
    
    // 開始点を追加
    const startPoint = interpolateCoordinates(
        routeCoords[startIndex],
        routeCoords[startIndex + 1],
        startT
    );
    segment.push(startPoint);
    
    // 中間の点を追加
    if (endIndex > startIndex) {
        for (let i = startIndex + 1; i <= endIndex; i++) {
            segment.push(routeCoords[i]);
        }
    }
    
    // 終了点を追加（開始点と異なる場合のみ）
    const endPoint = interpolateCoordinates(
        routeCoords[endIndex],
        routeCoords[endIndex + 1],
        endT
    );
    
    if (segment.length === 1 || 
        segment[segment.length - 1][0] !== endPoint[0] || 
        segment[segment.length - 1][1] !== endPoint[1]) {
        segment.push(endPoint);
    }
    
    return segment;
}

// ========================================
// エクスポート（グローバルスコープに公開）
// ========================================
window.interpolateAlongTokaido = interpolateAlongTokaido;
window.findNearestPointOnLine = findNearestPointOnLine;
window.extractRouteSegment = extractRouteSegment;
