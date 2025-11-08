// ========================================
// キャラクターフィルタUI
// ========================================

/**
 * キャラクターフィルタUIを初期化
 * @param {number} maxVolume - ネタバレフィルタの最大巻数
 * @param {string} lang - 言語 ('ja' or 'en')
 */
function initCharacterFilter(maxVolume = 4, lang = 'ja') {
    const container = document.getElementById('character-filters');
    if (!container) return;

    // 親要素を取得（全選択/解除ボタンを追加するため）
    const parentSection = container.parentElement;
    
    // 既存のコントロールボタンを削除
    const existingControls = parentSection.querySelector('.character-filter-controls');
    if (existingControls) {
        existingControls.remove();
    }

    // 全選択/解除ボタンを作成
    const controls = document.createElement('div');
    controls.className = 'character-filter-controls';

    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'character-filter-btn';
    selectAllBtn.textContent = lang === 'ja' ? '全て選択' : 'Select All';
    selectAllBtn.addEventListener('click', () => selectAllCharacters(true));

    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'character-filter-btn';
    deselectAllBtn.textContent = lang === 'ja' ? '全て解除' : 'Deselect All';
    deselectAllBtn.addEventListener('click', () => selectAllCharacters(false));

    controls.appendChild(selectAllBtn);
    controls.appendChild(deselectAllBtn);
    
    // コントロールボタンをコンテナの前に挿入
    parentSection.insertBefore(controls, container);

    // コンテナをクリア
    container.innerHTML = '';

    // 指定巻数までのキャラクターを取得
    const characterIds = getCharacterIdsByVolume(maxVolume);
    
    // 有効なキャラクターセットを初期化
    AppState.enabledCharacters = new Set(characterIds);
    
    // キャラクターごとにフィルタアイテムを生成
    characterIds.forEach(id => {
        const char = CHARACTERS[id];
        if (!char) return;

        const item = document.createElement('div');
        item.className = 'character-filter-item active';
        item.dataset.characterId = id;
        
        // アイテム全体の背景色とボーダー色を設定
        item.style.setProperty('color', char.color);
        item.style.setProperty('--item-bg-color', char.color);
        
        // アイテム全体をクリック可能に
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            item.classList.toggle('active');
            handleCharacterToggle(id, !isActive);
        });

        const iconBadge = document.createElement('span');
        iconBadge.className = 'character-icon-badge';
        iconBadge.dataset.icon = lang === 'ja' ? char.icon : char.iconEn;
        iconBadge.style.setProperty('--char-color', char.color);
        iconBadge.style.background = 'white';
        
        const innerCircle = document.createElement('span');
        innerCircle.style.cssText = `
            position: absolute;
            top: 2px;
            left: 2px;
            right: 2px;
            bottom: 2px;
            border-radius: 50%;
            background: ${char.color};
            z-index: 1;
        `;
        
        const iconText = document.createElement('span');
        iconText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
            z-index: 2;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        `;
        iconText.textContent = lang === 'ja' ? char.icon : char.iconEn;
        
        iconBadge.appendChild(innerCircle);
        iconBadge.appendChild(iconText);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'character-name';
        nameSpan.textContent = lang === 'ja' ? char.name : char.nameEn;

        item.appendChild(iconBadge);
        item.appendChild(nameSpan);
        
        container.appendChild(item);
    });
}

/**
 * 全キャラクターを選択/解除
 * @param {boolean} select - true: 全選択, false: 全解除
 */
function selectAllCharacters(select) {
    const items = document.querySelectorAll('.character-filter-item');
    items.forEach(item => {
        const id = parseInt(item.dataset.characterId);
        const isActive = item.classList.contains('active');
        
        if (select && !isActive) {
            item.classList.add('active');
            handleCharacterToggle(id, true);
        } else if (!select && isActive) {
            item.classList.remove('active');
            handleCharacterToggle(id, false);
        }
    });
}

/**
 * キャラクターの表示ON/OFFを処理
 * @param {number} id - キャラクターID
 * @param {boolean} enabled - 有効/無効
 */
function handleCharacterToggle(id, enabled) {
    const character = CHARACTERS[id];
    const charName = character ? (character.name || id) : id;
    
    if (enabled) {
        AppState.enabledCharacters.add(id);
        console.log(`[CharacterFilter] Enabled character ${id} (${charName}). Total enabled: ${AppState.enabledCharacters.size}`);
    } else {
        AppState.enabledCharacters.delete(id);
        console.log(`[CharacterFilter] Disabled character ${id} (${charName}). Total enabled: ${AppState.enabledCharacters.size}`);
    }
    
    // マーカーの表示/非表示を更新
    updateCharacterMarkerVisibility();
    
    // カスタムイベントを発火して地図側に通知
    const event = new CustomEvent('characterFilterChanged', {
        detail: {
            characterId: id,
            enabled: enabled,
            enabledCharacters: Array.from(AppState.enabledCharacters)
        }
    });
    document.dispatchEvent(event);
}

/**
 * キャラクターマーカーの表示/非表示を更新
 */
function updateCharacterMarkerVisibility() {
    console.log('[CharacterFilter] updateCharacterMarkerVisibility called');
    
    let visibleCount = 0;
    let hiddenCount = 0;
    let trackingCharacterHidden = false;
    
    // HTMLマーカーの表示状態を更新（存在する場合のみ）
    if (typeof characterMarkers !== 'undefined') {
        Object.keys(characterMarkers).forEach(characterId => {
            const id = parseInt(characterId);
            const marker = characterMarkers[id];
            const character = CHARACTERS[id];
            
            if (!marker || !character) return;
            
            // ネタバレフィルタチェック: 現在の巻数以下のキャラクターのみ表示対象
            const isWithinVolume = character.volume <= AppState.currentVolume;
            
            // キャラクターフィルタチェック: ONになっているキャラクターのみ表示
            const isEnabled = AppState.enabledCharacters.has(id);
            
            // 両方の条件を満たす場合のみ表示
            const shouldShow = isWithinVolume && isEnabled;
            
            // トラッキング中のキャラクターが非表示になるかチェック
            if (!shouldShow && typeof getCurrentTrackingCharacterId === 'function') {
                const trackingId = getCurrentTrackingCharacterId();
                if (trackingId !== null && parseInt(trackingId) === id) {
                    trackingCharacterHidden = true;
                }
            }
            
            // マーカー要素の表示/非表示を切り替え
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.style.display = shouldShow ? 'flex' : 'none';
                
                if (shouldShow) {
                    visibleCount++;
                } else {
                    hiddenCount++;
                }
            }
        });
        
        console.log(`[CharacterFilter] HTML Marker visibility updated: ${visibleCount} visible, ${hiddenCount} hidden`);
    } else {
        console.log('[CharacterFilter] No HTML markers (using SVG markers)');
    }
    
    // トラッキング中のキャラクターが非表示になった場合、トラッキングを解除
    if (trackingCharacterHidden) {
        const trackingId = typeof getCurrentTrackingCharacterId === 'function' ? getCurrentTrackingCharacterId() : 'unknown';
        console.log(`[CharacterFilter] Tracking character ${trackingId} is now hidden, disabling tracking`);
        if (typeof hideTrackingCard === 'function') {
            hideTrackingCard();
        }
    }
    
    // フィルタで非表示になったキャラクターの得点ポップアップをクリア
    if (typeof window.cleanupHiddenScorePopups === 'function') {
        window.cleanupHiddenScorePopups();
    }
    
    // SVGマーカーの表示状態を更新（updateOverlapLayoutに任せる）
    // updateOverlapLayoutがフィルタ状態を反映して全てのSVGマーカーを正しく制御する
    if (typeof updateOverlapLayout === 'function') {
        updateOverlapLayout();
    }
}

/**
 * 有効なキャラクターIDのセットを取得
 * @returns {Set} 有効なキャラクターIDのセット
 */
function getEnabledCharacters() {
    return AppState.enabledCharacters;
}

/**
 * キャラクターが有効かどうかをチェック
 * @param {number} id - キャラクターID
 * @returns {boolean} 有効な場合true
 */
function isCharacterEnabled(id) {
    return AppState.enabledCharacters.has(id);
}

/**
 * 言語変更時にキャラクターフィルタを更新
 * @param {string} lang - 言語 ('ja' or 'en')
 */
function updateCharacterFilterLanguage(lang) {
    // コントロールボタンのテキストを更新
    const controls = document.querySelector('.character-filter-controls');
    if (controls) {
        const buttons = controls.querySelectorAll('.character-filter-btn');
        if (buttons[0]) {
            buttons[0].textContent = lang === 'ja' ? '全て選択' : 'Select All';
        }
        if (buttons[1]) {
            buttons[1].textContent = lang === 'ja' ? '全て解除' : 'Deselect All';
        }
    }

    // キャラクターアイテムを更新
    const items = document.querySelectorAll('.character-filter-item');
    items.forEach(item => {
        const id = parseInt(item.dataset.characterId);
        const char = CHARACTERS[id];
        if (!char) return;

        const iconBadge = item.querySelector('.character-icon-badge');
        const nameSpan = item.querySelector('.character-name');
        
        if (iconBadge) {
            // アイコン内のテキストを更新（2番目の子要素）
            const iconText = iconBadge.children[1];
            if (iconText) {
                iconText.textContent = lang === 'ja' ? char.icon : char.iconEn;
            }
        }
        if (nameSpan) {
            nameSpan.textContent = lang === 'ja' ? char.name : char.nameEn;
        }
    });
}
