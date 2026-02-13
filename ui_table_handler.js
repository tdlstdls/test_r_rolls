/** @file ui_table_handler.js @description テーブルヘッダー詳細描画（透過バグ修正・UX向上版） */

// ヘッダーのインタラクションを高めるためのスタイル注入
if (typeof injectStyles === 'function') {
    injectStyles(`
        /* * 【修正】ガチャヘッダーの重ね合わせとホバー時の透過防止設定
         * 1. z-index: 110 (Tier 1) を設定し、データ行(100)よりも前面に表示。
         */
        #rolls-table-container th.gacha-column.clickable-header {
            cursor: pointer;
            transition: background-color 0.2s ease;
            position: relative;
            z-index: 110; 
        }

        /* * 固定行（sticky-row）内での固定表示設定 */
        #rolls-table-container .sticky-row th.gacha-column.clickable-header {
            position: -webkit-sticky;
            position: sticky;
            top: 0;
        }

        /* * 【重要修正】ホバー時の透過防止
         * background-color を書き換えるとインラインの背景色が消えて透過してしまうため、
         * box-shadow (inset) を使用して、元の色の上にハイライトを重ねます。
         */
        #rolls-table-container th.gacha-column.clickable-header:hover {
            box-shadow: inset 0 0 0 999px rgba(0, 123, 255, 0.1);
        }
        
        /* ヘッダー内の透明なセレクトボックス（クリックイベント受信用） */
        .header-select-overlay {
            width: 100%;
            height: 100%;
            opacity: 0;
            position: absolute;
            left: 0;
            top: 0;
            cursor: pointer;
            z-index: 2;
        }
    `);
}

/**
 * 名称ヘッダーの生成 (ヘッダー全体をクリック可能なプルダウンとして構築)
 * @param {boolean} isLeftSide - Aトラック(左側)かどうか
 */
function generateNameHeaderHTML(isLeftSide) {
    let html = "";
    const bgColor = isLeftSide ? "#f8f9fa" : "#eef9ff";
    const trackClass = isLeftSide ? "" : "track-b"; 
    const commonStyle = `background-color: ${bgColor}; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 2px solid #ccc;`;

    tableGachaIds.forEach((idWithSuffix, index) => {
        let idFromSuffix = idWithSuffix.replace(/[gfs]$/, '');
        const suffix = idWithSuffix.match(/[gfs]$/)?.[0] || '';
        const isGCol = suffix !== '';
        const config = gachaMasterData.gachas[idFromSuffix];
        if (!config) return;

        const options = (typeof getGachaSelectorOptions === 'function') ? getGachaSelectorOptions(idFromSuffix) : [];
        const currentOpt = options.find(o => String(o.value) === idFromSuffix);
        let label = currentOpt ? currentOpt.label : config.name;
        
        // メタデータの抽出
        const idMatch = label.match(/\((\d+)[gfs]?\)/);
        const displayId = idMatch ? idMatch[1] : idFromSuffix;
        const dateMatch = label.match(/(\d{1,2}\/\d{1,2}~(?:\d{1,2}\/\d{1,2})?)/);
        let displayDate = dateMatch ? dateMatch[1] : "";
        
        // 名称のクレンジング
        const metaRegex = /(?:\[確定\])?\s*(?:\d{1,2}\/\d{1,2}~(?:\d{1,2}\/\d{1,2})?)?\s*\(\d+[gfs]?\)\s*(?:\[\d+G\])?/;
        const nameParts = label.split(metaRegex).map(p => p.trim()).filter(p => p);
        let displayName = nameParts.length > 1 ? nameParts.reverse().join(' ') : (nameParts[0] || config.name);

        if (displayName.includes("プラチナガチャ") || displayName.includes("レジェンドガチャ")) displayDate = "";

        const gText = isGCol ? ` [${(suffix === 'g') ? '11G' : (suffix === 'f' ? '15G' : '7G')}]` : "";
        const addCount = uberAdditionCounts[index] || 0;
        const addStr = addCount > 0 ? ` <span style="color:#d9534f; font-weight:normal; font-size:0.85em;">+${addCount}</span>` : "";

        // 透明なセレクトボックス
        let selectHTML = `<select class="header-select-overlay" onchange="updateGachaSelection(this, ${index})" title="クリックしてガチャを切り替え">`;
        options.forEach(opt => {
            selectHTML += `<option value="${opt.value}" ${String(opt.value) === idFromSuffix ? 'selected' : ''}>${opt.label}</option>`;
        });
        selectHTML += `</select>`;

        const nameAndIdHTML = `<span style="font-weight:bold;">${displayId} ${displayName}${gText}${addStr}</span>`;
        const dateHTML = displayDate ? `<span style="font-size:0.85em; color:#666; font-weight:normal; margin-left:6px; white-space:nowrap;">${displayDate}</span>` : "";

        const colspan = isGCol ? 'colspan="2"' : '';
        html += `<th ${colspan} class="gacha-column ${trackClass} clickable-header" style="vertical-align: top; padding: 0; ${commonStyle}">
                    ${selectHTML}
                    <div style="position: absolute; right: 4px; top: 4px; font-size: 8px; color: #aaa; pointer-events: none;">▼</div>
                    <div style="text-align: left; line-height: 1.2; word-break: break-all; padding: 4px 6px; pointer-events: none;">
                        ${nameAndIdHTML}${dateHTML}
                    </div>
                 </th>`;
    });
    return html;
}

/**
 * 操作ヘッダーの生成 (ボタンの視認性を強化)
 */
function generateControlHeaderHTML(isInteractive) {
    let html = "";
    const bgColor = isInteractive ? "#f8f9fa" : "#eef9ff";
    const commonStyle = `background-color: ${bgColor}; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd;`;

    tableGachaIds.forEach((idWithSuffix, index) => {
        let id = idWithSuffix.replace(/[gfs]$/, '');
        let suffix = idWithSuffix.match(/[gfs]$/)?.[0] || '';
        const isGCol = suffix !== '';

        const options = (typeof getGachaSelectorOptions === 'function') ? getGachaSelectorOptions(id) : [];
        let select = `<select onchange="updateGachaSelection(this, ${index})" style="width:100%; height:100%; opacity:0; position:absolute; left:0; top:0; cursor:pointer;">`;
        options.forEach(opt => {
            select += `<option value="${opt.value}" ${String(opt.value) === id ? 'selected' : ''}>${opt.label}</option>`;
        });
        select += `</select>`;
        
        const btnCommonStyle = "font-size:9px; padding:0 3px; height:18px; line-height:16px; display:inline-flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer;";
        
        const pullDownBtn = `
            <div style="position:relative; min-width:56px; height:18px; background:#007bff; color:#fff; border:1px solid #0056b3; ${btnCommonStyle}">
                <span style="margin-right:2px;">ガチャ切替</span>▼${select}
            </div>`;
        
        // 確定ステップ選択ボタンの構築
        let gLabel = (suffix === 'g') ? '11G' : (suffix === 'f' ? '15G' : (suffix === 's' ? '7G' : '確定'));
        const gBtn = `
            <div style="position:relative; min-width:32px; height:18px; border:1px solid #999; background:#fff; ${btnCommonStyle}">
                ${gLabel}
                <select onchange="updateGachaStep(this, ${index})" style="width:100%; height:100%; opacity:0; position:absolute; left:0; top:0; cursor:pointer;">
                    <option value="" ${suffix===''?'selected':''}>-</option>
                    <option value="g" ${suffix==='g'?'selected':''}>11G</option>
                    <option value="f" ${suffix==='f'?'selected':''}>15G</option>
                    <option value="s" ${suffix==='s'?'selected':''}>7G</option>
                </select>
            </div>`;
        
        const curAdd = uberAdditionCounts[index] || 0;
        const addLabel = curAdd > 0 ? `+${curAdd}` : `add`;
        const addBtn = `<button id="add-trigger-${index}" onclick="showAddInput(${index})" style="${btnCommonStyle} min-width:26px; color:#d9534f; border:1px solid #d9534f; background:#fff;">${addLabel}</button>`;
        
        let addSelect = `<span id="add-select-wrapper-${index}" style="display:none;"><select class="uber-add-select" onchange="updateUberAddition(this, ${index})" style="width:32px; font-size:9px; height:18px;">`;
        for(let k=0; k<=20; k++) addSelect += `<option value="${k}" ${k===curAdd?'selected':''}>${k}</option>`;
        addSelect += `</select></span>`;
        
        const delBtn = `<button class="remove-btn" onclick="removeGachaColumn(${index})" style="${btnCommonStyle} min-width:18px; padding:0 4px; border:1px solid #ccc; background:#fff;">×</button>`;
        
        const controlArea = `<div style="display:flex; justify-content:flex-start; align-items:center; gap:3px; flex-wrap:wrap;">${pullDownBtn}${gBtn}${addBtn}${addSelect}${delBtn}</div>`;

        if (isGCol) {
            html += `<th colspan="2" class="gacha-column" style="padding: 4px 2px; ${commonStyle}">${controlArea}</th>`;
        } else {
            html += `<th class="gacha-column" style="padding: 4px 2px; ${commonStyle}">${controlArea}</th>`;
        }
    });
    return html;
}