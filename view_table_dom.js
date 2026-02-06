/** @file view_table_dom.js @description テーブルのDOM構造構築（UIデザイン調整・レイアウト変更版） */

// グローバル変数の追加
let isNarrowMode = false;

/**
 * テーブルのレイアウト設定を取得する
 */
function getTableLayoutSettings(totalTrackSpan) {
    const winWidth = window.innerWidth;
    const noWidth = 30; 
    const unitWidth = isNarrowMode ? 80 : 170; 
    
    const oneSideWidth = noWidth + (totalTrackSpan * unitWidth);
    const totalContentWidth = oneSideWidth * 2;
    
    let tableFinalStyle = "";
    if (isNarrowMode) {
        const isNarrowerThanWindow = totalContentWidth < (winWidth - 40);
        tableFinalStyle = `table-layout: fixed; width: ${isNarrowerThanWindow ? '100%' : 'max-content'}; border-spacing: 0;`;
    } else {
        tableFinalStyle = "table-layout: auto; width: 100%; border-spacing: 0;";
    }

    return { tableFinalStyle, noWidth, unitWidth };
}

/**
 * サイジング行（非表示：列幅決定用）のHTMLを生成
 */
function generateSizingRowHTML(totalTrackSpan, noWidth, unitWidth) {
    let html = `<tr style="height: 0; line-height: 0; visibility: hidden; border: none;">`;
    const addSideSizing = () => {
        html += `<th class="col-no" style="width: ${noWidth}px !important; min-width: ${noWidth}px !important; max-width: ${noWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        if (showSeedColumns) {
            html += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        }
        tableGachaIds.forEach(idWithSuffix => {
            const hasG = /[gfs]$/.test(idWithSuffix);
            html += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
            if (hasG) html += `<th class="gacha-column" style="width: ${unitWidth}px !important; min-width: ${unitWidth}px !important; max-width: ${unitWidth}px !important; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        });
    };
    addSideSizing(); 
    addSideSizing(); 
    html += `<th class="table-filler" style="width: auto; height: 0; padding: 0; border: none; margin: 0;"></th></tr>`;
    return html;
}

/**
 * 最上部の名称行（Sticky）のHTMLを生成
 */
function generateStickyHeaderRowHTML(calcColClass) {
    return `
    <tr class="sticky-row" style="color: #495057;">
        <th class="col-no" style="background: #e9ecef; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px;">NO.</th>
        <th class="${calcColClass}" style="background: #e9ecef; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px;">SEED</th>
        ${generateNameHeaderHTML(true)}
        <th class="col-no track-b" style="background: transparent !important; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px;">NO.</th>
        <th class="${calcColClass} track-b" style="background: transparent !important; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px;">SEED</th>
        ${generateNameHeaderHTML(false)}
        <th class="table-filler" style="background: transparent !important; border: none !important; width: auto;"></th>
    </tr>`;
}

/**
 * SimコントロールUIの生成
 */
function generateSimControlsUI() {
    if (!isSimulationMode) return '';
    const txtActive = (typeof isTxtMode !== 'undefined' && isTxtMode);
    const txtStyle = txtActive ? 'background: #fd7e14; color: #fff;' : 'background: #fff; color: #fd7e14; border: 1px solid #fd7e14;';
    
    return `
    <div id="sim-control-wrapper" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 6px 0; background: transparent; border: none; margin-bottom: 8px; width: 100%; box-sizing: border-box;">
        <button onclick="openSimConfigModal()" style="font-size: 14px; background: #17a2b8; color: white; border: none; padding: 1px 10px; border-radius: 3px; cursor: pointer;">テキスト入力</button>
        <button onclick="backSimConfig()" style="font-size: 14px; min-width: 45px; padding: 2.5px 10px; cursor: pointer;">Back</button>
        <button onclick="clearSimConfig()" style="font-size: 14px; padding: 2.5px 10px; cursor: pointer;">Clear</button>
        <span style="border-left: 1px solid #ccc; height: 16px; margin: 0 4px;"></span>
        <label style="font-size: 14px; color: #555;">MaxPlat:</label>
        <input type="number" id="sim-max-plat" value="${(typeof lastMaxPlat !== 'undefined') ? lastMaxPlat : '0'}" min="0" max="5" style="width: 35px; font-size: 14px; padding: 1px 2px; border: 1px solid #ccc; border-radius: 3px;">
        <label style="font-size: 14px; color: #555;">MaxG:</label>
        <input type="number" id="sim-max-guar" value="${(typeof lastMaxGuar !== 'undefined') ? lastMaxGuar : '0'}" min="0" max="5" style="width: 35px; font-size: 14px; padding: 1px 2px; border: 1px solid #ccc; border-radius: 3px;">
        <button id="toggle-txt-btn" onclick="toggleTxtMode()" style="font-size: 14px; padding: 2.5px 10px; border-radius: 4px; cursor: pointer; ${txtStyle}">txt</button>
        <div id="sim-error-msg" style="font-size: 11px; color: #dc3545; margin-left: 10px; font-weight: bold;"></div>
    </div>`;
}

/**
 * 操作パネル行の生成
 */
function generateOperationPanelRowHTML(fullTableColSpan, simControlsHtml, findAreaHtml, masterInfoHtml, txtRouteHtml, simNoticeHtml) {
    const seedVal = document.getElementById('seed')?.value || '-';
    const findActive = (typeof showFindInfo !== 'undefined' && showFindInfo);
    const colors = { seed: "#6c757d", add: "#28a745", skdAdd: "#17a2b8", idAdd: "#545b62", reset: "#dc3545", width: "#218838", find: "#007bff", sim: "#fd7e14", skd: "#6f42c1", desc: "#20c997" };
    const btnStyle = "font-size: 14px; padding: 2px 4px; min-width: 70px; height: 24px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center;";
    const getTgl = (active, color) => active ? `${btnStyle} background:${color}; color:#fff; font-weight:bold;` : `${btnStyle} background:#fff; color:${color}; border:1px solid ${color};`;
    const separator = `<span style="margin: 0 4px; color: #aaa; font-size: 14px;">｜</span>`;

    return `
    <tr class="operation-panel-row" style="background: transparent;">
        <th colspan="${fullTableColSpan}" style="background: transparent; padding: 8px; text-align: left; border: none;">
            <div style="width: 100%; max-width: calc(100vw - 20px); box-sizing: border-box;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-weight: bold; font-size: 14px; color: #333; white-space: nowrap;">SEED: <span id="current-seed-display" onclick="copySeedToClipboard()" style="cursor: pointer; padding: 0 5px;" title="クリックでコピー">${seedVal}</span></span>
                    <button onclick="toggleSeedInput()" style="${getTgl(false, colors.seed)}">SEED値変更</button>
                    
                    <span style="font-size: 14px; color: #555; margin-left: 4px;">列操作：</span>
                    <button onclick="addGachaColumn()" style="${getTgl(true, colors.add)}">＋列を追加</button>
                    <button style="${getTgl(true, colors.skdAdd)}" onclick="addGachasFromSchedule()">skdで追加</button>
                    <button id="add-id-trigger" onclick="showIdInput()" style="${getTgl(true, colors.idAdd)}">IDで追加</button>
                    <button onclick="resetToFirstGacha()" style="${getTgl(true, colors.reset)}">×右列一括</button>
                    <button id="toggle-width-btn" onclick="toggleWidthMode()" style="${getTgl(isNarrowMode, colors.width)}">狭幅表示</button>
                    
                    ${separator}
                    <button id="toggle-find-info-btn" onclick="toggleFindInfo()" style="${getTgl(findActive, colors.find)}">Find</button>
                    <button id="mode-toggle-btn" onclick="toggleAppMode()" style="${getTgl(isSimulationMode, colors.sim)}">Sim</button>
                    
                    ${separator}
                    <button id="toggle-schedule-btn" onclick="toggleSchedule()" style="${getTgl(isScheduleMode, colors.skd)}">skd</button>
                    <button id="toggle-description" onclick="toggleDescription()" style="${getTgl(isDescriptionMode, colors.desc)}">概要</button>
                </div>
                <div id="result" style="width: 100%; font-size: 11px; max-height: 400px; overflow-y: auto; word-break: break-all; white-space: normal; line-height: 1.4; background: transparent;">
                    ${simControlsHtml} ${txtRouteHtml} ${simNoticeHtml} ${findAreaHtml || ''} ${masterInfoHtml}
                </div>
            </div>
        </th>
    </tr>`;
}

/**
 * A/Bトラックヘッダー、名称行、操作ボタン行
 */
function generateSubHeaderRowsHTML(totalTrackSpan, calcColClass) {
    const trackH = `<tr><th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd;"></th><th class="track-header" colspan="${totalTrackSpan}" style="text-align:center; background:#f8f9fa; font-weight:bold; border-right: 1px solid #ddd;">A</th><th class="col-no" style="background:#eef9ff !important; border-left: 1px solid #ddd; border-right: 1px solid #ddd;"></th><th class="track-header" colspan="${totalTrackSpan}" style="text-align:center; background:#eef9ff; font-weight:bold; border-right: 1px solid #ddd;">B</th><th class="table-filler"></th></tr>`;
    
    const titleH = `<tr class="original-title-row">
        <th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd; border-bottom:2px solid #ccc;">NO.</th>
        <th class="${calcColClass}" style="border-right: 1px solid #ddd; border-bottom:2px solid #ccc;">SEED</th>
        ${generateNameHeaderHTML(true, '#f8f9fa', false)}
        <th class="col-no" style="border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom:2px solid #ccc; background:#eef9ff !important;">NO.</th>
        <th class="${calcColClass}" style="background:#eef9ff !important; border-right: 1px solid #ddd; border-bottom:2px solid #ccc;">SEED</th>
        ${generateNameHeaderHTML(false, '#eef9ff', false)}
        <th class="table-filler" style="border: none;"></th>
    </tr>`;
    
    const ctrlH = `<tr class="control-row">
        <th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd;"></th>
        <th class="${calcColClass}" style="border-right: 1px solid #ddd;"></th>
        ${generateControlHeaderHTML(true)}
        <th class="col-no" style="background:#eef9ff !important; border-left: 1px solid #ddd; border-right: 1px solid #ddd;"></th>
        <th class="${calcColClass}" style="background:#eef9ff !important; border-right: 1px solid #ddd;"></th>
        ${generateControlHeaderHTML(false)}
        <th class="table-filler" style="border: none;"></th>
    </tr>`;
    
    return trackH + titleH + ctrlH;
}

/**
 * テーブルのメインボディ部分
 */
function generateTableBodyHTML(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap) {
    let html = '';
    for (let i = 0; i < numRolls; i++) {
        html += `<tr>${renderTableRowSide(i, i * 2, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, true)}`;
        html += `${renderTableRowSide(i, i * 2 + 1, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, false)}`;
        html += `<td class="table-filler" style="border:none !important; background:transparent !important;"></td></tr>`;
    }
    return html;
}

/**
 * テーブルのフッター部分
 */
function generateTableFooterHTML(fullTableColSpan) {
    const btnHtml = `<button onclick="addMoreRolls()">+100行</button> <button id="toggle-seed-btn" class="secondary" onclick="toggleSeedColumns()">${showSeedColumns ? 'SEED非表示' : 'SEED表示'}</button>`;
    const explHtml = `<div id="seed-calc-explanation" class="${showSeedColumns ? '' : 'hidden'}" style="text-align: left; margin-top: 20px;">${typeof generateSeedExplanationHtml === 'function' ? generateSeedExplanationHtml() : ''}</div>`;
    return `<tr><td colspan="${fullTableColSpan}" style="padding: 10px; text-align: center; border-top: 1px solid #ddd;">${btnHtml}${explHtml}</td></tr>`;
}

/**
 * テーブルDOM構築のメインオーケストレータ
 */
function buildTableDOM(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, findAreaHtml, masterInfoHtml, txtRouteHtml = '', simNoticeHtml = '') {
    const totalTrackSpan = calculateTotalTrackSpan();
    const fullTableColSpan = 2 + (totalTrackSpan * 2) + 1;
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;

    const { tableFinalStyle, noWidth, unitWidth } = getTableLayoutSettings(totalTrackSpan);
    const sizingRowHtml = generateSizingRowHTML(totalTrackSpan, noWidth, unitWidth);
    const simControlsHtml = generateSimControlsUI();

    let html = `<div class="table-horizontal-wrapper" style="display: block; width: 100%;">`;
    html += `<table class="${isNarrowMode ? 'narrow-mode' : ''}" style="${tableFinalStyle}"><thead>`;
    html += sizingRowHtml + generateStickyHeaderRowHTML(calcColClass);
    html += generateOperationPanelRowHTML(fullTableColSpan, simControlsHtml, findAreaHtml, masterInfoHtml, txtRouteHtml, simNoticeHtml);
    html += generateSubHeaderRowsHTML(totalTrackSpan, calcColClass) + `</thead><tbody>`;
    html += generateTableBodyHTML(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap);
    html += generateTableFooterHTML(fullTableColSpan) + `</tbody></table>`;
    html += `<div class="table-spacer" style="flex-grow: 1; background: transparent;"></div></div>`;
    
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
    isNarrowMode = !isNarrowMode;
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
}

/**
 * スクロール監視
 */
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        document.body.classList.add('hide-sticky-logo');
    } else {
        document.body.classList.remove('hide-sticky-logo');
    }
}, { passive: true });