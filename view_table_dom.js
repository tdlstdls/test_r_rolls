/** @file view_table_dom.js @description テーブルのDOM構造構築（操作パネル・Txt表示統合版：完全版） */

// グローバル変数の追加
let isNarrowMode = false;

/**
 * テーブルDOM構築のメイン
 * @param {number} numRolls - 表示行数
 * @param {Array} columnConfigs - 列設定
 * @param {Array} tableData - 計算済みデータ
 * @param {Array} seeds - 乱数配列
 * @param {Map} highlightMap - ハイライト
 * @param {Map} guarHighlightMap - 確定枠ハイライト
 * @param {string} findAreaHtml - Find（伝説枠等）のHTML
 * @param {string} masterInfoHtml - キャラリストのHTML
 * @param {string} txtRouteHtml - Txtモードの解析結果HTML（新規追加）
 * @param {string} simNoticeHtml - Simモードの操作ガイドHTML（新規追加）
 */
/**
 * テーブルDOM構築のメイン (修正版: #find-result-rowを削除し、ボタンエリアへ統合)
 */
function buildTableDOM(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, findAreaHtml, masterInfoHtml, txtRouteHtml = '', simNoticeHtml = '') {
    const totalTrackSpan = calculateTotalTrackSpan();
    // NO列(2本) + 各トラック列(A/B) + フィラー(1本) の合計を colspan に設定
    const fullTableColSpan = 2 + (totalTrackSpan * 2) + 1;
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;

    // --- 1. 幅の決定とテーブルスタイルの設定 ---
    const winWidth = window.innerWidth;
    const noWidth = 30; // NO列は常に30px
    // 縮小モードなら80px、通常モードなら170pxを使用
    const unitWidth = isNarrowMode ? 80 : 170; 
    
    const oneSideWidth = noWidth + (totalTrackSpan * unitWidth);
    const totalContentWidth = oneSideWidth * 2;
    
    // テーブル全体のレイアウト設定
    let tableFinalStyle = "";
    if (isNarrowMode) {
        const isNarrowerThanWindow = totalContentWidth < (winWidth - 40);
        tableFinalStyle = `table-layout: fixed; width: ${isNarrowerThanWindow ? '100%' : 'max-content'}; border-spacing: 0;`;
    } else {
        // 通常表示時はブラウザの自動計算(auto)に任せる
        tableFinalStyle = "table-layout: auto; width: auto; border-spacing: 0;";
    }

    // --- 2. サイジング行の生成（1回だけ宣言します） ---
    let sizingRowHtml = `<tr style="height: 0; line-height: 0; visibility: hidden; border: none;">`;
    const addSideSizing = () => {
        // NO.列
        sizingRowHtml += `<th class="col-no" style="width: ${noWidth}px !important; min-width: ${noWidth}px !important; max-width: ${noWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        
        // SEED列・ガチャ列
        if (showSeedColumns) {
            sizingRowHtml += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        }
        tableGachaIds.forEach(idWithSuffix => {
            const hasG = /[gfs]$/.test(idWithSuffix);
            sizingRowHtml += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
            if (hasG) {
                sizingRowHtml += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
            }
        });
    };
    addSideSizing(); // A側
    addSideSizing(); // B側
    
    // フィラー列
    sizingRowHtml += `<th class="table-filler" style="width: auto; height: 0; padding: 0; border: none; margin: 0;"></th>`;
    sizingRowHtml += `</tr>`;

    // --- 3. DOM構築の組み立て ---
    const currentSeedVal = document.getElementById('seed')?.value || '-';

    // 各種モード判定（既存のコードを維持）
    const findActive = (typeof showFindInfo !== 'undefined' && showFindInfo);
    const simActive = (typeof isSimulationMode !== 'undefined' && isSimulationMode);
    const skdActive = (typeof isScheduleMode !== 'undefined' && isScheduleMode);
    const descActive = (typeof isDescriptionMode !== 'undefined' && isDescriptionMode);

    // SimコントロールUIの生成（既存のコードを維持）
    let simControlsHtml = '';
    if (simActive) {
        const txtActive = (typeof isTxtMode !== 'undefined' && isTxtMode);
        const txtActiveStyle = txtActive 
            ? 'background-color: #fd7e14; color: #fff; border: 1px solid #fd7e14; font-weight: bold;' 
            : 'background-color: #fff; color: #fd7e14; border: 1px solid #fd7e14;';

simControlsHtml = `
            <div id="sim-control-wrapper" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 6px; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; width: 100%; box-sizing: border-box;">
                <button onclick="openSimConfigModal()" style="font-size: 11px; background: #17a2b8; color: white; border: none; padding: 3px 10px; border-radius: 3px; cursor: pointer; font-weight: bold;">テキスト入力</button>
                <button onclick="backSimConfig()" style="font-size: 11px; min-width: 45px; padding: 2px 5px;">Back</button>
                <button onclick="clearSimConfig()" style="font-size: 11px; padding: 2px 5px;">Clear</button>
                <span style="border-left: 1px solid #ccc; height: 16px; margin: 0 4px;"></span>
                <label style="font-size: 0.8em; color: #555;">MaxPlat:</label>
                <input type="number" id="sim-max-plat" value="${(typeof lastMaxPlat !== 'undefined') ? lastMaxPlat : '0'}" min="0" max="5" style="width: 35px; font-size: 0.9em; padding: 1px 2px; border: 1px solid #ccc; border-radius: 3px;">
                <label style="font-size: 0.8em; color: #555; margin-left: 2px;">MaxG:</label>
                <input type="number" id="sim-max-guar" value="${(typeof lastMaxGuar !== 'undefined') ? lastMaxGuar : '0'}" min="0" max="5" style="width: 35px; font-size: 0.9em; padding: 1px 2px; border: 1px solid #ccc; border-radius: 3px;">
                <span style="border-left: 1px solid #ccc; height: 16px; margin: 0 4px;"></span>
                <button id="toggle-txt-btn" onclick="toggleTxtMode()" style="font-size: 11px; padding: 2px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s; ${txtActiveStyle}">Txt</button>
                <div id="sim-error-msg" style="font-size: 11px; color: #dc3545; margin-left: 10px; font-weight: bold;"></div>
            </div>`;
    }

let html = `<div class="table-horizontal-wrapper" style="display: block; width: 100%;">`;
    const narrowClass = isNarrowMode ? 'narrow-mode' : '';
    
    html += `<table class="${narrowClass}" style="${tableFinalStyle}"><thead>`;
    
    // 0. サイジング行（非表示：列幅決定用）
    html += sizingRowHtml;

// 1. 最上部のガチャ名称行（クラスを追加し、個別の sticky 指定を削除）
html += `
    <tr class="sticky-row" style="color: #495057;">
        <th class="col-no" style="background: #e9ecef; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 150;">NO.</th>
        <th class="${calcColClass}" style="background: #e9ecef; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 100;">SEED</th>
        ${generateNameHeaderHTML(true, '#e9ecef', true)}
        
        <th class="col-no" style="background: #eef9ff !important; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 100;">NO.</th>
        <th class="${calcColClass}" style="background: #eef9ff !important; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 100;">SEED</th>
        ${generateNameHeaderHTML(false, '#eef9ff', true)}
        
        <th class="table-filler" style="background: transparent !important; border: none !important; width: auto;"></th>
    </tr>`;

    // 2. 操作パネル行（固定しない：SEED変更や各種モード切替ボタン）
    const baseBtnStyle = "font-size: 11px; padding: 2px 4px; min-width: 70px; height: 24px; box-sizing: border-box; text-align: center; cursor: pointer; border-radius: 4px; transition: all 0.2s;";
    const getToggleStyle = (isActive, activeColor) => isActive 
        ? `${baseBtnStyle} background-color: ${activeColor}; color: #fff; border: 1px solid ${activeColor}; font-weight: bold;` 
        : `${baseBtnStyle} background-color: #fff; color: ${activeColor}; border: 1px solid ${activeColor};`;

    const colors = {
        seed: "#6c757d", add: "#28a745", skdAdd: "#17a2b8", idAdd: "#545b62", reset: "#dc3545",
        width: "#218838", find: "#007bff", sim: "#fd7e14", skd: "#6f42c1", desc: "#20c997"
    };
    const separatorHtml = `<span style="border-left: 1px solid #ccc; height: 16px; margin: 0 5px;"></span>`;
    const headerBtnAreaStyle = isNarrowMode ? "font-size: 10px; gap: 4px;" : "font-size: 12px; gap: 8px;";

    html += `
        <tr>
            <th colspan="${fullTableColSpan - 1}" style="background: #f8f9fa; padding: 8px; border-bottom: none; text-align: left;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; ${headerBtnAreaStyle} margin-bottom: 6px;">
                    <span style="font-weight: bold; font-size: 12px; color: #333;">SEED:</span>
                    <span id="current-seed-display" onclick="copySeedToClipboard()" style="font-weight: bold; color: #555; font-size: 14px; cursor: pointer; padding: 0 5px;" title="クリックでコピー">${currentSeedVal}</span>
                    <button onclick="toggleSeedInput()" style="${baseBtnStyle} background-color: #fff; color: ${colors.seed}; border: 1px solid ${colors.seed};">SEED値変更</button>
                    ${separatorHtml}
                    <span style="font-weight: bold; font-size: 12px; color: #333;">列操作：</span>
                    <button onclick="addGachaColumn()" style="${baseBtnStyle} background-color: ${colors.add}; color: #fff; border: 1px solid ${colors.add};">＋列を追加</button>
                    <button style="${baseBtnStyle} background-color: ${colors.skdAdd}; color: #fff; border: 1px solid ${colors.skdAdd};" onclick="addGachasFromSchedule()">skdで追加</button>
                    <button id="add-id-trigger" style="${baseBtnStyle} background-color: ${colors.idAdd}; color: #fff; border: 1px solid ${colors.idAdd};" onclick="showIdInput()">IDで追加</button>
                    <button onclick="resetToFirstGacha()" title="解除" style="${baseBtnStyle} background-color: ${colors.reset}; color: #fff; border: 1px solid ${colors.reset};">全て解除×</button>
                    <button id="toggle-width-btn" onclick="toggleWidthMode()" style="${getToggleStyle(isNarrowMode, colors.width)}">縮小表示</button>
                    ${separatorHtml}
                    <button id="toggle-find-info-btn" onclick="toggleFindInfo()" style="${getToggleStyle(findActive, colors.find)}">Find</button>
                    <button id="mode-toggle-btn" onclick="toggleAppMode()" style="${getToggleStyle(simActive, colors.sim)}">Sim</button>
                    ${separatorHtml}
                    <button id="toggle-schedule-btn" onclick="toggleSchedule()" style="${getToggleStyle(skdActive, colors.skd)}">skd</button>
                    <button id="toggle-description" onclick="toggleDescription()" style="${getToggleStyle(descActive, colors.desc)}">概要</button>
                </div>
                <div id="result" style="font-size: 11px; white-space: normal; word-break: break-all; max-height: 400px; overflow-y: auto;">
                    ${simControlsHtml} ${txtRouteHtml} ${simNoticeHtml} ${findAreaHtml || ''} ${masterInfoHtml}
                </div>
            </th>
            <th class="table-filler" style="background: transparent !important; border: none !important; width: auto;"></th>
        </tr>`;

    // 3. A/Bトラックヘッダー（固定しない）
    html += `
        <tr>
            <th class="col-no" style="background: #f8f9fa; border-right: 1px solid #ddd;"></th>
            <th class="track-header" colspan="${totalTrackSpan}" style="text-align: center; vertical-align: middle; padding: 4px; border-right: 1px solid #ddd !important; font-weight: bold; background-color: #f8f9fa;">A</th>
            <th class="col-no" style="background-color: #eef9ff !important; border-left: 1px solid #ddd !important; border-right: 1px solid #ddd !important;"></th>
            <th class="track-header" colspan="${totalTrackSpan}" style="text-align: center; vertical-align: middle; padding: 4px; font-weight: bold; background-color: #eef9ff; border-right: 1px solid #ddd !important;">B</th>
            <th class="table-filler" style="background: transparent !important; border: none !important;"></th>
        </tr>`;

    // 4. ガチャ名称行（固定しない：操作エリアの下に表示される見出し）
    html += `
        <tr class="original-title-row">
            <th class="col-no" style="background: #f8f9fa !important; border-right: 1px solid #ddd !important; border-bottom: 2px solid #ccc !important;">NO.</th>
            <th class="${calcColClass}" style="border-right: 1px solid #ddd !important; border-bottom: 2px solid #ccc !important;">SEED</th>
            ${generateNameHeaderHTML(true, '#f8f9fa', false)}
            <th class="col-no" style="border-left: 1px solid #ddd !important; border-right: 1px solid #ddd !important; border-bottom: 2px solid #ccc !important; background-color: #eef9ff !important;">NO.</th>
            <th class="${calcColClass}" style="background-color: #eef9ff !important; border-right: 1px solid #ddd !important; border-bottom: 2px solid #ccc !important;">SEED</th>
            ${generateNameHeaderHTML(false, '#eef9ff', false)}
            <th class="table-filler" style="background: transparent; border: none !important;"></th>
        </tr>`;

    // 5. 操作ボタン行（固定しない：x, G, addボタンなど）
    html += `
        <tr class="control-row">
            <th class="col-no" style="background: #f8f9fa !important; border-right: 1px solid #ddd !important; border-bottom: 1px solid #ddd !important;"></th>
            <th class="${calcColClass}" style="border-right: 1px solid #ddd !important; border-bottom: 1px solid #ddd !important;"></th>
            ${generateControlHeaderHTML(true)}
            <th class="col-no" style="border-left: 1px solid #ddd !important; border-right: 1px solid #ddd !important; border-bottom: 1px solid #ddd !important; background-color: #eef9ff !important;"></th>
            <th class="${calcColClass}" style="background-color: #eef9ff !important; border-right: 1px solid #ddd !important; border-bottom: 1px solid #ddd !important;"></th>
            ${generateControlHeaderHTML(false)}
            <th class="table-filler" style="background: transparent; border: none !important;"></th>
        </tr>
    </thead><tbody>`;

    // テーブル本体のデータ行描画
    for (let i = 0; i < numRolls; i++) {
        const seedIndexA = i * 2, seedIndexB = i * 2 + 1;
        html += `<tr>${renderTableRowSide(i, seedIndexA, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, true)}`;
        html += `${renderTableRowSide(i, seedIndexB, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, false)}`;
        // 右側に余白吸収用のセルを追加
        html += `<td class="table-filler" style="border:none !important; background:transparent !important;"></td></tr>`;
    }

    // フッター（行追加ボタン、SEED説明）
    html += `
        <tr><td colspan="${fullTableColSpan}" style="padding: 10px; text-align: center;">
            <div style="margin-bottom: 10px;">
                <button onclick="addMoreRolls()">+100行</button>
                <button id="toggle-seed-btn" class="secondary" onclick="toggleSeedColumns()">${showSeedColumns ? 'SEED非表示' : 'SEED表示'}</button>
            </div>
            <div id="seed-calc-explanation" class="${showSeedColumns ? '' : 'hidden'}" style="text-align: left; margin-top: 20px;">
                ${typeof generateSeedExplanationHtml === 'function' ? generateSeedExplanationHtml() : ''}
            </div>
        </td></tr></tbody></table>
        <div class="table-spacer" style="flex-grow: 1; background: transparent;"></div>
    </div>`;
    
    return html;
}

/**
 * トラックあたりの総Colspanを計算
 */
function calculateTotalTrackSpan() {
    const calcColSpan = showSeedColumns ? 1 : 0;
    let gachaColSpan = 0;
    tableGachaIds.forEach(idWithSuffix => {
        let id = idWithSuffix.replace(/[gfs]$/, '');
        if (gachaMasterData.gachas[id]) {
            gachaColSpan += /[gfs]$/.test(idWithSuffix) ? 2 : 1;
        }
    });
    return calcColSpan + gachaColSpan;
}

/**
 * ガチャID入力フォームの表示
 */
function showIdInput() {
    const trigger = document.getElementById('add-id-trigger');
    if (!trigger) return;

    trigger.onclick = null;
    trigger.innerHTML = `<input type="text" id="direct-id-input" placeholder="ID" style="width:50px; font-size:10px; border:none; outline:none; padding:0; margin:0; background:transparent; color:white; text-align:center;" onkeydown="if(event.key==='Enter') applyDirectId()">`;
    
    const input = document.getElementById('direct-id-input');
    input.focus();

    input.onblur = () => { 
        setTimeout(() => { 
            trigger.innerText = 'IDで追加';
            trigger.onclick = showIdInput; 
        }, 200); 
    };
}

/**
 * 入力されたIDをガチャ列として追加
 */
function applyDirectId() {
    const input = document.getElementById('direct-id-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        const baseId = val.replace(/[gfs]$/, '');
        if (gachaMasterData.gachas[baseId]) {
            tableGachaIds.push(val);
            if (typeof updateUrlParams === 'function') updateUrlParams();
            resetAndGenerateTable();
        } else {
            alert("無効なガチャIDです。");
        }
    }
}

/**
 * 幅変更ボタンのイベントハンドラ
 */
function toggleWidthMode() {
    // グローバル変数 isNarrowMode を反転
    isNarrowMode = !isNarrowMode;
    
    // テーブルの再生成（既存の generateRollsTable を呼び出す）
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
}

