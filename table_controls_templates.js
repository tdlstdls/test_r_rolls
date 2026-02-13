injectStyles(`
    button { cursor: pointer; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 14px; }
    button:hover { background: #0056b3; }
    button.secondary { background: #6c757d; }
    button.secondary:hover { background: #545b62; }
    button.active { background: #28a745; }
    .text-btn { cursor: pointer; color: #007bff; font-weight: bold; font-size: 0.9em; text-decoration: underline; white-space: nowrap; padding: 2px 4px; user-select: none; }
    .text-btn:hover { color: #0056b3; background-color: #f0f8ff; border-radius: 3px; }
    .text-btn.active { color: #28a745; text-decoration: none; border: 1px solid #28a745; border-radius: 3px; padding: 1px 3px; }
    .separator { color: #ccc; font-size: 0.8em; margin: 0 2px; user-select: none; }
    .error { color: red; font-weight: bold; }
`);

/** @file table_controls_templates.js */

function generateSimControlsUI() {
    if (!isSimulationMode) return '';
    const txtActive = (typeof isTxtMode !== 'undefined' && isTxtMode);
    const txtStyle = txtActive ? 'background: #fd7e14; color: #fff;' : 'background: #fff; color: #fd7e14; border: 1px solid #fd7e14;';
    
    return `
    <div id="sim-control-wrapper" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 6px 0; background: transparent; border: none; margin-bottom: 8px; width: 100%; box-sizing: border-box;">
        <button onclick="openSimConfigModal()" style="font-size: 14px; background: #17a2b8;
         color: white; border: none; padding: 1px 10px; border-radius: 3px; cursor: pointer;">テキスト入力</button>
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

function generateOperationPanelRowHTML(fullTableColSpan, simControlsHtml, findAreaHtml, masterInfoHtml, txtRouteHtml, simNoticeHtml) {
    const seedVal = document.getElementById('seed')?.value || '-';
    const findActive = (typeof showFindInfo !== 'undefined' && showFindInfo);
    const colors = { seed: "#6c757d", add: "#28a745", skdAdd: "#17a2b8", idAdd: "#545b62", reset: "#dc3545", width: "#218838", find: "#007bff", sim: "#fd7e14", skd: "#6f42c1", desc: "#20c997" };
    
    // ボタンのスタイル定義
    const btnStyle = "font-size: 14px; padding: 2px 4px; min-width: 70px; height: 24px; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; vertical-align: middle;";
    const getTgl = (active, color) => active ? `${btnStyle} background:${color}; color:#fff; font-weight:bold; border:none;` : `${btnStyle} background:#fff; color:${color}; border:1px solid ${color};`;
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
                    
                    <span id="add-id-trigger" onclick="showIdInput()" style="${getTgl(true, colors.idAdd)} user-select: none;">IDで追加</span>
                    
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