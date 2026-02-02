/**
 * @file view_table.js
 * @description テーブル描画のメインオーケストレータ。計算・ハイライト・DOM構築を統合
 */

const COLOR_ROUTE_HIGHLIGHT = '#aaddff';
const COLOR_ROUTE_UBER = '#66b2ff';
let currentTableData = null;

function generateRollsTable() {
    try {
        if (Object.keys(gachaMasterData.gachas).length === 0) return;
        const seedEl = document.getElementById('seed');
        if (!seedEl) return;
        
        let initialSeed = parseInt(seedEl.value, 10);
        if (isNaN(initialSeed)) { 
            initialSeed = 12345;
            seedEl.value = "12345"; 
        }
        
        const numRolls = currentRolls;
        const seeds = [];
        const rngForSeeds = new Xorshift32(initialSeed);
        for (let i = 0; i < numRolls * 25 + 500; i++) {
            seeds.push(rngForSeeds.next());
        }

        const columnConfigs = prepareColumnConfigs();
        const tableData = executeTableSimulation(numRolls, columnConfigs, seeds);

        const { highlightMap, guarHighlightMap, logicPathMap, lastSeedValue } = preparePathHighlightMaps(initialSeed, seeds, numRolls);
        finalSeedForUpdate = lastSeedValue;

        // --- パーツごとのHTMLを準備 ---
        
        // 1. Findエリア
        let findAreaHtml = '';
        if (typeof generateFastForecast === 'function') {
            findAreaHtml = generateFastForecast(initialSeed, columnConfigs);
        }

        // 2. マスター情報
        let masterInfoHtml = '';
        if (typeof generateMasterInfoHtml === 'function' && showFindInfo && isMasterInfoVisible) {
            masterInfoHtml = `<div id="master-info-area" style="margin-top: 5px; padding-top: 5px;">${generateMasterInfoHtml()}</div>`;
        }

        // 3. Txt（テキストルートビュー）
        let txtRouteHtml = '';
        if (isTxtMode && isSimulationMode && typeof generateTxtRouteView === 'function') {
            const html = generateTxtRouteView(seeds, initialSeed, highlightMap, guarHighlightMap, logicPathMap);
            if (!html.includes("ルートが入力されていません")) {
                txtRouteHtml = html;
            }
        }

        // 4. 操作ガイド（※表のキャラ名をタップすると...）
        let simNoticeHtml = '';
        if (isSimulationMode) {
            simNoticeHtml = `
                <div id="sim-auto-calc-notice" style="font-size: 0.75em; color: #666; padding: 5px 10px; background: #fff; border-left: 3px solid #007bff; margin: 5px 0;">
                    ※表のキャラ名をタップするとそのセルまでのルートを自動計算します。
                </div>`;
        }

        // --- 最終的なDOM構築 ---
        let finalContainerHtml = '';
        if (typeof buildTableDOM === 'function') {
            // 全てのパーツを buildTableDOM に渡して、適切な位置に配置させる
            finalContainerHtml += buildTableDOM(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, findAreaHtml, masterInfoHtml, txtRouteHtml, simNoticeHtml);
        }

        const container = document.getElementById('rolls-table-container');
        if (container) {
            container.innerHTML = finalContainerHtml;
        }

        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
        }
        
        updateUrlParams();
    } catch (e) {
        const container = document.getElementById('rolls-table-container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; color: #d9534f; background: #f2dede; border: 1px solid #ebccd1; border-radius: 4px;">
                    <h4 style="margin-top:0;">テーブル描画エラー</h4>
                    <p style="font-size: 0.9em;">${e.message}</p>
                </div>`;
        }
        console.error("Critical Table Build Error:", e);
    }
}

/**
 * executeTableSimulation をフックして計算データを保持
 */
(function() {
    const originalExecute = (typeof executeTableSimulation === 'function') ? executeTableSimulation : null;
    if (originalExecute) {
        executeTableSimulation = function(n, c, s) {
            const data = originalExecute(n, c, s);
            currentTableData = data;
            return data;
        };
    }
})();