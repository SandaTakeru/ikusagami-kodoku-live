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
 * @param {number|null} characterId - キャラクターID（指定時はroute.geojsonから専用ルートを探す）
 * @returns {Array|null} 補間された座標 [lon, lat]
 */
function interpolateAlongTokaido(startCoord, endCoord, startTime, endTime, targetTime, characterId = null) {
    // キャラクター専用ルートを探す (route.geojson)
    let selectedRoute = null;
    
    if (characterId !== null) {
        const curvedRoutesData = (typeof getCurvedRoutesData === 'function') ? getCurvedRoutesData() : null;
        
        if (curvedRoutesData && curvedRoutesData.features) {
            // route.geojsonからcharacter_idが一致するルートを探す
            const characterRoute = curvedRoutesData.features.find(
                f => f.properties && f.properties.character_id === characterId
            );
            
            if (characterRoute && characterRoute.geometry && characterRoute.geometry.coordinates) {
                selectedRoute = characterRoute;
            }
        }
    }
    
    // キャラクター専用ルートが見つからなければ、line.geojsonから東海道を使用（全キャラクター共通）
    if (!selectedRoute) {
        const straightLinesData = (typeof getStraightLinesData === 'function') ? getStraightLinesData() : null;
        
        if (!straightLinesData || !straightLinesData.features) {
            console.warn('[interpolationUtils] Straight lines data not available');
            return null;
        }
        
        // line.geojsonから東海道（name: '東海道'）を探す
        selectedRoute = straightLinesData.features.find(f => f.properties && f.properties.name === '東海道');
    }
    
    if (!selectedRoute || !selectedRoute.geometry || !selectedRoute.geometry.coordinates) {
        console.warn('[interpolationUtils] No route found for character:', characterId);
        return null;
    }
    
    // LineStringとMultiLineStringの両方に対応
    let routeCoords;
    if (selectedRoute.geometry.type === 'MultiLineString') {
        // MultiLineStringの場合、全ての配列を結合
        routeCoords = selectedRoute.geometry.coordinates.flat();
    } else if (selectedRoute.geometry.type === 'LineString') {
        routeCoords = selectedRoute.geometry.coordinates; // LineStringの座標配列
    } else {
        console.warn('[interpolationUtils] Unsupported geometry type:', selectedRoute.geometry.type);
        return null;
    }
    
    if (!routeCoords || routeCoords.length < 2) {
        console.warn('[interpolationUtils] Route coordinates too short:', routeCoords?.length);
        return null;
    }
    
    // キャッシュキーを生成（キャラクターIDを含める）
    const cacheKey = `${characterId || 'default'}_${startCoord.join(',')}_${endCoord.join(',')}`;
    
    // キャッシュから取得または計算
    if (!routeInterpolationCache[cacheKey]) {
        // 開始点と終了点の近傍にある複数の候補点を探す
        const startCandidates = findNearbyPointsOnLine(startCoord, routeCoords);
        const endCandidates = findNearbyPointsOnLine(endCoord, routeCoords);
        
        if (!startCandidates.length || !endCandidates.length) {
            console.warn('[interpolationUtils] No candidates found. Start:', startCandidates.length, 'End:', endCandidates.length, 
                'StartCoord:', startCoord, 'EndCoord:', endCoord, 'RouteCoords:', routeCoords.length);
            return null;
        }
        
        // 全ての組み合わせを試して最短ルートを見つける
        let bestRoute = null;
        let minRouteDistance = Infinity;
        
        for (const startProj of startCandidates) {
            for (const endProj of endCandidates) {
                // 2点間のルート部分を抽出
                const routeSegment = extractRouteSegment(
                    routeCoords,
                    startProj.index,
                    startProj.t,
                    endProj.index,
                    endProj.t
                );
                
                if (!routeSegment || routeSegment.length < 2) {
                    continue;
                }
                
                // 累積距離を計算
                const cumulativeDists = calculateCumulativeDistances(routeSegment);
                const totalDistance = cumulativeDists[cumulativeDists.length - 1];
                
                // 最短ルートを更新
                if (totalDistance < minRouteDistance) {
                    minRouteDistance = totalDistance;
                    bestRoute = {
                        segment: routeSegment,
                        cumulativeDistances: cumulativeDists,
                        totalDistance: totalDistance
                    };
                }
            }
        }
        
        if (!bestRoute) {
            return null;
        }
        
        routeInterpolationCache[cacheKey] = bestRoute;
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
 * ライン上の近傍にある複数の候補点を探す（最短経路選択用）
 * @param {Array} point - 点の座標 [lon, lat]
 * @param {Array} lineCoords - ラインの座標配列
 * @param {number} threshold - 候補として含める距離の閾値（最近接点からの相対倍率、デフォルト2.0）
 * @param {number} maxCandidates - 返す候補の最大数（デフォルト5）
 * @returns {Array} 候補の配列 [{ index, t, distance }, ...]（距離の昇順）
 */
function findNearbyPointsOnLine(point, lineCoords, threshold = 2.0, maxCandidates = 5) {
    const candidates = [];
    
    for (let i = 0; i < lineCoords.length - 1; i++) {
        const segStart = lineCoords[i];
        const segEnd = lineCoords[i + 1];
        
        // セグメント上の最近接点を計算
        const dx = segEnd[0] - segStart[0];
        const dy = segEnd[1] - segStart[1];
        
        let t, dist;
        if (dx === 0 && dy === 0) {
            t = 0;
            dist = calculateDistance(point, segStart);
        } else {
            t = Math.max(0, Math.min(1,
                ((point[0] - segStart[0]) * dx + (point[1] - segStart[1]) * dy) /
                (dx * dx + dy * dy)
            ));
            const projectedPoint = interpolateCoordinates(segStart, segEnd, t);
            dist = calculateDistance(point, projectedPoint);
        }
        
        candidates.push({ index: i, t: t, distance: dist });
    }
    
    // 距離でソート
    candidates.sort((a, b) => a.distance - b.distance);
    
    // 最近接点の距離を基準に閾値を設定
    const minDistance = candidates[0].distance;
    const distThreshold = minDistance * threshold;
    
    // 閾値以内かつ最大候補数までを返す
    return candidates.filter(c => c.distance <= distThreshold).slice(0, maxCandidates);
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
        // 順方向：startIndexからendIndexへ進む
        for (let i = startIndex + 1; i <= endIndex; i++) {
            segment.push(routeCoords[i]);
        }
    } else if (endIndex < startIndex) {
        // 逆方向：startIndexからendIndexへ戻る
        for (let i = startIndex - 1; i >= endIndex + 1; i--) {
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
window.findNearbyPointsOnLine = findNearbyPointsOnLine;
window.extractRouteSegment = extractRouteSegment;
