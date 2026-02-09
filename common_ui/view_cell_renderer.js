/** @file view_cell_renderer.js @description 個別セルの描画とレアリティ色の制御（全セル罫線表示・SEED [index] 1列集約版） */

/**
 * テーブル用アドレス（A1, B25等）のフォーマット
 * @param {number} idx - SEEDインデックス
 * @returns {string} フォーマット済み文字列
 */
function formatAddress(idx) {
    if (idx === null || idx === undefined) return '';
    const row = Math.floor(idx / 2) + 1;
    const side = (idx % 2 === 0) ? 'A' : 'B';
    return `${side}${row})`;
}

/**
 * SEED値などの詳細セル（左側の列）を生成する
 * 修正：罫線(border)を追加
 */
function generateDetailedCalcCells(seedIndex, seeds, tableData) {
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;
    const borderStyle = "border: 1px solid #ddd;";
    
    if (!showSeedColumns) return `<td class="${calcColClass}" style="${borderStyle}"></td>`;
    
    if (seedIndex >= seeds.length) return `<td class="${calcColClass}" style="${borderStyle}">-</td>`;

    const s0 = seeds[seedIndex];
    // SEED値 [index] の形式で表示
    return `<td class="${calcColClass}" style="${borderStyle}">${s0} [${seedIndex}]</td>`;
}

/**
 * 通常のガチャ結果セル（1マス分）を生成する
 * 修正：罫線(border)を style に追加
 */
function generateCell(seedIndex, id, colIndex, tableData, seeds, highlightMap, isSimulationMode) {
    const rowData = tableData[seedIndex];
    const cell = rowData?.cells?.[colIndex];
    
    const borderStyle = "border: 1px solid #ddd; ";
    if (!cell || !cell.roll) return `<td class="gacha-cell" style="${borderStyle}">-</td>`;
    
    const rr = cell.roll;
    let charName = (rr.finalChar && rr.finalChar.name) ? rr.finalChar.name : "データ不足";
    const charId = rr.finalChar.id;
    const charIdStr = String(charId);

    // 狭幅モード時の名前省略
    if (typeof isNarrowMode !== 'undefined' && isNarrowMode && charName.length > 10) {
        charName = charName.substring(0, 9) + "...";
    }

    // --- 1. 背景色の判定ロジック ---
    let bgColorStyle = '';
    const sv = seeds[seedIndex] % 10000;

    const isPrioritized = (typeof userPrioritizedTargets !== 'undefined') && 
                          (userPrioritizedTargets.includes(charId) || userPrioritizedTargets.includes(charIdStr));

    let isLimited = false;
    if (typeof limitedCats !== 'undefined' && Array.isArray(limitedCats)) {
        if (limitedCats.includes(parseInt(charId)) || limitedCats.includes(charIdStr)) {
            isLimited = true;
        }
    }

    if (isPrioritized) {
        bgColorStyle = 'background-color: #6EFF72; font-weight: bold;'; 
    } 
    else if (isSimulationMode && highlightMap.get(seedIndex) === id) {
        if (isLimited || rr.rarity === 'uber' || rr.rarity === 'legend') {
            bgColorStyle = 'background:#32CD32;';
        } else {
            bgColorStyle = 'background:#98FB98;';
        }
    } 
    else if (isLimited) {
        bgColorStyle = 'background-color: #66FFFF;';
    } 
    else {
        if (sv >= 9970) bgColorStyle = 'background-color: #DDA0DD;';
        else if (sv >= 9940) bgColorStyle = 'background-color: #de59de;';
        else if (sv >= 9500) bgColorStyle = 'background-color: #FF4C4C;';
        else if (sv >= 9070) bgColorStyle = 'background-color: #fda34e;';
        else if (sv >= 6970) bgColorStyle = 'background-color: #ffff33;';
    }

    // 罫線と背景色を統合
    const finalStyle = borderStyle + bgColorStyle;

    // --- 2. クリックイベントの生成 ---
    const escapedName = charName.replace(/'/g, "\\'");
    let clickHandler = "";

    if (showSeedColumns) {
        clickHandler = `onclick="showRollProcessPopup(${seedIndex}, '${id}', ${colIndex})"`;
    } else if (isSimulationMode) {
        clickHandler = `onclick="onGachaCellClick(${seedIndex}, '${id}', '${escapedName}')"`;
    } else {
        const nextSeedValue = seeds[seedIndex + rr.seedsConsumed - 1];
        if (nextSeedValue !== undefined) {
            clickHandler = `onclick="updateSeedAndRefresh(${nextSeedValue})"`;
        }
    }

    // --- 3. セル内コンテンツの構築 ---
    let content = "";
    if (rr.isRerolled) {
        const nextIdx = seedIndex + rr.seedsConsumed;
        let destAddr = (rr.isConsecutiveRerollTarget ? 'R' : '') + formatAddress(nextIdx);
        let oName = (rr.originalChar && rr.originalChar.name) ? rr.originalChar.name : "不明";

        if (typeof isNarrowMode !== 'undefined' && isNarrowMode && oName.length > 10) {
            oName = oName.substring(0, 9) + "...";
        }

        if (showSeedColumns) {
            content = `${oName}<br>${destAddr}${charName}`;
        } else if (!isSimulationMode) {
            const originalJumpSeed = seeds[seedIndex + 1];
            let oHtml = `<span class="char-link" onclick="event.stopPropagation(); updateSeedAndRefresh(${originalJumpSeed})">${oName}</span>`;
            const finalJumpSeed = seeds[seedIndex + rr.seedsConsumed - 1];
            let fHtml = `<span class="char-link" onclick="event.stopPropagation(); updateSeedAndRefresh(${finalJumpSeed})">${destAddr}${charName}</span>`;
            content = `${oHtml}<br>${fHtml}`;
        } else {
            content = `${oName}<br>${destAddr}${charName}`;
        }
    } else {
        content = charName;
    }
    
    return `<td class="gacha-cell gacha-column" style="${finalStyle} cursor:pointer;" ${clickHandler}>${content}</td>`;
}