/** @file table_header_templates.js */

/**
 * テーブルの列幅を固定するためのサイジング用（非表示）行の生成
 */
function generateSizingRowHTML(totalTrackSpan, noWidth, unitWidth) {
    let html = `<tr style="height: 0; line-height: 0; visibility: hidden; border: none;">`;
    const addSideSizing = () => {
        // NO列
        html += `<th class="col-no" style="width: ${noWidth}px; min-width: ${noWidth}px; max-width: ${noWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        // SEED列（表示時のみ）
        if (showSeedColumns) {
            html += `<th class="gacha-column" style="width: ${unitWidth}px; min-width: ${unitWidth}px; max-width: ${unitWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        }
        // 各ガチャ列
        tableGachaIds.forEach(idWithSuffix => {
            const hasG = /[gfs]$/.test(idWithSuffix);
            html += `<th class="gacha-column" style="width: ${unitWidth}px; min-width: ${unitWidth}px; max-width: ${unitWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
            if (hasG) html += `<th class="gacha-column" style="width: ${unitWidth}px; min-width: ${unitWidth}px; max-width: ${unitWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        });
    };
    addSideSizing(); // Aトラック側
    addSideSizing(); // Bトラック側
    // 右端のフィラー列
    html += `<th class="table-filler" style="width: auto; height: 0; padding: 0; border: none; margin: 0;"></th></tr>`;
    return html;
}

/**
 * 固定ヘッダー（スクロール時に上部に固定される行）の生成
 * * 【修正ポイント】
 * 1. generateNameHeaderHTML() をそのまま呼び出すことで、クリック切り替え機能（透明select）を継承。
 * 2. z-index: 110 を設定し、データ行(z-index: 100)よりも常に前面に来るよう制御。
 * 3. これにより水平・垂直どちらのスクロール時でも、ガチャ名称をクリックして切り替えが可能になります。
 */
function generateStickyHeaderRowHTML(calcColClass) {
    return `
    <tr class="sticky-row" style="color: #495057;">
        <th class="col-no" style="background-color: #f8f9fa; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; overflow: visible; z-index: 110;">NO.</th>
        <th class="${calcColClass}" style="background-color: #f8f9fa; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 110;">SEED</th>
        
        ${generateNameHeaderHTML(true)}
        
        <th class="col-no track-b" style="background-color: #eef9ff; background-clip: padding-box; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 110;">NO.</th>
        <th class="${calcColClass} track-b" style="background-color: #eef9ff; background-clip: padding-box; border-right: 1px solid #ddd; border-bottom: 1px solid #ccc; font-size: 11px; z-index: 110;">SEED</th>
        
        ${generateNameHeaderHTML(false)}
        
        <th class="table-filler" style="background: transparent; border: none; width: auto;"></th>
    </tr>`;
}

/**
 * サブヘッダー行（トラック名、タイトル、操作パネル）の生成
 */
function generateSubHeaderRowsHTML(totalTrackSpan, calcColClass) {
    // 1. トラック名表示行（A / B）
    const trackH = `<tr>
        <th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; z-index: 110;"></th>
        <th class="track-header" colspan="${totalTrackSpan}" style="text-align:center; background:#f8f9fa; font-weight:bold; border-right: 1px solid #ddd; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">A</th>
        <th class="col-no" style="background:#eef9ff; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; z-index: 110;"></th>
        <th class="track-header" colspan="${totalTrackSpan}" style="text-align:center; background:#eef9ff; font-weight:bold; border-right: 1px solid #ddd; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">B</th>
        <th class="table-filler" style="border: none; background: transparent;"></th>
    </tr>`;
    
    // 2. ガチャ名称タイトル行（非スクロール時の通常表示）
    const titleH = `<tr class="original-title-row">
        <th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd; border-bottom:2px solid #ccc; z-index: 110;">NO.</th>
        <th class="${calcColClass}" style="background:#f8f9fa; border-right: 1px solid #ddd; border-bottom:2px solid #ccc; z-index: 110;">SEED</th>
        ${generateNameHeaderHTML(true)}
        <th class="col-no" style="border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom:2px solid #ccc; background:#eef9ff; z-index: 110;">NO.</th>
        <th class="${calcColClass}" style="background:#eef9ff; border-right: 1px solid #ddd; border-bottom:2px solid #ccc; z-index: 110;">SEED</th>
        ${generateNameHeaderHTML(false)}
        <th class="table-filler" style="border: none; background: transparent;"></th>
    </tr>`;
    
    // 3. 操作用ボタン・セレクトボックス行
    const ctrlH = `<tr class="control-row">
        <th class="col-no" style="background:#f8f9fa; border-right: 1px solid #ddd; z-index: 110;"></th>
        <th class="${calcColClass}" style="background:#f8f9fa; border-right: 1px solid #ddd; z-index: 110;"></th>
        ${generateControlHeaderHTML(true)}
        <th class="col-no" style="background:#eef9ff; border-left: 1px solid #ddd; border-right: 1px solid #ddd; z-index: 110;"></th>
        <th class="${calcColClass}" style="background:#eef9ff; border-right: 1px solid #ddd; z-index: 110;"></th>
        ${generateControlHeaderHTML(false)}
        <th class="table-filler" style="border: none; background: transparent;"></th>
    </tr>`;
    
    return trackH + titleH + ctrlH;
}