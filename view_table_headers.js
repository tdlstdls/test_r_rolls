/** @file view_table_headers.js @description テーブルヘッダー詳細描画（行数圧縮・表示形式最適化版） */

/**
 * 名称ヘッダーの生成 (ID 名称 [11G] 日付 を1つのフローで描画)
 * @param {boolean} isLeftSide - Aトラック(左側)かどうか
 * @param {boolean} isSticky - 固定ヘッダー（スクロール用）かどうか
 */
function generateNameHeaderHTML(isLeftSide, isSticky = false) {
    let html = "";
    const bgColor = isLeftSide ? "#f8f9fa" : "#eef9ff";
    const trackClass = isLeftSide ? "" : "track-b"; 
    const commonStyle = `background-color: ${bgColor}; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 2px solid #ccc; position: relative;`;

    tableGachaIds.forEach((idWithSuffix, index) => {
        let idFromSuffix = idWithSuffix.replace(/[gfs]$/, '');
        const suffix = idWithSuffix.match(/[gfs]$/)?.[0] || '';
        const isGCol = suffix !== '';
        const config = gachaMasterData.gachas[idFromSuffix];
        if (!config) return;

        const options = (typeof getGachaSelectorOptions === 'function') ? getGachaSelectorOptions(idFromSuffix) : [];
        const currentOpt = options.find(o => String(o.value) === idFromSuffix);
        let label = currentOpt ? currentOpt.label : config.name;
        
        // 1. メタデータの抽出
        const idMatch = label.match(/\((\d+)[gfs]?\)/);
        const displayId = idMatch ? idMatch[1] : idFromSuffix;
        
        const dateMatch = label.match(/(\d{1,2}\/\d{1,2}~(?:\d{1,2}\/\d{1,2})?)/);
        let displayDate = dateMatch ? dateMatch[1] : "";
        
        // 2. 名称のクレンジング (データ由来の▽や▼を除去)
        const metaRegex = /(?:\[確定\])?\s*(?:\d{1,2}\/\d{1,2}~(?:\d{1,2}\/\d{1,2})?)?\s*\(\d+[gfs]?\)\s*(?:\[\d+G\])?/;
        const nameParts = label.split(metaRegex).map(p => p.trim()).filter(p => p);
        let displayName = nameParts.length > 1 ? nameParts.reverse().join(' ') : (nameParts[0] || config.name);
        displayName = displayName.replace(/[▽▼]$/, '').trim();

        // 3. 特例処理
        const isSpecial = displayName.includes("プラチナガチャ") || displayName.includes("レジェンドガチャ");
        if (isSpecial) displayDate = "";

        // 4. ラベル・追加情報の生成
        const gText = isGCol ? ` [${(suffix === 'g') ? '11G' : (suffix === 'f' ? '15G' : '7G')}]` : "";
        const addCount = uberAdditionCounts[index] || 0;
        const addStr = addCount > 0 ? ` <span style="color:#d9534f; font-weight:normal; font-size:0.85em;">(add:${addCount})</span>` : "";

        // 5. ▽の削除
        const arrowHTML = "";

        // 6. 切り替え用透明セレクトボックス
        let select = `<select onchange="updateGachaSelection(this, ${index})" style="width:100%; height:100%; opacity:0; position:absolute; left:0; top:0; cursor:pointer; z-index:2;">`;
        options.forEach(opt => {
            select += `<option value="${opt.value}" ${String(opt.value) === idFromSuffix ? 'selected' : ''}>${opt.label}</option>`;
        });
        select += `</select>`;

        // 7. 表示HTMLの組み立て
        const nameAndIdHTML = `<span style="font-weight:bold;">${displayId} ${displayName}${gText}${addStr}${arrowHTML}</span>`;
        const dateHTML = displayDate ? `<span style="font-size:0.85em; color:#666; font-weight:normal; margin-left:6px; white-space:nowrap;">${displayDate}</span>` : "";

        const colspan = isGCol ? 'colspan="2"' : '';
        html += `<th ${colspan} class="gacha-column ${trackClass}" style="vertical-align: top; padding: 4px 6px; ${commonStyle}">
                    ${select}
                    <div style="text-align: left; line-height: 1.2; word-break: break-all; position: relative; z-index: 1;">
                        ${nameAndIdHTML}${dateHTML}
                    </div>
                 </th>`;
    });
    return html;
}

/**
 * 操作ヘッダーの生成
 */
function generateControlHeaderHTML(isInteractive) {
    let html = "";
    const bgColor = isInteractive ? "#f8f9fa" : "#eef9ff";
    const commonStyle = `background-color: ${bgColor}; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd;`;

    tableGachaIds.forEach((idWithSuffix, index) => {
        let id = idWithSuffix.replace(/[gfs]$/, '');
        let suffix = idWithSuffix.match(/[gfs]$/)?.[0] || '';
        const isGCol = suffix !== '';

        let controlArea = "";
        const options = (typeof getGachaSelectorOptions === 'function') ? getGachaSelectorOptions(id) : [];
        let select = `<select onchange="updateGachaSelection(this, ${index})" style="width:100%; height:100%; opacity:0; position:absolute; left:0; top:0; cursor:pointer;">`;
        options.forEach(opt => {
            select += `<option value="${opt.value}" ${String(opt.value) === id ? 'selected' : ''}>${opt.label}</option>`;
        });
        select += `</select>`;
        
        const btnCommonStyle = "font-size:9px; padding:0 2px; height:16px; line-height:14px; display:inline-flex; align-items:center; justify-content:center;";
        const pullDownBtn = `<div style="position:relative; width:16px; height:16px; background:#eee; border:1px solid #999; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:9px;">▼${select}</div>`;
        
        let gLabel = (suffix === 'g') ? '11G' : (suffix === 'f' ? '15G' : (suffix === 's' ? '7G' : 'G'));
        const gBtn = `<button onclick="toggleGStep(${index})" style="${btnCommonStyle} min-width:22px;">${gLabel}</button>`;
        
        const curAdd = uberAdditionCounts[index] || 0;
        const addLabel = curAdd > 0 ? `+${curAdd}` : `add`;
        const addBtn = `<button id="add-trigger-${index}" onclick="showAddInput(${index})" style="${btnCommonStyle} min-width:24px; color:#007bff; border:1px solid #007bff; background:#fff;">${addLabel}</button>`;
        
        let addSelect = `<span id="add-select-wrapper-${index}" style="display:none;"><select class="uber-add-select" onchange="updateUberAddition(this, ${index})" style="width:32px; font-size:9px; height:16px;">`;
        for(let k=0; k<=20; k++) addSelect += `<option value="${k}" ${k===curAdd?'selected':''}>${k}</option>`;
        addSelect += `</select></span>`;
        
        const delBtn = `<button class="remove-btn" onclick="removeGachaColumn(${index})" style="${btnCommonStyle} min-width:16px; padding:0 4px;">×</button>`;
        
        controlArea = `<div style="display:flex; justify-content:flex-start; align-items:center; gap:2px; flex-wrap:wrap;">${pullDownBtn}${gBtn}${addBtn}${addSelect}${delBtn}</div>`;

        if (isGCol) {
            html += `<th colspan="2" class="gacha-column" style="padding: 2px; ${commonStyle}">${controlArea}</th>`;
        } else {
            html += `<th class="gacha-column" style="padding: 2px; ${commonStyle}">${controlArea}</th>`;
        }
    });
    return html;
}