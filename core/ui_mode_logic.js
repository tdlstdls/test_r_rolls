/** @file ui_mode_logic.js @description アプリの初期化とモード切替（Sim/skd/概要/Txt）の管理 */

/**
 * アプリ起動時のデフォルトガチャ設定の初期化
 */
function initializeDefaultGachas() {
    if (typeof prepareScheduleInfo === 'function') {
        prepareScheduleInfo();
    }

    if (tableGachaIds.length === 0) {
        let scheduleFound = false;
        if (isScheduleAnalyzed && typeof parseGachaTSV === 'function') {
            try {
                const scheduleData = parseGachaTSV(loadedTsvContent);
                const now = new Date();
                const activeGachas = scheduleData.filter(item => {
                    if (typeof isPlatinumOrLegend === 'function' && isPlatinumOrLegend(item)) return false;
                    const startDt = parseDateTime(item.rawStart, item.startTime);
                    const endDt = parseDateTime(item.rawEnd, item.endTime);
              
                    return now >= startDt && now <= endDt;
                });

                if (activeGachas.length > 0) {
                    activeGachas.forEach(gacha => {
                        // すでに gacha.id に接尾辞が含まれているため、そのまま使用する
                        tableGachaIds.push(gacha.id.toString());
                        uberAdditionCounts.push(0); 
                    });
                    scheduleFound = true;
                }
            } catch (e) {
                console.warn("Auto-select from schedule failed:", e);
            }
        }
        
        if (!scheduleFound || tableGachaIds.length === 0) {
            const options = getGachaSelectorOptions(null);
            if (options.length > 0) {
                tableGachaIds.push(options[0].value);
                uberAdditionCounts.push(0);
                if (options.length > 1) {
                    tableGachaIds.push(options[1].value);
                    uberAdditionCounts.push(0);
                }
            } else {
                const sortedGachas = Object.values(gachaMasterData.gachas)
                    .filter(gacha => gacha.sort < 800)
                    .sort((a, b) => a.sort - b.sort);
                if (sortedGachas.length > 0) {
                    tableGachaIds.push(sortedGachas[0].id);
                    uberAdditionCounts.push(0);
                }
                if (sortedGachas.length > 1) {
                    tableGachaIds.push(sortedGachas[1].id);
                    uberAdditionCounts.push(0);
                }
            }
        }
    }
}

/**
 * モード変更時の共通処理
 */
function onModeChange() {
    refreshModeView();
    updateModeButtonState();
}

/**
 * Sim（シミュレーション）モードの切り替え
 */
function toggleAppMode() {
    isSimulationMode = !isSimulationMode;
    // SimモードがOFFになったらTxtモードも自動的にOFFにする
    if (!isSimulationMode) {
        isTxtMode = false;
    }
    onModeChange();
}

/**
 * Txt（テキストルート表示）モードの切り替え
 */
function toggleTxtMode() {
    // SimモードがONの時のみ動作させる
    if (!isSimulationMode) {
        alert("Txt表示を利用するには、まずSimモードをONにしてください。");
        return;
    }
    isTxtMode = !isTxtMode;
    onModeChange();
}

/**
 * 各モード切替ボタンの見た目（Active状態）と関連ボタンの表示を更新
 */
function updateModeButtonState() {
    // Simボタン
    const btnSim = document.getElementById('mode-toggle-btn');
    if (btnSim) {
        if (isSimulationMode) btnSim.classList.add('active');
        else btnSim.classList.remove('active');
    }
    
    // Txtボタン
    const btnTxt = document.getElementById('toggle-txt-btn');
    
    if (btnTxt) {
        if (isTxtMode && isSimulationMode) {
            btnTxt.classList.add('active');
        } else {
            btnTxt.classList.remove('active');
        }
    }
}

/**
 * モードに応じたコントロールエリアの表示制御とテーブル再描画
 */
function refreshModeView() {
    resetAndGenerateTable();
}

/**
 * シミュレーションルートをクリップボードにコピーする
 * 不適切な要素（操作ガイド等）ではなく、ルート文字列(#sim-config)を正確に取得します
 */
function copyTxtToClipboard() {
    const configInput = document.getElementById('sim-config');
    const routeText = configInput ? configInput.value : "";
    
    if (routeText && routeText.trim() !== "") {
        navigator.clipboard.writeText(routeText).then(() => {
            // 成功時のフィードバックが必要な場合はここで実行
            console.log("Route copied to clipboard: " + routeText);
        }).catch(err => {
            console.error("Failed to copy route: ", err);
        });
    } else {
        alert("コピーするルートがありません。");
    }
}

/**
 * 概要（使い方ガイド）表示の切り替え
 */
function toggleDescription() {
    const content = document.getElementById('description-content');
    const toggle = document.getElementById('toggle-description');
    const tableContainer = document.getElementById('rolls-table-container');
    const resultDiv = document.getElementById('result');
    const mainControls = document.getElementById('main-controls');
    const scheduleContainer = document.getElementById('schedule-container');

    isDescriptionMode = !isDescriptionMode;

    // 他のモードとの排他制御
    if (isDescriptionMode) {
        if (typeof isScheduleMode !== 'undefined' && isScheduleMode && typeof toggleSchedule === 'function') {
            // skdモードが開いていれば閉じる（フラグ操作はtoggleScheduleに任せるか、ここで直接制御）
            isScheduleMode = false;
        }
    }

    if (isDescriptionMode) {
        if (typeof isScheduleMode !== 'undefined' && isScheduleMode && typeof toggleSchedule === 'function') {
            toggleSchedule();
        }
        if (toggle) toggle.classList.add('active');
        if (tableContainer) tableContainer.classList.add('hidden');
        if (resultDiv) resultDiv.classList.add('hidden');
        if (mainControls) mainControls.classList.add('hidden');
        if (scheduleContainer) scheduleContainer.classList.add('hidden');
        if (content) {
            content.classList.remove('hidden');
            content.style.flexGrow = '1';       
            content.style.overflowY = 'auto';   
            content.style.height = '100%';
            content.style.webkitOverflowScrolling = 'touch';
            content.style.minHeight = '0';
            content.style.maxHeight = 'none';
        }
    } else {
        if (toggle) toggle.classList.remove('active');
        if (content) {
            content.classList.add('hidden');
        }
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (mainControls) mainControls.classList.remove('hidden');
        if (showResultDisplay && resultDiv) resultDiv.classList.remove('hidden');
    }

    // 状態を反映させるために共通処理を呼び出す
    onModeChange();
    
}

/**
 * ルート入力用のモーダルを開く
 */
function openSimConfigModal() {
    const configInput = document.getElementById('sim-config');
    const currentConfig = configInput ? configInput.value : "";
    
    const contentHtml = `
        <div style="font-family: sans-serif;">
            <h3 style="margin-top: 0; font-size: 15px; color: #17a2b8;">シミュレーションルート入力</h3>
            <p style="font-size: 11px; color: #666; margin-bottom: 10px;">ルートを入力してください (例: 1006 4 942 11g)</p>
            <textarea id="modal-sim-config-input" 
                style="width: 100%; height: 100px; padding: 8px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;"
                placeholder="1006 4 942 11g"
            >${currentConfig}</textarea>
            <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeModal()" style="padding: 5px 15px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px; font-size: 12px;">キャンセル</button>
                <button onclick="applyModalSimConfig()" style="padding: 5px 15px; border: none; background: #17a2b8; color: #fff; cursor: pointer; border-radius: 4px; font-size: 12px;">反映</button>
            </div>
        </div>
    `;
    showModal(contentHtml); 
}

/**
 * モーダルで入力された値を反映する
 */
function applyModalSimConfig() {
    const inputVal = document.getElementById('modal-sim-config-input').value.trim();
    const configInput = document.getElementById('sim-config');
    
    if (configInput) {
        configInput.value = inputVal;
        if (typeof updateUrlParams === 'function') updateUrlParams();
        resetAndGenerateTable();
    }
    
    closeModal(); 
}