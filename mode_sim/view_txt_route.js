/** @file view_txt_route.js @description 計算ロジック解説テキスト・詳細計算過程ダンプ・コンパクト表示（フォントサイズ拡大版） */

// 計算過程表示モードの状態保持
let isDetailedLogMode = false;

/**
 * 現在のシミュレーションルートを生成して返す（14px拡大表示形式）
 * @param {Array} seeds - 乱数シード配列
 * @param {number} initialSeed - 開始前シード値
 * @param {Object} highlightMap - 通常枠のハイライト用
 * @param {Object} guarHighlightMap - 確定枠のハイライト用
 * @param {Object} logicPathMap - 経路整合性チェック用
 * @returns {string} 生成されたHTML文字列
 */
function generateTxtRouteView(seeds, initialSeed, highlightMap, guarHighlightMap, logicPathMap) {
    const configInput = document.getElementById('sim-config');
    const configValue = configInput ? configInput.value.trim() : "";

    if (!configValue) {
        return `
            <div id="txt-route-container" class="description-box" style="margin-top:10px; padding:10px; background:#f9f9f9; border:1px solid #ddd;">
                <div id="txt-route-display" style="color:#999; font-size:14px;">ルートが入力されていません。</div>
            </div>
        `;
    }

    const segments = parseSimConfig(configValue);
    let currentIdx = 0;
    
    let trackStates = {
        lastA: null,
        lastB: null,
        lastAction: null
    };

    let segmentHtmlBlocks = [];

    // --- 計算方法の文章説明 ---
    let calculationGuideHtml = "";
    if (isDetailedLogMode) {
        calculationGuideHtml = `
            <div style="background: #fffbe6; border: 1px solid #ffe58f; padding: 12px; margin-bottom: 15px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #856404;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; border-bottom: 1px solid #ffe58f; padding-bottom: 3px;">📖 ガチャ抽選ロジックの解説</div>
                <ul style="margin: 0; padding-left: 18px;">
                    <li>レア度判定: SEED % 10000</li>
                    <li>キャラ判定: レア度決定後の Index + 1 のSEEDを使用</li>
                    <li>レア被り再抽選: 直前と同じキャラの場合、Index + 2 を使用しトラック移動</li>
                </ul>
            </div>
        `;
    }

    segments.forEach((seg, sIdx) => {
        const config = gachaMasterData.gachas[seg.id];
        if (!config) return;

        const segmentStartAddr = formatTxtAddress(currentIdx);
        let rollsToPerform = seg.rolls;
        let isGuaranteed = false;

        if (seg.g) {
            if (seg.rolls === 15) { rollsToPerform = 14; isGuaranteed = true; }
            else if (seg.rolls === 7) { rollsToPerform = 6; isGuaranteed = true; }
            else if (seg.rolls === 11) { rollsToPerform = 10; isGuaranteed = true; }
            else { rollsToPerform = Math.max(0, seg.rolls - 1); isGuaranteed = true; }
        }

        let charNames = [];
        let detailedLogs = [];
        let lastRollIdx = currentIdx;

        for (let i = 0; i < rollsToPerform; i++) {
            if (currentIdx >= seeds.length) break;
            lastRollIdx = currentIdx;

            const isTrackB = (currentIdx % 2 !== 0);
            const drawAbove = isTrackB ? trackStates.lastB : trackStates.lastA;
            const drawContext = {
                originalIdAbove: drawAbove ? String(drawAbove.charId) : null,
                finalIdSource: trackStates.lastAction ? String(trackStates.lastAction.charId) : null
            };

            const rr = rollWithSeedConsumptionFixed(currentIdx, config, seeds, drawContext, 'sim');
            if (rr.seedsConsumed === 0) break;

            // キャラ名の色決定
            let charName = rr.finalChar ? rr.finalChar.name : "不明";
            let cid = Number(rr.charId);
            let color = "black";

            if (typeof isLimitedCat === 'function' && isLimitedCat(cid)) {
                color = "blue";
            } else if (rr.rarity === 'legend') {
                color = "purple";
            } else if (rr.rarity === 'uber') {
                color = "red";
            } else if (rr.rarity === 'super' || rr.rarity === 'super_rare') {
                color = "orange";
            }

            let displayName = `<span style="color:${color}; font-weight:bold;">${charName}</span>`;
            if (rr.isRerolled) {
                displayName += "（被り）";
            }
            charNames.push(displayName);

            if (isDetailedLogMode) {
                detailedLogs.push(generateDetailedLogHtml(currentIdx, seeds, config, rr, isTrackB));
            }

            const result = { rarity: rr.rarity, charId: rr.charId, trackB: isTrackB };
            if (isTrackB) trackStates.lastB = result; else trackStates.lastA = result;
            trackStates.lastAction = result;
            currentIdx += rr.seedsConsumed;
        }

        let guaranteedAddrStr = "";
        if (isGuaranteed && currentIdx < seeds.length) {
            lastRollIdx = currentIdx;
            const isTrackB = (currentIdx % 2 !== 0);
            const gr = rollGuaranteedUber(currentIdx, config, seeds);
            
            let gCharName = gr.finalChar ? gr.finalChar.name : "不明";
            let gCid = Number(gr.charId);
            let gColor = "red";

            if (typeof isLimitedCat === 'function' && isLimitedCat(gCid)) {
                gColor = "blue";
            }

            charNames.push(`<span style="color:${gColor}; font-weight:bold;">${gCharName}</span>`);
            guaranteedAddrStr = "G";

            if (isDetailedLogMode) {
                detailedLogs.push(generateDetailedLogHtml(currentIdx, seeds, config, gr, isTrackB, true));
            }

            const result = { rarity: 'uber', charId: gr.charId, trackB: isTrackB };
            if (isTrackB) trackStates.lastB = result; else trackStates.lastA = result;
            trackStates.lastAction = result;
            currentIdx += gr.seedsConsumed;
        }

        const segmentEndAddr = formatTxtAddress(lastRollIdx) + guaranteedAddrStr;
        let gachaName = config.name || `ガチャID:${seg.id}`;
        let segTitle = seg.g ? `${seg.rolls}連確定` : `${seg.rolls}回`;

        let blockHtml = `
            <div id="txt-seg-${sIdx}" class="txt-seg-wrapper" style="margin-bottom: 20px;">
                <div style="display: flex; align-items: flex-start; margin-bottom: 6px; border-bottom: 1px dashed #ddd; padding-bottom: 3px;">
                    <input type="checkbox" id="chk-seg-${sIdx}" onclick="toggleTxtSegment(${sIdx})" style="margin-right: 10px; transform: scale(1.1); cursor: pointer;">
                    <label for="chk-seg-${sIdx}" style="color:#17a2b8; font-weight:bold; cursor: pointer; font-size: 14px;">
                        ${sIdx + 1}. 【${gachaName}】 ${segTitle} ${segmentStartAddr}～${segmentEndAddr}
                    </label>
                </div>
                <div class="txt-seg-content" style="padding-left: 28px; font-size: 14px; color: #333;">
                    <div style="word-break: break-all;">=> ${charNames.join('、')}</div>
                    ${isDetailedLogMode ? `<div style="margin-top:10px;">${detailedLogs.join('')}</div>` : ''}
                </div>
            </div>`;
        
        segmentHtmlBlocks.push(blockHtml);
    });

    const finalSeed = (currentIdx < seeds.length) ? seeds[currentIdx] : "---";
    const footerHtml = `
        <div style="margin-top:20px; padding-top:15px; border-top: 1px solid #ccc;">
            <div style="font-weight:bold; font-size:14px;">最終地点: <span style="color:#17a2b8;">${formatTxtAddress(currentIdx)}</span></div>
            <div style="font-weight:bold; font-size:14px;">最終シード: <span style="color:#17a2b8;">${finalSeed}</span></div>
        </div>
    `;

    return `
        <style>
            .txt-seg-wrapper.is-checked { text-decoration: line-through; opacity: 0.3; }
            .detailed-log { font-size: 12px; color: #666; background: #f8f8f8; padding: 8px; margin-bottom: 8px; border-radius: 4px; border-left: 4px solid #ddd; font-family: 'Consolas', monospace; }
        </style>
        <div id="txt-route-container" class="description-box" style="margin-top:10px; padding:15px; background:#fdfdfd; border:1px solid #ddd; border-left: 5px solid #17a2b8;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <span style="font-weight:bold; font-size:14px; color: #17a2b8;">📝シミュレーションルート</span>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center;">
                        <input type="checkbox" ${isDetailedLogMode ? 'checked' : ''} onchange="toggleDetailedLogMode(this.checked)" style="margin-right: 6px;">計算過程を表示
                    </label>
                    <button onclick="copyTxtToClipboard()" style="padding:4px 12px; font-size:12px; background:#17a2b8; color:white; border:none; cursor:pointer; border-radius:4px;">コピー</button>
                </div>
            </div>
            <div id="txt-route-display" style="background:#fff; border:1px solid #eee; font-family: 'Consolas', monospace; font-size:14px; padding:15px; max-height:600px; overflow-y:auto; line-height:1.7;">
                ${calculationGuideHtml}
                <div style="margin-bottom:12px; color:#555; font-weight: bold;">開始前シード: ${initialSeed}</div>
                ${segmentHtmlBlocks.join('')}
                ${footerHtml}
            </div>
        </div>
    `;
}

/**
 * 計算過程のHTMLを生成する
 */
function generateDetailedLogHtml(idx, seeds, config, rr, isTrackB, isGuaranteed = false) {
    const rarityMod = 10000;
    const seedRarity = seeds[idx];
    const addr = formatTxtAddress(idx);
    
    let html = `<div class="detailed-log">`;
    html += `[${addr}] `;
    
    if (isGuaranteed) {
        const pool = config.pool['uber'] || [];
        const count = pool.length || 1;
        const charRem = seedRarity % count;
        html += `【確定】 SEED:${seedRarity} % ${count} = 剰余:${charRem}`;
    } else {
        const rarityRem = seedRarity % rarityMod;
        html += `レア度判定(剰余):${rarityRem}(${rr.rarity}) / `;
        
        if (rr.isRerolled) {
            html += `被り再抽選発生`;
        } else {
            const pool = config.pool[rr.rarity] || [];
            const count = pool.length || 1;
            const seedChar = seeds[idx + 1];
            html += `キャラ判定 SEED:${seedChar} % ${count} = 剰余:${seedChar % count}`;
        }
    }
    html += `</div>`;
    return html;
}

/**
 * 計算過程表示モードを切り替えてテーブルを再描画する
 */
function toggleDetailedLogMode(checked) {
    isDetailedLogMode = checked;
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * セグメントのチェック状態を切り替える
 */
function toggleTxtSegment(index) {
    const wrapper = document.getElementById(`txt-seg-${index}`);
    const checkbox = document.getElementById(`chk-seg-${index}`);
    if (wrapper && checkbox) {
        if (checkbox.checked) wrapper.classList.add('is-checked');
        else wrapper.classList.remove('is-checked');
    }
}

/**
 * 番地フォーマット
 */
function formatTxtAddress(index) {
    if (index === null || index === undefined || index < 0) return "---";
    const row = Math.floor(index / 2) + 1;
    const track = (index % 2 === 0) ? "A" : "B";
    return `${track}${row}`;
}