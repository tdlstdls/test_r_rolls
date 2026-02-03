/** @file view_table_dom.js @description テーブルのDOM構造構築（操作パネル・Txt表示統合版：完全版） */

// グローバル変数の追加（他の場所で定義されていれば）
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
    const fullTableColSpan = 2 + totalTrackSpan * 2;
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;

    const currentSeedVal = document.getElementById('seed')?.value || '-';

    // 各種モード判定
    const findActive = (typeof showFindInfo !== 'undefined' && showFindInfo);
    const simActive = (typeof isSimulationMode !== 'undefined' && isSimulationMode);
    const skdActive = (typeof isScheduleMode !== 'undefined' && isScheduleMode);
    const descActive = (typeof isDescriptionMode !== 'undefined' && isDescriptionMode);

    // SimコントロールUIの生成
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

    let html = `<div class="table-horizontal-wrapper" style="display: block; width: fit-content;">`;
    const narrowClass = isNarrowMode ? 'narrow-mode' : '';
    const tableStyle = isNarrowMode ? "table-layout: fixed; width: auto;" : "table-layout: auto; width: auto;";
    
    html += `<table class="${narrowClass}" style="${tableStyle}"><thead>`;

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

    // ヘッダー1行目（統合版）
    html += `
        <tr>
            <th colspan="${fullTableColSpan}" style="background: #f8f9fa; padding: 8px; border-bottom: none; text-align: left;">
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
                    <button id="toggle-width-btn" onclick="toggleWidthMode()" style="${getToggleStyle(isNarrowMode, colors.width)}">横幅圧縮</button>
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
        </tr>`;

    // 2行目（以前の #find-result-row）は削除されました

    // トラック名(A/B)行以降
    html += `
        <tr>
            <th class="col-no" style="position: sticky; left: 0; z-index: 30; background: #f8f9fa; border-right: 1px solid #ddd;"></th>
            <th class="track-header" colspan="${totalTrackSpan}" style="text-align: center; vertical-align: middle; padding: 4px; border-right: 1px solid #ddd; font-weight: bold;">A</th>
            <th class="col-no"></th>
            <th class="track-header" colspan="${totalTrackSpan}" style="text-align: center; vertical-align: middle; padding: 4px; font-weight: bold;">B</th>
        </tr>
        <tr class="sticky-row">
            <th class="col-no" style="position: sticky; top: 0; left: 0; z-index: 40; background: #f8f9fa; border-right: 1px solid #ddd;">NO.</th>
            <th class="${calcColClass}">SEED</th>
            ${generateNameHeaderHTML()}
            <th class="col-no" style="border-left: 1px solid #ddd;">NO.</th>
            <th class="${calcColClass}">SEED</th>
            ${generateNameHeaderHTML()}
        </tr>
        <tr class="control-row">
            <th class="col-no" style="position: sticky; left: 0; z-index: 30; background: #f8f9fa; border-right: 1px solid #ddd;"></th>
            <th class="${calcColClass}"></th>
            ${generateControlHeaderHTML(true)}
            <th class="col-no" style="border-left: 1px solid #ddd;"></th>
            <th class="${calcColClass}"></th>
            ${generateControlHeaderHTML(false)}
        </tr>
    </thead><tbody>`;

    // テーブル本体のデータ行描画
    for (let i = 0; i < numRolls; i++) {
        const seedIndexA = i * 2, seedIndexB = i * 2 + 1;
        html += `<tr>${renderTableRowSide(i, seedIndexA, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, true)}`;
        html += `${renderTableRowSide(i, seedIndexB, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, false)}</tr>`;
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