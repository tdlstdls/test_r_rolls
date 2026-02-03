/** @file view_forecast_core.js @description Find機能のメインエントリーポイント */

function generateFastForecast(initialSeed, columnConfigs) {
    const scanRows = 2000;
    const extendedScanRows = 10000;
    const requiredSeeds = extendedScanRows * 2 + 10;
    const seeds = generateSeedsForForecast(initialSeed, requiredSeeds);
    
    // showFindInfo のチェックは呼び出し側（view_table.js）で行うため、
    // ここでは純粋に中身のHTMLを生成します
    const specialSlots = getSpecialSlotsInfo(seeds, scanRows * 2);
    const specialTargetStatus = getAvailableSpecialTargets(columnConfigs);
    
    // スタイル調整：下部の境界線を繋げるため、margin-bottomを0にし、border-radiusを調整
    let summaryHtml = ``;
    
    // ヘッダー（伝説枠・昇格枠・Target Listのラベル等）
    summaryHtml += generateForecastHeader(specialSlots, specialTargetStatus);

    // FindがONの時だけ各ガチャの出現位置リストを生成
    if (showFindInfo) {
        // --- 1. 「Target List」エリア（詳細表示）を先に生成 ---
        let targetListHtml = '';
        columnConfigs.forEach((config) => {
            if (!config) return;
            // 第5引数に false を渡し、選択済みキャラの詳細（全アドレス）を表示
            targetListHtml += processGachaForecast(config, seeds, scanRows, extendedScanRows, false);
        });

        if (targetListHtml) {
            summaryHtml += `
                <div style="margin-top: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 0.85em; margin-bottom: 5px;">Target List</div>
                    ${targetListHtml}
                </div>`;
        }

        // --- 2. 「選択（next）」エリア（候補リスト）を後に生成 ---
        let nextHtml = '';
        columnConfigs.forEach((config) => {
            if (!config) return;
            // 第5引数に true を渡し、候補キャラをコンパクトに表示
            nextHtml += processGachaForecast(config, seeds, scanRows, extendedScanRows, true);
        });

        if (nextHtml) {
            summaryHtml += `
                <div style="margin-top: 12px; padding: 6px; border: 1px solid #cce5ff; border-radius: 6px; background: #f8fbff;">
                    <div style="font-weight: bold; color: #004085; font-size: 0.85em; margin-bottom: 4px; border-bottom: 1px solid #b8daff;">選択（next）</div>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${nextHtml}
                    </div>
                </div>`;
        }

        if (globalSearchResults) summaryHtml += renderGlobalSearchResults();
    }

    return summaryHtml;
}