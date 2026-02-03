/** @file view_forecast_render.js @description Find機能のHTML描画担当 */

function generateForecastHeader(slots, status) {
    const lStr = slots.legendSlots.length > 0 ? slots.legendSlots.join(", ") : "なし";
    const pStr = slots.promotedSlots.length > 0 ? slots.promotedSlots.join(", ") : "なし";

    // 枠情報を横並びにするためのスタイル調整
    return `
        <div style="font-size: 0.85em; display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline;">
            <div style="display: flex; align-items: baseline; gap: 5px;">
                <span style="font-weight:bold; color:#e91e63; background:#ffe0eb; padding:1px 4px; border-radius:3px; white-space: nowrap;">伝説枠</span>
                <span style="font-family: monospace;">${lStr}</span>
            </div>
            <span style="color: #ccc;">/</span>
            <div style="display: flex; align-items: baseline; gap: 5px;">
                <span style="font-weight:bold; color:#9c27b0; background:#f3e5f5; padding:1px 4px; border-radius:3px; white-space: nowrap;">昇格枠</span>
                <span style="font-family: monospace;">${pStr}</span>
            </div>
        </div>
        ${showFindInfo ? `
        <div style="margin: 5px 0; text-align: left;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span onclick="clearAllTargets()" class="text-btn" title="全て非表示">×</span>
                <span class="separator">|</span>
                <span onclick="toggleLegendTargets()" class="${status.isLegendActive ? 'text-btn active' : 'text-btn'}">伝説</span>
                <span class="separator">|</span>
                <span onclick="toggleLimitedTargets()" class="${status.isLimitedActive ? 'text-btn active' : 'text-btn'}">限定</span>
                <span class="separator">|</span>
                <span onclick="toggleUberTargets()" class="${status.isUberActive ? 'text-btn active' : 'text-btn'}">超激</span>
                <span class="separator">|</span>
                <span id="toggle-master-info-btn" onclick="toggleMasterInfo()" class="${status.isMasterActive ? 'text-btn active' : 'text-btn'}">マスター</span>
                <span style="font-size: 0.8em; color: #666; margin-left: auto;">Target List</span>
            </div>
            <div style="font-size: 0.75em; color: #666; padding-left: 2px; line-height: 1.4;">
                ※キャラ名をタップで先頭へ移動。×で削除。右のアドレスをタップでルート探索。
            </div>
        </div>` : ''}
    `;
}



/**
 * ガチャごとの検索結果をレンダリングする
 * @param {Object} config ガチャ設定
 * @param {Map} resultMap 検索結果
 * @param {boolean} isSelectionMode 「選択（next）」エリア用の簡略表示かどうか
 */
/**
 * ガチャごとの検索結果をレンダリングする
 */
function renderGachaForecastList(config, resultMap, isSelectionMode = false) {
    if (resultMap.size === 0) return '';
    let allItems = Array.from(resultMap.entries()).map(([id, data]) => ({ id, ...data }));
    
    const rarityOrder = { 'legend': 1, 'uber': 3, 'super': 4, 'rare': 5 };
    allItems.sort((a, b) => {
        const getPriority = (char) => {
            if (char.isLimited) return 2;
            return rarityOrder[char.rarity] || 99;
        };
        const pA = getPriority(a), pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return (a.name || '').localeCompare(b.name || '');
    });

    if (isSelectionMode) {
        const itemsHtml = allItems.map(data => {
            const firstHit = data.hits[0] || "---";
            // 指定の配色を適用
            let color = '#333';
            if (data.isLegend) color = '#9c27b0';      // 伝説: 紫
            else if (data.isLimited) color = '#007bff'; // 限定: 青
            else if (data.rarity === 'uber') color = '#dc3545'; // 超激: 赤
            
            // 選択済みの場合は背景を黄色にしてハイライト
            const bgStyle = data.isActive ? 'background-color: #ffffcc; border-radius: 3px; padding: 0 2px;' : '';
            
            // クリック時はターゲット追加のみ（selectTargetAndHighlight を修正予定）
            return `<span class="next-char-item" style="cursor:pointer; color:${color}; ${bgStyle}" onclick="selectTargetAndHighlight('${data.id}', '${config.id}', null)">${data.name} <span style="font-size:0.9em; font-family:monospace; font-weight:bold;">${firstHit}</span></span>`;
        }).join('<span style="color:#ccc; margin:0 4px;">,</span> ');

        return `
            <div style="margin-bottom: 5px; font-size: 0.9em; line-height: 1.5;">
                <span style="color: #666; font-weight: bold;">＜${config.name}＞</span>
                ${itemsHtml}
            </div>
        `;
    }

    // ターゲットリスト（詳細表示）側も色を更新
    const prioritizedSet = new Set(userPrioritizedTargets.map(id => String(id)));
    const prioritizedItems = allItems.filter(item => prioritizedSet.has(String(item.id)));
    const normalItems = allItems.filter(item => !prioritizedSet.has(String(item.id)));

    let prioritizedHtml = prioritizedItems.map(data => renderTargetItem(data, config)).join('');
    let normalHtml = normalItems.map(data => renderTargetItem(data, config)).join('');
    let separatorHtml = (prioritizedItems.length > 0 && normalItems.length > 0) ? '<hr style="border: none; border-top: 1px dashed #ccc; margin: 4px 0;">' : '';

    return `
        <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; background: #eee; padding: 2px 5px; margin-bottom: 3px; font-size: 0.85em;">${config.name}</div>
            <div style="font-family: monospace; font-size: 1em;">
                ${prioritizedHtml}${separatorHtml}${normalHtml}
            </div>
        </div>
    `;
}

/**
 * ターゲットリスト用の各アイテム描画（色を更新）
 */
function renderTargetItem(data, config) {
    let color = '#333';
    if (data.isLegend) color = '#9c27b0';       // 紫
    else if (data.isLimited) color = '#007bff';  // 青
    else if (data.rarity === 'uber') color = '#dc3545'; // 赤
    
    let nameStyle = `font-weight:bold; font-size: 0.9em; cursor:pointer; color:${color};`;

    const hitLinks = data.hits.map(addr => {
        if (addr === "9999+") return `<span style="color:#999; font-weight:normal;">${addr}</span>`;
        const isB = addr.startsWith('B'), rowMatch = addr.match(/\d+/);
        const row = rowMatch ? parseInt(rowMatch[0], 10) : 0;
        const sIdx = (row - 1) * 2 + (isB ? 1 : 0);
        // ここでのアドレスクリックは、従来どおりルート計算(onGachaCellClick)を行う
        return `<span class="char-link" style="cursor:pointer; text-decoration:underline; margin-right:4px;" onclick="onGachaCellClick(${sIdx}, '${config.id}', '${data.name.replace(/'/g, "\\'")}', null, true, '${data.id}')">${addr}</span>`;
    }).join("");

    const otherBtn = `<span onclick="searchInAllGachas('${data.id}', '${data.name.replace(/'/g, "\\'")}')" style="cursor:pointer; margin-left:8px; color:#009688; font-size:0.8em; text-decoration:underline;" title="他ガチャを検索">other</span>`;
    
    return `
        <div style="margin-bottom: 2px; line-height: 1.3;">
            <span onclick="toggleCharVisibility('${data.id}')" style="cursor:pointer; margin-right:6px; color:#999; font-weight:bold;">×</span>
            <span style="${nameStyle}" onclick="prioritizeChar('${data.id}')">${data.name}</span>: 
            <span style="font-size: 0.85em; color: #555;">${hitLinks}${otherBtn}</span>
        </div>
    `;
}

/**
 * データの振り分け処理を修正（選択エリアでも全キャラ表示し、状態だけ付与）
 */
function processGachaForecast(config, seeds, scanRows, extendedScanRows, isSelectionMode = false) {
    const targets = getTargetInfoForConfig(config);
    if (targets.ids.size === 0) return '';

    const resultMap = new Map();
    const missingTargets = new Set(targets.ids);

    performScan(config, seeds, 0, scanRows * 2, targets, resultMap, missingTargets);
    if (missingTargets.size > 0) {
        performScan(config, seeds, scanRows * 2, extendedScanRows * 2, targets, resultMap, missingTargets);
    }

    missingTargets.forEach(cid => {
        if (!resultMap.has(cid)) {
            resultMap.set(cid, {
                name: gachaMasterData.cats[cid]?.name || cid,
                hits: ["9999+"], 
                rarity: gachaMasterData.cats[cid]?.rarity || 'rare',
                isLegend: (gachaMasterData.cats[cid]?.rarity === 'legend'),
                isNew: String(cid).startsWith('sim-new-'), 
                isLimited: false // 暫定
            });
        }
    });

    const filteredMap = new Map();
    const prioritizedSet = new Set(userPrioritizedTargets.map(id => String(id)));
    const manualSet = userTargetIds;

    resultMap.forEach((data, id) => {
        const isTargeted = prioritizedSet.has(String(id)) || manualSet.has(id) || manualSet.has(parseInt(id));
        
        if (isSelectionMode) {
            // 選択モード：フィルタリングせず、ターゲット済みかどうかのフラグだけ渡す
            filteredMap.set(id, { ...data, isActive: isTargeted });
        } else if (isTargeted) {
            // リストモード：ターゲット済みのものだけ表示
            filteredMap.set(id, data);
        }
    });

    return renderGachaForecastList(config, filteredMap, isSelectionMode);
}







function renderGlobalSearchResults() {
    let html = `<div style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #009688;">
            <div style="font-weight:bold; color:#009688; margin-bottom:5px; font-size:0.9em;">他ガチャでの「${globalSearchResults.charName}」出現位置:</div>`;
    if (globalSearchResults.results.length === 0) {
        html += `<div style="font-size:0.85em; color:#999; padding-left:5px;">他のガチャには出現しませんでした。</div>`;
    } else {
        globalSearchResults.results.forEach(res => {
            const displayHits = res.hits.map(h => {
                if (h === "9999+") return `<span style="color:#999; font-weight:normal;">${h}</span>`;
                const isB = h.endsWith('B'), row = parseInt(h);
                return `${isB ? 'B' : 'A'}${row})`;
            }).join(", ");
            html += `<div style="font-size:0.85em; margin-bottom:2px; padding-left:5px;"><span style="color:#666;">${res.gachaName}:</span> <span style="font-family:monospace; font-weight:bold;">${displayHits}</span></div>`;
        });
    }
    return html + `</div>`;
}