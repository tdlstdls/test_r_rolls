/** @file view_forecast_render.js @description Find機能のHTML描画担当 */

// ガチャごとの開閉状態を管理
if (typeof collapsedGachaIds === 'undefined') {
    var collapsedGachaIds = new Set();
}

function generateForecastHeader(slots, status) {
    const lStr = slots.legendSlots.length > 0 ? slots.legendSlots.join(", ") : "なし";
    const pStr = slots.promotedSlots.length > 0 ? slots.promotedSlots.join(", ") : "なし";

    // ボタンの共通スタイル定義
    const btnBaseStyle = "display: inline-block; padding: 2px 8px; margin: 0 2px; border-radius: 4px; border: 1px solid #ccc; background: #f8f9fa; cursor: pointer; font-size: 13px; transition: all 0.2s;";
    const activeStyle = "background: #007bff; color: #fff; border-color: #0056b3;";

    return `
        <div style="font-size: 14px; margin-bottom: 5px; line-height: 1.4; text-align: left; word-break: break-word;">
            <span style="font-weight:bold; color:#e91e63; margin-right: 5px;">(伝説枠)</span><span style="font-family: monospace; margin-right: 10px;">${lStr}</span>
            <span style="font-weight:bold; color:#9c27b0; margin-right: 5px;">(昇格枠)</span><span style="font-family: monospace;">${pStr}</span>
        </div>
        ${showFindInfo ? `
        <div style="margin: 8px 0; text-align: left;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
                <span onclick="clearAllTargets()" class="text-btn" style="${btnBaseStyle} color: #666;" title="全て非表示">×</span>
                <span class="separator" style="color: #ccc; margin: 0 2px;">|</span>
                <button onclick="toggleLegendTargets()" style="${btnBaseStyle} ${status.isLegendActive ? activeStyle : ''}">伝説</button>
                <button onclick="toggleLimitedTargets()" style="${btnBaseStyle} ${status.isLimitedActive ? activeStyle : ''}">限定</button>
                <button onclick="toggleUberTargets()" style="${btnBaseStyle} ${status.isUberActive ? activeStyle : ''}">超激</button>
                <button onclick="toggleSuperTargets()" style="${btnBaseStyle} ${status.isSuperActive ? activeStyle : ''}">激レア</button>
                <button onclick="toggleRareTargets()" style="${btnBaseStyle} ${status.isRareActive ? activeStyle : ''}">レア</button>
                <span class="separator" style="color: #ccc; margin: 0 2px;">|</span>
                <button id="toggle-master-info-btn" onclick="toggleMasterInfo()" style="${btnBaseStyle} ${status.isMasterActive ? activeStyle : ''}">マスター</button>
            </div>
            <div style="font-size: 0.9em; color: #666; padding-left: 2px; line-height: 1.5;">
                ※キャラ名をタップで追跡ON/OFF。×で削除。右のアドレスをタップでルート探索。
            </div>
        </div>` : ''}
    `;
}

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
                isLimited: false 
            });
        }
    });

    const filteredMap = new Map();
    const prioritizedSet = new Set(userPrioritizedTargets.map(id => String(id)));
    const manualSet = userTargetIds;

    resultMap.forEach((data, id) => {
        const isTargeted = prioritizedSet.has(String(id)) || manualSet.has(id) || manualSet.has(parseInt(id));
        if (isSelectionMode) {
            filteredMap.set(id, { ...data, isActive: isTargeted });
        } else if (isTargeted) {
            filteredMap.set(id, data);
        }
    });

    return renderGachaForecastList(config, filteredMap, isSelectionMode);
}

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
        const isCollapsed = collapsedGachaIds.has(config.id);
        const toggleBtn = isCollapsed ? 
            `<span style="cursor:pointer; color:#007bff; font-family:monospace; margin-right:6px; font-weight:bold;">[+]</span>` : 
            `<span style="cursor:pointer; color:#666; font-family:monospace; margin-right:6px; font-weight:bold;">[-]</span>`;

        let itemsHtml = '';
        if (!isCollapsed) {
            itemsHtml = allItems.map(data => {
                const firstHit = data.hits[0] || "---";
                let color = '#333';
                if (data.isLegend) color = '#9c27b0';
                else if (data.isLimited) color = '#007bff';
                else if (data.rarity === 'uber') color = '#dc3545';
                else if (data.rarity === 'super') color = '#e67e22'; // 激レア用
                else if (data.rarity === 'rare') color = '#2ecc71';  // レア用
                
                const bgStyle = data.isActive ? 'background-color: #ffffcc; border-radius: 3px; padding: 0 2px;' : '';
                return `<span class="next-char-item" style="cursor:pointer; color:${color}; ${bgStyle}" onclick="selectTargetAndHighlight('${data.id}', '${config.id}', null)">${data.name} <span style="font-size:14px; font-family:monospace; font-weight:bold;">${firstHit}</span></span>`;
            }).join('<span style="color:#ccc; margin:0 4px;">,</span> ');
        }

        return `
            <div style="margin-bottom: 8px; font-size: 14px; line-height: 1.6;">
                <span onclick="toggleGachaCollapse('${config.id}')">${toggleBtn}</span>
                <span style="color: #333; font-weight: bold; cursor:pointer;" onclick="toggleGachaCollapse('${config.id}')">${config.name}</span>
                <div style="padding-left: 20px; margin-top: 2px;">${itemsHtml}</div>
            </div>
        `;
    }

    let html = allItems.map(data => renderTargetItem(data, config)).join('');
    return `
        <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; background: #eee; padding: 3px 6px; margin-bottom: 4px; font-size: 14px; border-left: 3px solid #ccc;">${config.name}</div>
            <div style="font-family: monospace; font-size: 14px; padding-left: 5px;">${html}</div>
        </div>
    `;
}

function renderTargetItem(data, config) {
    let color = '#333';
    if (data.isLegend) color = '#9c27b0';
    else if (data.isLimited) color = '#007bff';
    else if (data.rarity === 'uber') color = '#dc3545';
    else if (data.rarity === 'super') color = '#e67e22'; // 激レア用
    else if (data.rarity === 'rare') color = '#2ecc71';  // レア用
    
    // キャラ名のサイズ
    let nameStyle = `font-weight:bold; font-size: 14px; cursor:pointer; color:${color};`;

    const hitLinks = data.hits.map(addr => {
        if (addr === "9999+") return `<span style="color:#999; font-weight:normal; font-size: 14px;">${addr}</span>`;
        const isB = addr.startsWith('B'), rowMatch = addr.match(/\d+/);
        const row = rowMatch ? parseInt(rowMatch[0], 10) : 0;
        const sIdx = (row - 1) * 2 + (isB ? 1 : 0);
        // アドレスのサイズ
        return `<span class="char-link" style="cursor:pointer; text-decoration:underline; margin-right:8px; font-size: 14px;" onclick="onGachaCellClick(${sIdx}, '${config.id}', '${data.name.replace(/'/g, "\\'")}', null, true, '${data.id}')">${addr}</span>`;
    }).join("");

    const otherBtn = `<span onclick="searchInAllGachas('${data.id}', '${data.name.replace(/'/g, "\\'")}')" style="cursor:pointer; margin-left:8px; color:#009688; font-size:14px; text-decoration:underline;" title="他ガチャを検索">other</span>`;
    
    return `
        <div style="margin-bottom: 4px; line-height: 1.6;">
            <span onclick="toggleCharVisibility('${data.id}')" style="cursor:pointer; margin-right:8px; color:#999; font-weight:bold; font-size: 14px;">×</span>
            <span style="${nameStyle}" onclick="prioritizeChar('${data.id}')">${data.name}</span>: 
            <span style="font-size: 14px; color: #555;">${hitLinks}${otherBtn}</span>
        </div>
    `;
}