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
        columnConfigs.forEach((config) => {
            if (!config) return;
            const gachaHtml = processGachaForecast(config, seeds, scanRows, extendedScanRows);
            if (gachaHtml) summaryHtml += gachaHtml;
        });

        if (globalSearchResults) summaryHtml += renderGlobalSearchResults();
    }

    return summaryHtml;
}