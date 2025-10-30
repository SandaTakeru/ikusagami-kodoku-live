// ========================================
// キャラクターマーカー表示機能（スリム版）
// ========================================

const markerLogger = getLogger('CharacterMarkers');

/**
 * GeoJSONデータ（全ポイント）
 */
let allPointsData = null;

/**
 * 現在の時刻（Date オブジェクト）
 */
let currentDisplayTime = null;

/**
 * 各キャラクターの現在位置（最新のFeatureを保持）
 */
const characterCurrentPositions = {};

/**
 * 各キャラクターの時系列ポイントリスト（ソート済み）
 */
const characterTimelines = {};

/**
 * MapLibre Markerオブジェクトの管理
 */
const characterMarkers = {};

/**
 * SVGレイヤー（髭線描画用）
 */
let markerLinesSvg = null;

/**
 * 重なり解消の設定
 */
const OVERLAP_CONFIG = {
    threshold: 50, // ピクセル単位での重なり判定距離
    offsetDistance: 35, // 風船の髭線の長さ
    twoMarkerAngle: 40, // 2つのマーカーのV字角度（度）
    circleRadius: 50, // 3つ以上のマーカーの円形配置半径（内側の円）
    outerCircleRadius: 75, // 多数のマーカー時の外側の円の半径
    singleCircleMaxCount: 18 // 単一円で配置する最大マーカー数
};

/**
 * リアルタイム更新のスロットリング制御
 */
let updateAnimationFrameId = null;

/**
 * SVGマーカー要素のキャッシュ
 * { characterId: { group, hitArea, circle, text, position } }
 */
const svgMarkerCache = {};

/**
 * マーカー機能の初期化
 */
async function initCharacterMarkers() {
    if (!map) {
        markerLogger.error('Map is not initialized');
        return;
    }

    // GeoJSONデータを読み込む
    await loadCharacterPoints();

    // 初期時刻を設定（開始時刻）
    currentDisplayTime = new Date(START_DATE);

    // SVGレイヤーを初期化
    initMarkerLinesSvg();

    // キャラクターマーカーを即座に追加（地図読み込みを待たない）
    // HTMLマーカーは地図スタイルに依存しないため、早期表示可能
    addCharacterMarkers();

    // 地図移動・ズーム時にリアルタイムで重なり解消を更新
    // requestAnimationFrameでスロットリングして滑らかに更新
    const scheduleUpdate = () => {
        if (updateAnimationFrameId === null) {
            updateAnimationFrameId = requestAnimationFrame(() => {
                updateOverlapLayout();
                updateAnimationFrameId = null;
            });
        }
    };

    // moveとzoomはrequestAnimationFrameで、終了時は即座に更新
    map.on('move', scheduleUpdate);
    map.on('zoom', scheduleUpdate);
    map.on('moveend', () => {
        // 移動終了時は即座に更新（保留中の更新をキャンセル）
        if (updateAnimationFrameId !== null) {
            cancelAnimationFrame(updateAnimationFrameId);
            updateAnimationFrameId = null;
        }
        updateOverlapLayout();
    });
    map.on('zoomend', () => {
        // ズーム終了時は即座に更新（保留中の更新をキャンセル）
        if (updateAnimationFrameId !== null) {
            cancelAnimationFrame(updateAnimationFrameId);
            updateAnimationFrameId = null;
        }
        updateOverlapLayout();
    });
}

/**
 * GeoJSONデータを読み込む
 */
async function loadCharacterPoints() {
    try {
        const response = await fetch('./data/points.geojson');
        allPointsData = await response.json();
        markerLogger.info(`Loaded ${allPointsData.features.length} character points`);
        
        // キャラクターごとのタイムラインを構築
        buildCharacterTimelines();
    } catch (error) {
        markerLogger.error('Failed to load points.geojson:', error);
    }
}

/**
 * キャラクターごとのタイムラインを構築
 */
/**
 * 明治時代の日本標準時オフセット（現代JSTとの差分）
 * 明治時代: +9時間18分59秒 (33539秒)
 * 現代JST: +9時間 (32400秒)
 * 差分: 1139秒 = 18分59秒
 */
const MEIJI_JST_OFFSET_MS = 1139 * 1000; // 18分59秒をミリ秒に変換

/**
 * 各キャラクターの最終タイムスタンプを格納
 * { characterId: lastTimestamp }
 */
const characterLastTimestamps = {};

/**
 * GeoJSONデータから各キャラクターの時系列タイムラインを構築
 */
function buildCharacterTimelines() {
    if (!allPointsData) return;
    
    let invalidCount = 0;
    const invalidReasons = [];
    
    // キャラクターIDごとにグループ化
    allPointsData.features.forEach((feature, index) => {
        // 無効なフィーチャーをスキップ
        if (!feature) {
            invalidCount++;
            invalidReasons.push(`Feature #${index}: null or undefined`);
            return;
        }
        if (!feature.properties) {
            invalidCount++;
            invalidReasons.push(`Feature #${index}: missing properties`);
            return;
        }
        if (!feature.geometry || !feature.geometry.coordinates) {
            invalidCount++;
            invalidReasons.push(`Feature #${index}: missing geometry or coordinates`);
            return;
        }
        
        const characterId = feature.properties.character_id;
        
        if (!characterId) {
            invalidCount++;
            invalidReasons.push(`Feature #${index}: missing character_id`);
            return;
        }
        
        if (!characterTimelines[characterId]) {
            characterTimelines[characterId] = [];
        }
        
        // タイムスタンプをパースして明治時代のオフセットを補正
        const rawTimestamp = new Date(feature.properties.timestamp).getTime();
        const correctedTimestamp = rawTimestamp - MEIJI_JST_OFFSET_MS;
        
        characterTimelines[characterId].push({
            timestamp: correctedTimestamp,
            coordinates: feature.geometry.coordinates,
            properties: feature.properties
        });
    });
    
    if (invalidCount > 0) {
        markerLogger.warn(`Skipped ${invalidCount} invalid feature(s) in points.geojson`);
        if (invalidReasons.length > 0 && invalidReasons.length <= 5) {
            // 5件以下の場合は詳細を表示
            invalidReasons.forEach(reason => markerLogger.debug(`  - ${reason}`));
        }
    }
    
    // 各タイムラインを時刻順にソートし、最終タイムスタンプを記録
    Object.keys(characterTimelines).forEach(characterId => {
        characterTimelines[characterId].sort((a, b) => a.timestamp - b.timestamp);
        
        // 最終タイムスタンプを記録（最後のフィーチャーの時刻）
        const timeline = characterTimelines[characterId];
        if (timeline.length > 0) {
            characterLastTimestamps[characterId] = timeline[timeline.length - 1].timestamp;
        }
    });
    
    markerLogger.info(`Built timelines for ${Object.keys(characterTimelines).length} characters`);
}

/**
 * キャラクターマーカーをマップに追加（HTMLマーカー方式）
 */
function addCharacterMarkers() {
    if (!allPointsData) {
        markerLogger.error('Points data not loaded');
        return;
    }

    // 補間位置データを作成
    const positions = getInterpolatedCharacterPositions(currentDisplayTime);

    // 現在の言語設定を取得
    const currentLang = document.documentElement.lang || 'ja';

    // 各キャラクターのマーカーを作成
    Object.entries(positions).forEach(([characterId, positionData]) => {
        const character = CHARACTERS[characterId];
        if (!character) return;

        const iconText = currentLang === 'ja' ? character.icon : character.iconEn;
        const coords = positionData.coordinates;

        // HTMLマーカー要素を作成
        const el = createMarkerElement(character, iconText, characterId);

        // MapLibre Markerを作成
        const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center'
        })
            .setLngLat(coords)
            .addTo(map);

        // マーカーを保存
        characterMarkers[characterId] = marker;
        
        // 初期表示状態を設定（ネタバレフィルタとキャラクターフィルタに基づく）
        const id = parseInt(characterId);
        const isWithinVolume = character.volume <= AppState.currentVolume;
        const isEnabled = AppState.enabledCharacters.has(id);
        const shouldShow = isWithinVolume && isEnabled;
        
        if (!shouldShow) {
            el.style.display = 'none';
        }
    });

    markerLogger.info('Character markers added to map');

    // 重なり解消レイアウトを適用（即座に実行）
    // characterCurrentPositionsが設定された後に実行されるようにする
    setTimeout(() => {
        // characterCurrentPositionsを設定
        Object.entries(positions).forEach(([characterId, positionData]) => {
            characterCurrentPositions[characterId] = {
                geometry: { coordinates: positionData.coordinates },
                properties: positionData.properties
            };
        });
        // レイアウト更新
        updateOverlapLayout();
    }, 50);
}

/**
 * キャラクターが死亡状態かどうかを判定
 * @param {string} characterId - キャラクターID
 * @param {Date} currentTime - 現在時刻
 * @returns {boolean} 死亡状態であればtrue
 */
function isCharacterDeceased(characterId, currentTime) {
    const lastTimestamp = characterLastTimestamps[characterId];
    if (!lastTimestamp) return false;
    
    const currentTimestamp = currentTime.getTime();
    return currentTimestamp > lastTimestamp;
}

/**
 * マーカー要素に死亡状態のスタイルを適用
 * @param {HTMLElement} el - マーカー要素
 * @param {Object} character - キャラクター情報
 * @param {boolean} isDeceased - 死亡状態かどうか
 */
function applyDeceasedStyle(el, character, isDeceased) {
    if (isDeceased) {
        // グレーで目立たないスタイル（透明化なし）
        el.style.background = '#888888';
        el.style.filter = 'grayscale(100%)';
        el.style.border = '2px solid rgba(200, 200, 200, 0.5)';
    } else {
        // 通常のスタイル
        el.style.background = character.color;
        el.style.filter = 'none';
        el.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    }
}

/**
 * マーカー用のHTML要素を作成
 * @param {Object} character - キャラクター情報
 * @param {string} iconText - 表示テキスト
 * @param {string} characterId - キャラクターID
 * @returns {HTMLElement} マーカー要素
 */
function createMarkerElement(character, iconText, characterId) {
    const el = document.createElement('div');
    el.className = 'map-character-marker';
    el.setAttribute('data-character-id', characterId);
    
    // 死亡状態を判定
    const isDeceased = isCharacterDeceased(characterId, currentDisplayTime);
    
    el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${isDeceased ? '#888888' : character.color};
        border: 2px solid ${isDeceased ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.8)'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        transition: width 0.15s ease, height 0.15s ease, font-size 0.15s ease, box-shadow 0.15s ease, background 0.3s ease, filter 0.3s ease;
        line-height: 40px;
        text-align: center;
        padding: 0;
        margin: 0;
        z-index: 100;
        pointer-events: all;
        filter: ${isDeceased ? 'grayscale(100%)' : 'none'};
    `;

    el.textContent = iconText;

    // ホバー効果（マーカーを最前面に）
    el.addEventListener('mouseenter', () => {
        el.style.width = '46px';
        el.style.height = '46px';
        el.style.fontSize = '23px';
        el.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.4)';
        
        // MapLibreのマーカーコンテナ（親要素）のz-indexを変更
        let parent = el.parentElement;
        while (parent && !parent.classList.contains('maplibregl-marker')) {
            parent = parent.parentElement;
        }
        if (parent) {
            parent.style.zIndex = '1000';
            markerLogger.debug(`HTML Marker hover: ${characterId}, z-index set to 1000`);
        }
    });
    
    el.addEventListener('mouseleave', () => {
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.fontSize = '20px';
        el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        
        // z-indexを元に戻す
        let parent = el.parentElement;
        while (parent && !parent.classList.contains('maplibregl-marker')) {
            parent = parent.parentElement;
        }
        if (parent) {
            parent.style.zIndex = '';
        }
    });

    // クリックイベント：トラッキングカードを表示
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        markerLogger.debug(`HTML Marker clicked: ${characterId}`);
        if (typeof showTrackingCard === 'function') {
            showTrackingCard(characterId);
        }
    });

    return el;
}

/**
 * 指定時刻における各キャラクターの補間位置を計算
 * @param {Date} targetTime - 対象時刻
 * @returns {Object} { characterId: { coordinates, properties } } の形式
 */
function getInterpolatedCharacterPositions(targetTime) {
    if (!characterTimelines || Object.keys(characterTimelines).length === 0) {
        return {};
    }

    const targetTimestamp = targetTime.getTime();
    const interpolatedPositions = {};

    Object.entries(characterTimelines).forEach(([characterId, timeline]) => {
        if (timeline.length === 0) return;

        // 指定時刻以前の最後のポイントを探す
        let beforeIndex = -1;
        for (let i = timeline.length - 1; i >= 0; i--) {
            if (timeline[i].timestamp <= targetTimestamp) {
                beforeIndex = i;
                break;
            }
        }

        // まだ出現していないキャラクター
        if (beforeIndex === -1) {
            return;
        }

        const beforePoint = timeline[beforeIndex];
        const afterPoint = timeline[beforeIndex + 1];

        // 最後のポイントに到達している場合
        if (!afterPoint || afterPoint.timestamp > targetTimestamp) {
            if (beforeIndex === timeline.length - 1) {
                // 最終ポイント
                interpolatedPositions[characterId] = {
                    coordinates: beforePoint.coordinates,
                    properties: beforePoint.properties
                };
            } else if (afterPoint) {
                // 2点間を東海道のルート上で補間
                try {
                    const interpolated = interpolateAlongTokaido(
                        beforePoint.coordinates,
                        afterPoint.coordinates,
                        beforePoint.timestamp,
                        afterPoint.timestamp,
                        targetTimestamp
                    );
                    
                    if (interpolated) {
                        interpolatedPositions[characterId] = {
                            coordinates: interpolated,
                            properties: beforePoint.properties
                        };
                    } else {
                        // フォールバック：直線補間
                        const timeT = (targetTimestamp - beforePoint.timestamp) / 
                                     (afterPoint.timestamp - beforePoint.timestamp);
                        
                        interpolatedPositions[characterId] = {
                            coordinates: interpolateCoordinates(
                                beforePoint.coordinates,
                                afterPoint.coordinates,
                                timeT
                            ),
                            properties: beforePoint.properties
                        };
                    }
                } catch (error) {
                    markerLogger.warn(`Error interpolating character ${characterId}:`, error);
                    // エラー時は直線補間
                    const timeT = (targetTimestamp - beforePoint.timestamp) / 
                                 (afterPoint.timestamp - beforePoint.timestamp);
                    
                    interpolatedPositions[characterId] = {
                        coordinates: interpolateCoordinates(
                            beforePoint.coordinates,
                            afterPoint.coordinates,
                            timeT
                        ),
                        properties: beforePoint.properties
                    };
                }
            } else {
                // afterPointが存在しない（最後のポイント）
                interpolatedPositions[characterId] = {
                    coordinates: beforePoint.coordinates,
                    properties: beforePoint.properties
                };
            }
        }
    });

    return interpolatedPositions;
}

/**
 * キャラクター位置を更新（補間あり）
 * @param {Date} currentTime - 現在時刻
 */
function updateCharacterPositions(currentTime) {
    if (!map) {
        return;
    }

    currentDisplayTime = currentTime;

    // 補間位置データを取得
    const positions = getInterpolatedCharacterPositions(currentTime);

    // 各マーカーの位置を滑らかに更新
    Object.entries(positions).forEach(([characterId, positionData]) => {
        const marker = characterMarkers[characterId];
        const coords = positionData.coordinates;
        const id = parseInt(characterId);
        const character = CHARACTERS[id];

        if (marker) {
            // 既存マーカーの位置を更新
            marker.setLngLat(coords);
            
            // フィルタに基づいて表示/非表示を設定
            if (character) {
                const isWithinVolume = character.volume <= AppState.currentVolume;
                const isEnabled = AppState.enabledCharacters.has(id);
                const shouldShow = isWithinVolume && isEnabled;
                
                const el = marker.getElement();
                if (el) {
                    el.style.display = shouldShow ? '' : 'none';
                    
                    // 死亡状態を反映
                    const isDeceased = isCharacterDeceased(characterId, currentTime);
                    applyDeceasedStyle(el, character, isDeceased);
                }
            }
        } else {
            // マーカーがまだ存在しない場合は新規作成
            if (!character) return;

            const currentLang = document.documentElement.lang || 'ja';
            const iconText = currentLang === 'ja' ? character.icon : character.iconEn;
            const el = createMarkerElement(character, iconText, characterId);

            const newMarker = new maplibregl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat(coords)
                .addTo(map);

            characterMarkers[characterId] = newMarker;
            
            // 初期表示状態を設定
            const isWithinVolume = character.volume <= AppState.currentVolume;
            const isEnabled = AppState.enabledCharacters.has(id);
            const shouldShow = isWithinVolume && isEnabled;
            
            if (!shouldShow) {
                el.style.display = 'none';
            }
        }
        
        // 現在位置を保存（トラッキング用）
        characterCurrentPositions[characterId] = {
            geometry: { coordinates: coords },
            properties: positionData.properties
        };
    });

    // 現在時刻より未来のキャラクターマーカーを非表示
    Object.keys(characterMarkers).forEach(characterId => {
        if (!positions[characterId]) {
            const marker = characterMarkers[characterId];
            if (marker) {
                marker.remove();
                delete characterMarkers[characterId];
            }
        }
    });

    // 重なり解消レイアウトを更新
    updateOverlapLayout();
}

/**
 * 現在の時刻を取得（外部から参照用）
 * @returns {Date} 現在の表示時刻
 */
function getCurrentDisplayTime() {
    return currentDisplayTime;
}

/**
 * 指定キャラクターの現在位置を取得
 * @param {string} characterId - キャラクターID
 * @returns {Object|null} Featureオブジェクトまたはnull
 */
function getCharacterCurrentPosition(characterId) {
    return characterCurrentPositions[characterId] || null;
}

/**
 * 全ポイントデータを取得
 * @returns {Object|null} GeoJSONデータ
 */
function getAllPointsData() {
    return allPointsData;
}

// ========================================
// マーカー重なり解消機能
// ========================================

/**
 * SVGレイヤーを初期化
 */
function initMarkerLinesSvg() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // 既存のSVGがあれば削除
    const existingSvg = document.getElementById('marker-lines-svg');
    if (existingSvg) {
        existingSvg.remove();
    }

    // SVG要素を作成
    markerLinesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    markerLinesSvg.id = 'marker-lines-svg';
    markerLinesSvg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: visible;
    `;
    mapContainer.appendChild(markerLinesSvg);
    
    // クリック可能なマーカー用のグループを作成
    const interactiveGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    interactiveGroup.id = 'interactive-markers';
    interactiveGroup.style.pointerEvents = 'all';
    markerLinesSvg.appendChild(interactiveGroup);
}

/**
 * 2点間の画面上のピクセル距離を計算
 * @param {Array} coords1 - [lng, lat]
 * @param {Array} coords2 - [lng, lat]
 * @returns {number} ピクセル距離
 */
function getPixelDistance(coords1, coords2) {
    const point1 = map.project(coords1);
    const point2 = map.project(coords2);
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 重なっているマーカーをグループ化
 * @param {Object} positions - { characterId: [lng, lat] } または { characterId: { coordinates: [lng, lat] } }
 * @returns {Array} グループの配列
 */
function groupOverlappingMarkers(positions) {
    const characterIds = Object.keys(positions);
    const visited = new Set();
    const groups = [];

    characterIds.forEach(id1 => {
        if (visited.has(id1)) return;

        const group = [id1];
        visited.add(id1);
        // positions[id]が配列か、coordinatesプロパティを持つオブジェクトかを判定
        const coords1 = Array.isArray(positions[id1]) ? positions[id1] : positions[id1].coordinates;

        characterIds.forEach(id2 => {
            if (id1 !== id2 && !visited.has(id2)) {
                const coords2 = Array.isArray(positions[id2]) ? positions[id2] : positions[id2].coordinates;
                const distance = getPixelDistance(coords1, coords2);

                if (distance < OVERLAP_CONFIG.threshold) {
                    group.push(id2);
                    visited.add(id2);
                }
            }
        });

        groups.push(group);
    });

    return groups;
}

/**
 * グループの中心座標を計算
 * @param {Array} characterIds - キャラクターIDの配列
 * @param {Object} positions - 位置データ
 * @returns {Array} [lng, lat]
 */
function getGroupCenter(characterIds, positions) {
    let sumLng = 0, sumLat = 0;
    characterIds.forEach(id => {
        const coords = Array.isArray(positions[id]) ? positions[id] : positions[id].coordinates;
        const [lng, lat] = coords;
        sumLng += lng;
        sumLat += lat;
    });
    return [sumLng / characterIds.length, sumLat / characterIds.length];
}

/**
 * マーカーの配置位置を計算（重なり解消）
 * @param {Array} group - キャラクターIDの配列
 * @param {Array} centerCoords - グループ中心座標 [lng, lat]
 * @returns {Object} { characterId: { offset: [dx, dy], center: [x, y] } }
 */
function calculateMarkerLayout(group, centerCoords) {
    const layout = {};
    const centerPoint = map.project(centerCoords);

    if (group.length === 1) {
        // 単独マーカーはオフセットなし
        layout[group[0]] = {
            offset: [0, 0],
            center: [centerPoint.x, centerPoint.y]
        };
    } else if (group.length === 2) {
        // 2つのマーカー: V字配置
        const angle = OVERLAP_CONFIG.twoMarkerAngle * Math.PI / 180;
        const distance = OVERLAP_CONFIG.offsetDistance;

        group.forEach((id, index) => {
            const direction = index === 0 ? -1 : 1;
            const dx = direction * distance * Math.sin(angle / 2);
            const dy = -distance * Math.cos(angle / 2);

            layout[id] = {
                offset: [dx, dy],
                center: [centerPoint.x, centerPoint.y]
            };
        });
    } else if (group.length <= OVERLAP_CONFIG.singleCircleMaxCount) {
        // 3つ以上18個まで: 単一円形配置
        const radius = OVERLAP_CONFIG.circleRadius;
        const angleStep = (2 * Math.PI) / group.length;
        const startAngle = -Math.PI / 2; // 上から始める

        group.forEach((id, index) => {
            const angle = startAngle + angleStep * index;
            const dx = radius * Math.cos(angle);
            const dy = radius * Math.sin(angle);

            layout[id] = {
                offset: [dx, dy],
                center: [centerPoint.x, centerPoint.y]
            };
        });
    } else {
        // 19個以上: 二重円形配置
        const innerRadius = OVERLAP_CONFIG.circleRadius;
        const outerRadius = OVERLAP_CONFIG.outerCircleRadius;
        
        // 内側の円と外側の円にマーカーを分配
        // 内側: 2、外側: 3の比率で配分
        const innerCount = Math.floor(group.length * 2 / 5);
        const outerCount = group.length - innerCount;
        
        const startAngle = -Math.PI / 2;
        const innerAngleStep = (2 * Math.PI) / innerCount;
        const outerAngleStep = (2 * Math.PI) / outerCount;
        const outerStartOffset = outerAngleStep / 2;
        
        group.forEach((id, index) => {
            let dx, dy;
            
            if (index < innerCount) {
                // 内側の円
                const angle = startAngle + innerAngleStep * index;
                dx = innerRadius * Math.cos(angle);
                dy = innerRadius * Math.sin(angle);
            } else {
                // 外側の円
                const outerIndex = index - innerCount;
                const angle = startAngle + outerStartOffset + outerAngleStep * outerIndex;
                dx = outerRadius * Math.cos(angle);
                dy = outerRadius * Math.sin(angle);
            }
            
            layout[id] = {
                offset: [dx, dy],
                center: [centerPoint.x, centerPoint.y]
            };
        });
    }

    return layout;
}

/**
 * マーカーの重なり解消レイアウトを更新
 */
function updateOverlapLayout() {
    if (!map || !markerLinesSvg) return;

    // 現在のマーカー位置を取得（フィルタで表示されているもののみ）
    const positions = {};
    Object.entries(characterCurrentPositions).forEach(([characterId, positionData]) => {
        const marker = characterMarkers[characterId];
        if (!marker) return;
        
        // フィルタ状態を確認
        const numId = parseInt(characterId);
        const character = CHARACTERS[numId];
        if (!character) return;
        
        const isWithinVolume = character.volume <= AppState.currentVolume;
        const isEnabled = AppState.enabledCharacters.has(numId);
        const shouldShow = isWithinVolume && isEnabled;
        
        // フィルタで表示状態のマーカーのみを処理対象とする
        if (shouldShow) {
            positions[characterId] = positionData.geometry.coordinates;
        }
    });

    if (Object.keys(positions).length === 0) {
        // 表示するマーカーがない場合、全てのSVGマーカーと髭線をクリア
        const linesGroup = document.getElementById('marker-lines');
        if (linesGroup) {
            while (linesGroup.firstChild) {
                linesGroup.removeChild(linesGroup.firstChild);
            }
        }
        Object.keys(svgMarkerCache).forEach(id => {
            hideSvgMarker(id);
        });
        return;
    }

    // グループ化
    const groups = groupOverlappingMarkers(positions);
    markerLogger.debug(`Overlap layout: ${Object.keys(positions).length} visible markers, ${groups.length} groups`);

    // SVGのインタラクティブグループを取得または作成
    let interactiveGroup = document.getElementById('interactive-markers');
    if (!interactiveGroup) {
        interactiveGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        interactiveGroup.id = 'interactive-markers';
        interactiveGroup.style.pointerEvents = 'all';
        markerLinesSvg.appendChild(interactiveGroup);
    }

    // 髭線グループをクリア（背景レイヤー）
    let linesGroup = document.getElementById('marker-lines');
    if (!linesGroup) {
        linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linesGroup.id = 'marker-lines';
        linesGroup.style.pointerEvents = 'none';
        markerLinesSvg.insertBefore(linesGroup, interactiveGroup);
    }
    while (linesGroup.firstChild) {
        linesGroup.removeChild(linesGroup.firstChild);
    }
    
    // 現在使用中のキャラクターIDを記録
    const activeCharacterIds = new Set();

    // マーカーを配置
    groups.forEach(group => {
        if (group.length === 1) {
            // 単独マーカーは通常表示（HTMLマーカー）
            const id = group[0];
            activeCharacterIds.add(id);
            
            const marker = characterMarkers[id];
            if (marker) {
                const el = marker.getElement();
                if (el) {
                    // positionsに含まれているということは、フィルタで表示状態
                    // HTMLマーカーを表示
                    el.style.display = '';
                }
            }
            
            // SVGマーカーがあれば非表示
            hideSvgMarker(id);
        } else {
            // 複数マーカー: SVG上に描画
            const centerCoords = getGroupCenter(group, positions);
            const centerPoint = map.project(centerCoords);
            
            // レイアウト計算
            const offsets = calculateGroupOffsets(group.length);
            
            // 髭線とマーカーを描画
            // groupに含まれているということは、全てフィルタで表示状態
            group.forEach((id, index) => {
                activeCharacterIds.add(id);
                
                const marker = characterMarkers[id];
                if (!marker) return;
                
                // 髭線を描画
                const offset = offsets[index];
                const iconPos = [centerPoint.x + offset[0], centerPoint.y + offset[1]];
                drawMarkerLine([centerPoint.x, centerPoint.y], iconPos, linesGroup);
                
                // 元のHTMLマーカーを非表示
                const el = marker.getElement();
                if (el) {
                    el.style.display = 'none';
                }

                // SVGマーカーの位置を更新または作成
                updateOrCreateSvgMarker(id, iconPos);
            });
        }
    });
    
    // 使用されていないSVGマーカーを非表示
    // activeでない、または単独グループの場合は非表示
    Object.keys(svgMarkerCache).forEach(id => {
        if (!activeCharacterIds.has(id) || groups.find(g => g.length === 1 && g[0] === id)) {
            hideSvgMarker(id);
        }
    });
}

/**
 * グループサイズに応じたオフセットを計算
 * @param {number} count - マーカー数
 * @returns {Array} [[dx, dy], ...]の配列
 */
function calculateGroupOffsets(count) {
    const offsets = [];
    
    if (count === 2) {
        // V字配置
        const angle = OVERLAP_CONFIG.twoMarkerAngle * Math.PI / 180;
        const distance = OVERLAP_CONFIG.offsetDistance;
        
        offsets.push([
            -distance * Math.sin(angle / 2),
            -distance * Math.cos(angle / 2)
        ]);
        offsets.push([
            distance * Math.sin(angle / 2),
            -distance * Math.cos(angle / 2)
        ]);
    } else if (count <= OVERLAP_CONFIG.singleCircleMaxCount) {
        // 単一円形配置（18個まで）
        const radius = OVERLAP_CONFIG.circleRadius;
        const angleStep = (2 * Math.PI) / count;
        const startAngle = -Math.PI / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            offsets.push([
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            ]);
        }
    } else {
        // 二重円形配置（19個以上）
        const innerRadius = OVERLAP_CONFIG.circleRadius;
        const outerRadius = OVERLAP_CONFIG.outerCircleRadius;
        
        // 内側の円と外側の円にマーカーを分配
        // 内側: 2、外側: 3の比率で配分
        const innerCount = Math.floor(count * 2 / 5);
        const outerCount = count - innerCount;
        
        const startAngle = -Math.PI / 2;
        
        // 内側の円
        const innerAngleStep = (2 * Math.PI) / innerCount;
        for (let i = 0; i < innerCount; i++) {
            const angle = startAngle + innerAngleStep * i;
            offsets.push([
                innerRadius * Math.cos(angle),
                innerRadius * Math.sin(angle)
            ]);
        }
        
        // 外側の円（内側の円とずらして配置）
        const outerAngleStep = (2 * Math.PI) / outerCount;
        const outerStartOffset = outerAngleStep / 2; // 内側の円の隙間に配置
        for (let i = 0; i < outerCount; i++) {
            const angle = startAngle + outerStartOffset + outerAngleStep * i;
            offsets.push([
                outerRadius * Math.cos(angle),
                outerRadius * Math.sin(angle)
            ]);
        }
    }
    
    return offsets;
}

/**
 * SVGマーカーの位置を更新または新規作成
 * この関数が呼ばれる時点で、characterIdは表示状態であることが保証されている
 * @param {string} characterId - キャラクターID
 * @param {Array} position - [x, y] ピクセル座標
 */
function updateOrCreateSvgMarker(characterId, position) {
    const character = CHARACTERS[characterId];
    
    // キャッシュに存在する場合は位置と死亡状態を更新
    if (svgMarkerCache[characterId]) {
        const cached = svgMarkerCache[characterId];
        
        // 位置を更新
        cached.hitArea.setAttribute('cx', position[0]);
        cached.hitArea.setAttribute('cy', position[1]);
        cached.circle.setAttribute('cx', position[0]);
        cached.circle.setAttribute('cy', position[1]);
        cached.text.setAttribute('x', position[0]);
        cached.text.setAttribute('y', position[1]);
        cached.position = position;
        
        // 死亡状態を反映
        const isDeceased = isCharacterDeceased(characterId, currentDisplayTime);
        if (isDeceased) {
            cached.group.setAttribute('filter', 'grayscale(100%)');
            cached.circle.setAttribute('fill', '#888888');
            cached.circle.setAttribute('stroke', 'rgba(200, 200, 200, 0.5)');
        } else if (character) {
            cached.group.removeAttribute('filter');
            cached.circle.setAttribute('fill', character.color);
            cached.circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.8)');
        }
        
        // 表示
        cached.group.style.display = '';
        
        return;
    }
    
    // 新規作成（表示状態で）
    createSvgMarker(characterId, position, true);
}

/**
 * SVGマーカーを非表示
 * @param {string} characterId - キャラクターID
 */
function hideSvgMarker(characterId) {
    if (svgMarkerCache[characterId]) {
        svgMarkerCache[characterId].group.style.display = 'none';
    }
}

/**
 * SVG上にマーカーを新規作成
 * @param {string} characterId - キャラクターID
 * @param {Array} position - [x, y] ピクセル座標
 * @param {boolean} shouldShow - 初期表示状態（デフォルトtrue）
 */
function createSvgMarker(characterId, position, shouldShow = true) {
    const character = CHARACTERS[characterId];
    if (!character) return;

    const currentLang = document.documentElement.lang || 'ja';
    const iconText = currentLang === 'ja' ? character.icon : character.iconEn;
    
    // 死亡状態を判定
    const isDeceased = isCharacterDeceased(characterId, currentDisplayTime);

    // インタラクティブグループを取得
    const interactiveGroup = document.getElementById('interactive-markers');
    if (!interactiveGroup) return;

    // グループ要素を作成（ホバー・クリック用）
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-character-id', characterId);
    group.style.cursor = 'pointer';
    group.style.pointerEvents = 'all';
    group.style.display = shouldShow ? '' : 'none';
    
    // 死亡状態の場合はグレースケールフィルタを適用
    if (isDeceased) {
        group.setAttribute('filter', 'grayscale(100%)');
    }
    
    // 透明な大きめの円を追加（クリック領域を広げる）
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hitArea.setAttribute('cx', position[0]);
    hitArea.setAttribute('cy', position[1]);
    hitArea.setAttribute('r', '25');
    hitArea.setAttribute('fill', 'transparent');
    hitArea.setAttribute('stroke', 'none');
    hitArea.style.pointerEvents = 'all';
    group.appendChild(hitArea);

    // 円を描画
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', position[0]);
    circle.setAttribute('cy', position[1]);
    circle.setAttribute('r', '20');
    circle.setAttribute('fill', isDeceased ? '#888888' : character.color);
    circle.setAttribute('stroke', isDeceased ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.8)');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))');
    circle.style.pointerEvents = 'all';
    
    group.appendChild(circle);

    // テキストを描画
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', position[0]);
    text.setAttribute('y', position[1]);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('style', 'user-select: none; pointer-events: none;');
    text.textContent = iconText;
    
    group.appendChild(text);

    // ホバー効果
    group.addEventListener('mouseenter', () => {
        hitArea.setAttribute('r', '28');
        circle.setAttribute('r', '23');
        text.setAttribute('font-size', '23');
        circle.setAttribute('filter', 'drop-shadow(0 3px 12px rgba(0,0,0,0.4))');
        
        // SVGでは要素を親の最後に移動して最前面に表示
        if (group.parentNode) {
            group.parentNode.appendChild(group);
            markerLogger.debug(`SVG Marker hover: ${characterId}, moved to front`);
        }
    });
    group.addEventListener('mouseleave', () => {
        hitArea.setAttribute('r', '25');
        circle.setAttribute('r', '20');
        text.setAttribute('font-size', '20');
        circle.setAttribute('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))');
    });
    
    // クリックイベント：シンプルに1つだけ実装
    group.addEventListener('click', (e) => {
        e.stopPropagation();
        markerLogger.debug(`SVG Marker clicked: ${characterId}`);
        if (typeof showTrackingCard === 'function') {
            showTrackingCard(characterId);
        }
    });
    
    interactiveGroup.appendChild(group);
    
    // キャッシュに保存
    svgMarkerCache[characterId] = {
        group: group,
        hitArea: hitArea,
        circle: circle,
        text: text,
        position: position
    };
}

/**
 * 重なっているマーカーをグループ化
 * @param {Object} positions - { characterId: [lng, lat] }
 * @returns {Array} グループの配列
 */
function groupOverlappingMarkers(positions) {
    const characterIds = Object.keys(positions);
    const visited = new Set();
    const groups = [];

    characterIds.forEach(id1 => {
        if (visited.has(id1)) return;

        const group = [id1];
        visited.add(id1);
        const coords1 = positions[id1];

        characterIds.forEach(id2 => {
            if (id1 !== id2 && !visited.has(id2)) {
                const coords2 = positions[id2];
                const distance = getPixelDistance(coords1, coords2);

                if (distance < OVERLAP_CONFIG.threshold) {
                    group.push(id2);
                    visited.add(id2);
                }
            }
        });

        groups.push(group);
    });

    return groups;
}

/**
 * グループの中心座標を計算
 * @param {Array} characterIds - キャラクターIDの配列
 * @param {Object} positions - { characterId: [lng, lat] }
 * @returns {Array} [lng, lat]
 */
function getGroupCenter(characterIds, positions) {
    let sumLng = 0, sumLat = 0;
    characterIds.forEach(id => {
        const [lng, lat] = positions[id];
        sumLng += lng;
        sumLat += lat;
    });
    return [sumLng / characterIds.length, sumLat / characterIds.length];
}

/**
 * 髭線を描画
 * @param {Array} start - 開始点 [x, y] (ピクセル座標)
 * @param {Array} end - 終了点 [x, y] (ピクセル座標)
 * @param {SVGElement} parentGroup - 追加先のグループ要素
 */
function drawMarkerLine(start, end, parentGroup) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', start[0]);
    line.setAttribute('y1', start[1]);
    line.setAttribute('x2', end[0]);
    line.setAttribute('y2', end[1]);
    line.setAttribute('stroke', 'rgba(128, 128, 128, 0.8)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    parentGroup.appendChild(line);
}

/**
 * 中心点を描画
 * @param {Object} point - { x, y } (ピクセル座標)
 */
function drawCenterDot(point) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', 'rgba(80, 80, 80, 0.7)');
    circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.9)');
    circle.setAttribute('stroke-width', '1.5');
    markerLinesSvg.appendChild(circle);
}

/**
 * マーカーの言語表示を更新
 * @param {string} lang - 言語 ('ja' or 'en')
 */
function updateMarkerLanguage(lang) {
    // HTMLマーカーのテキストを更新
    Object.entries(characterMarkers).forEach(([characterId, marker]) => {
        const character = CHARACTERS[characterId];
        if (!character) return;
        
        const el = marker.getElement();
        if (el) {
            const iconText = lang === 'ja' ? character.icon : character.iconEn;
            el.textContent = iconText;
        }
    });
    
    // SVGマーカーのテキストを更新
    Object.entries(svgMarkerCache).forEach(([characterId, cached]) => {
        const character = CHARACTERS[characterId];
        if (!character) return;
        
        const iconText = lang === 'ja' ? character.icon : character.iconEn;
        cached.text.textContent = iconText;
    });
}

// ========================================
// エクスポート（グローバルスコープに公開）
// ========================================
window.initCharacterMarkers = initCharacterMarkers;
window.updateCharacterPositions = updateCharacterPositions;
window.getCurrentDisplayTime = getCurrentDisplayTime;
window.getCharacterCurrentPosition = getCharacterCurrentPosition;
window.updateMarkerLanguage = updateMarkerLanguage;
window.getAllPointsData = getAllPointsData;
