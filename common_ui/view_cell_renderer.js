/** @file view_cell_renderer.js @description 個別セルの描画とレアリティ色の制御（Tier 3：背面レイヤー定義版） */

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
 * 【修正】罫線は view_table_renderer.js の共通CSSで制御されるため、インライン指定を削除。
 */
function generateDetailedCalcCells(seedIndex, seeds, tableData) {
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;
    
    // 表示フラグがオフの場合は非表示用のクラスのみ返却
    if (!showSeedColumns) return `<td class="${calcColClass}"></td>`;
    
    // データ範囲外の処理
    if (seedIndex >= seeds.length) return `<td class="${calcColClass}">-</td>`;

    const s0 = seeds[seedIndex];
    // SEED値 [index] の形式で表示
    return `<td class="${calcColClass}">${s0} [${seedIndex}]</td>`;
}

/**
 * 通常のガチャ結果セル（1マス分）を生成する
 * 【修正】Tier 3 セルとして定義。z-index は指定せず、上位レイヤー（固定列/ヘッダー）の下に潜り込むようにします。
 */
function generateCell(seedIndex, id, colIndex, tableData, seeds, highlightMap, isSimulationMode) {
    const rowData = tableData[seedIndex];
    const cell = rowData?.cells?.[colIndex];
    
    // データがない場合の空セル返却
    if (!cell || !cell.roll) return `<td class="gacha-cell">-</td>`;
    
    const rr = cell.roll;
    let charName = (rr.finalChar && rr.finalChar.name) ? rr.finalChar.name : "データ不足";
    const charId = rr.finalChar.id;
    const charIdStr = String(charId);

    // 狭幅モード時の名前省略ロジック
    if (typeof isNarrowMode !== 'undefined' && isNarrowMode && charName.length > 10) {
        charName = charName.substring(0, 9) + "...";
    }

    // --- 1. 背景色の判定ロジック（レアリティとシード値に基づく） ---
    let bgColorStyle = '';
    const sv = seeds[seedIndex] % 10000;

    // ユーザー優先ターゲットの判定
    const isPrioritized = (typeof userPrioritizedTargets !== 'undefined') && 
                          (userPrioritizedTargets.includes(charId) || userPrioritizedTargets.includes(charIdStr));

    // 限定キャラの判定
    let isLimited = false;
    if (typeof limitedCats !== 'undefined' && Array.isArray(limitedCats)) {
        if (limitedCats.includes(parseInt(charId)) || limitedCats.includes(charIdStr)) {
            isLimited = true;
        }
    }

    // 背景色スタイルの構築
    if (isPrioritized) {
        bgColorStyle = 'background-color: #6EFF72; font-weight: bold;'; 
    } 
    else if (isSimulationMode && highlightMap.get(seedIndex) === id) {
        if (isLimited || rr.rarity === 'uber' || rr.rarity === 'legend') {
            bgColorStyle = 'background:#32CD32;'; // シミュレーション中の当たり
        } else {
            bgColorStyle = 'background:#98FB98;'; // 通常ハイライト
        }
    } 
    else if (isLimited) {
        bgColorStyle = 'background-color: #66FFFF;'; // 限定
    } 
    else {
        // レアリティごとの色分け (SEED値に基づく)
        if (sv >= 9970) bgColorStyle = 'background-color: #DDA0DD;';      // 伝説相当
        else if (sv >= 9940) bgColorStyle = 'background-color: #de59de;'; // 超激相当（高確率）
        else if (sv >= 9500) bgColorStyle = 'background-color: #FF4C4C;'; // 超激
        else if (sv >= 9070) bgColorStyle = 'background-color: #fda34e;'; // 激レア
        else if (sv >= 6970) bgColorStyle = 'background-color: #ffff33;'; // レア
    }

    // --- 2. クリックイベント（詳細ポップアップ or シード更新） ---
    const escapedName = charName.replace(/'/g, "\\'");
    let clickHandler = "";

    if (showSeedColumns) {
        // SEED表示中は算出過程のポップアップを表示
        clickHandler = `onclick="showRollProcessPopup(${seedIndex}, '${id}', ${colIndex})"`;
    } else if (isSimulationMode) {
        // シミュレーション中はルート更新イベント
        clickHandler = `onclick="onGachaCellClick(${seedIndex}, '${id}', '${escapedName}')"`;
    } else {
        // 通常モードはクリックでその地点へジャンプ
        const nextSeedValue = seeds[seedIndex + rr.seedsConsumed - 1];
        if (nextSeedValue !== undefined) {
            clickHandler = `onclick="updateSeedAndRefresh(${nextSeedValue})"`;
        }
    }

    // --- 3. セル内コンテンツの構築（再抽選/ルート移行表示の制御） ---
    let content = "";
    if (rr.isRerolled) {
        const nextIdx = seedIndex + rr.seedsConsumed;
        let destAddr = (rr.isConsecutiveRerollTarget ? 'R' : '') + formatAddress(nextIdx);
        let oName = (rr.originalChar && rr.originalChar.name) ? rr.originalChar.name : "不明";

        if (typeof isNarrowMode !== 'undefined' && isNarrowMode && oName.length > 10) {
            oName = oName.substring(0, 9) + "...";
        }

        if (showSeedColumns) {
            // 詳細表示時：元のキャラ名 + 移動先 + 決定キャラ名
            content = `${oName}<br>${destAddr}${charName}`;
        } else if (!isSimulationMode) {
            // 通常時：元の地点と最終地点の両方をリンクとして表示
            const originalJumpSeed = seeds[seedIndex + 1];
            let oHtml = `<span class="char-link" onclick="event.stopPropagation(); updateSeedAndRefresh(${originalJumpSeed})">${oName}</span>`;
            const finalJumpSeed = seeds[seedIndex + rr.seedsConsumed - 1];
            let fHtml = `<span class="char-link" onclick="event.stopPropagation(); updateSeedAndRefresh(${finalJumpSeed})">${destAddr}${charName}</span>`;
            content = `${oHtml}<br>${fHtml}`;
        } else {
            // シミュレーション時
            content = `${oName}<br>${destAddr}${charName}`;
        }
    } else {
        // 通常表示
        content = charName;
    }
    
    return `<td class="gacha-cell gacha-column" style="${bgColorStyle} cursor:pointer;" ${clickHandler}>${content}</td>`;
}