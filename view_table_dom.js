/** @file view_table_dom.js @description テーブルのDOM構造構築（操作パネル・ボタン統一版） */

// グローバル変数の追加（他の場所で定義されていれば）
let isNarrowMode = false;

/**
 * テーブルDOM構築のメイン
 */
function buildTableDOM(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, findAreaHtml, masterInfoHtml) {
    const totalTrackSpan = calculateTotalTrackSpan();
    const fullTableColSpan = 2 + totalTrackSpan * 2;
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;

    const currentSeedVal = document.getElementById('seed')?.value || '-';

    // モード判定用
    const findActive = (typeof showFindInfo !== 'undefined' && showFindInfo);
    const simActive = (typeof isSimulationMode !== 'undefined' && isSimulationMode);
    const skdActive = (typeof isScheduleMode !== 'undefined' && isScheduleMode);
    const descActive = (typeof isDescriptionMode !== 'undefined' && isDescriptionMode);

    let html = `<div class="table-horizontal-wrapper" style="display: flex; width: 100%;">`;
    
    const narrowClass = isNarrowMode ? 'narrow-mode' : '';
    html += `<table class="${narrowClass}" style="table-layout: auto; width: auto; max-width: 100%;"><thead>`;

    // ボタンの共通ベーススタイル
    const baseBtnStyle = "font-size: 11px; padding: 2px 4px; min-width: 70px; height: 24px; box-sizing: border-box; text-align: center; cursor: pointer; border-radius: 4px; transition: all 0.2s;";
    
    // トグル状態に応じたスタイルを生成するヘルパー関数
    const getToggleStyle = (isActive, activeColor) => {
        if (isActive) {
            return `${baseBtnStyle} background-color: ${activeColor}; color: #fff; border: 1px solid ${activeColor}; font-weight: bold;`;
        } else {
            return `${baseBtnStyle} background-color: #fff; color: ${activeColor}; border: 1px solid ${activeColor};`;
        }
    };

    // 各機能のテーマカラー
    const colors = {
        seed: "#6c757d",      // グレー（設定系）
        add: "#28a745",       // 緑（追加・ポジティブ）
        skdAdd: "#17a2b8",    // シアン（スケジュール連携）
        idAdd: "#545b62",     // ダークグレー（直接入力）
        reset: "#dc3545",     // 赤（解除・危険）
        width: "#218838",     // 濃い緑（レイアウト）
        find: "#007bff",      // 青（検索・プライマリ）
        sim: "#fd7e14",       // オレンジ（シミュレーション・警告色）
        skd: "#6f42c1",       // 紫（スケジュール・特殊）
        desc: "#20c997"       // ターコイズ（情報・概要）
    };

    const separatorHtml = `<span style="border-left: 1px solid #ccc; height: 16px; margin: 0 5px;"></span>`;

    html += `
        <tr>
            <th colspan="${fullTableColSpan}" style="background: #f8f9fa; padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 8px;">
                    <span style="font-weight: bold; font-size: 12px; color: #333;">SEED:</span>
                    <span id="current-seed-display" onclick="copySeedToClipboard()" style="font-weight: bold; color: #555; font-size: 14px; cursor: pointer; padding: 0 5px;" title="クリックでコピー">${currentSeedVal}</span>
                    <button onclick="toggleSeedInput()" style="${baseBtnStyle} background-color: #fff; color: ${colors.seed}; border: 1px solid ${colors.seed};">SEED値変更</button>
                    
                    ${separatorHtml}
                    
                    <span style="font-weight: bold; font-size: 12px; color: #333;">列操作：</span>
                    <button onclick="addGachaColumn()" style="${baseBtnStyle} background-color: ${colors.add}; color: #fff; border: 1px solid ${colors.add};">＋列を追加</button>
                    <button style="${baseBtnStyle} background-color: ${colors.skdAdd}; color: #fff; border: 1px solid ${colors.skdAdd};" onclick="addGachasFromSchedule()">skdで追加</button>
                    <button id="add-id-trigger" style="${baseBtnStyle} background-color: ${colors.idAdd}; color: #fff; border: 1px solid ${colors.idAdd};" onclick="showIdInput()">IDで追加</button>
                    <button onclick="resetToFirstGacha()" title="解除" style="${baseBtnStyle} background-color: ${colors.reset}; color: #fff; border: 1px solid ${colors.reset};">全て解除×</button>
                    <button id="toggle-width-btn" onclick="toggleWidthMode()" style="${getToggleStyle(isNarrowMode, colors.width)}">幅変更</button>
                    
                    ${separatorHtml}

                    <button id="toggle-find-info-btn" onclick="toggleFindInfo()" style="${getToggleStyle(findActive, colors.find)}">Find</button>
                    <button id="mode-toggle-btn" onclick="toggleAppMode()" style="${getToggleStyle(simActive, colors.sim)}">Sim</button>
                    
                    ${separatorHtml}

                    <button id="toggle-schedule-btn" onclick="toggleSchedule()" style="${getToggleStyle(skdActive, colors.skd)}">skd</button>
                    <button id="toggle-description" onclick="toggleDescription()" style="${getToggleStyle(descActive, colors.desc)}">概要</button>
                </div>
            </th>
        </tr>
        <tr id="find-result-row">
            <th colspan="${fullTableColSpan}" style="background: #fff; text-align: left; font-weight: normal; max-width: 0; padding-top: 8px;">
                <div id="result" class="result-box" style="font-size: 11px;">
                    ${findAreaHtml || '<div style="color:#999;">Findボタンを押すとここにターゲット情報が表示されます。</div>'}
                    
                    ${masterInfoHtml}
                </div>
            </th>
        </tr>`;

    html += `<tr>
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

    for (let i = 0; i < numRolls; i++) {
        const seedIndexA = i * 2, seedIndexB = i * 2 + 1;
        html += `<tr>${renderTableRowSide(i, seedIndexA, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, true)}`;
        html += `${renderTableRowSide(i, seedIndexB, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, false)}</tr>`;
    }

    html += `<tr><td colspan="${fullTableColSpan}" style="padding: 10px; text-align: center;">
        <div style="margin-bottom: 10px;">
            <button onclick="addMoreRolls()">+100行</button>
            <button id="toggle-seed-btn" class="secondary" onclick="toggleSeedColumns()">${showSeedColumns ? 'SEED非表示' : 'SEED表示'}</button>
        </div>
        <div id="seed-calc-explanation" class="${showSeedColumns ? '' : 'hidden'}" style="text-align: left; margin-top: 20px;">
            ${typeof generateSeedExplanationHtml === 'function' ? generateSeedExplanationHtml() : ''}
        </div>
    </td></tr></tbody></table>`;
    
    // 4. 右側の余白を吸収するスペーサーを追加
    html += `<div class="table-spacer" style="flex-grow: 1; background: transparent;"></div>`;
    html += `</div>`; // .table-horizontal-wrapper の終了
    
    return html;
}

/**
 * ガチャID入力フォームの表示
 * ボタンがクリックされたら、ボタンの中身を input 要素に書き換えます
 */
function showIdInput() {
    const trigger = document.getElementById('add-id-trigger');
    if (!trigger) return;

    // ボタンのクリックイベントを一時的に解除し、中身を書き換え
    trigger.onclick = null;
    trigger.innerHTML = `<input type="text" id="direct-id-input" placeholder="ID" style="width:50px; font-size:10px; border:none; outline:none; padding:0; margin:0; background:transparent; color:white; text-align:center;" onkeydown="if(event.key==='Enter') applyDirectId()">`;
    
    const input = document.getElementById('direct-id-input');
    input.focus();

    // フォーカスが外れたら元のボタン表示に戻す
    input.onblur = () => { 
        setTimeout(() => { 
            trigger.innerText = 'IDで追加';
            trigger.onclick = showIdInput; 
        }, 200); 
    };
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



