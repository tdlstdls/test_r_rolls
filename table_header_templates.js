/** @file table_header_templates.js */

/**
 * テーブルの列幅を固定するためのサイジング用（非表示）行の生成
 * スタイルは最小限にし、構造に集中します。
 */
function generateSizingRowHTML(totalTrackSpan, noWidth, unitWidth) {
    // インラインの border:none や height:0 は構造上必要なため維持します
    let html = `<tr style="height: 0; line-height: 0; visibility: hidden; border: none;">`;
    const addSideSizing = () => {
        // NO列
        html += `<th class="col-no" style="width: ${noWidth}px; min-width: ${noWidth}px; max-width: ${noWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
        // SEED列（表示時のみ）
        if (showSeedColumns) {
            html += `<th class="calc-column" style="width: ${unitWidth}px; min-width: ${unitWidth}px; max-width: ${unitWidth}px; height: 0; padding: 0; border: none; margin: 0;"></th>`;
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
 * 【修正】z-indexや背景色のインライン指定を削除。table_layout_logic.js で制御します。
 */
function generateStickyHeaderRowHTML(calcColClass) {
    return `
    <tr class="sticky-row">
        <th class="col-no">NO.</th>
        <th class="${calcColClass}">SEED</th>
        
        ${generateNameHeaderHTML(true, true)}
        
        <th class="col-no track-b">NO.</th>
        <th class="${calcColClass} track-b">SEED</th>
        
        ${generateNameHeaderHTML(false, true)}
        
        <th class="table-filler"></th>
    </tr>`;
}

/**
 * サブヘッダー行（トラック名、タイトル、操作パネル）の生成
 * 【修正】各セルの z-index や背景色などの装飾スタイルをクラス名による制御に委ねます。
 */
function generateSubHeaderRowsHTML(totalTrackSpan, calcColClass) {
    // 1. トラック名表示行（A / B）
    const trackH = `<tr>
        <th class="col-no"></th>
        <th class="track-header" colspan="${totalTrackSpan}" style="text-align:center; font-weight:bold;">A</th>
        <th class="col-no track-b"></th>
        <th class="track-header track-b" colspan="${totalTrackSpan}" style="text-align:center; font-weight:bold;">B</th>
        <th class="table-filler"></th>
    </tr>`;
    
    // 2. ガチャ名称タイトル行（非スクロール時の通常表示）
    const titleH = `<tr class="original-title-row">
        <th class="col-no">NO.</th>
        <th class="${calcColClass}">SEED</th>
        ${generateNameHeaderHTML(true, false)}
        <th class="col-no track-b">NO.</th>
        <th class="${calcColClass} track-b">SEED</th>
        ${generateNameHeaderHTML(false, false)}
        <th class="table-filler"></th>
    </tr>`;
    
    // 3. 操作用ボタン・セレクトボックス行
    const ctrlH = `<tr class="control-row">
        <th class="col-no"></th>
        <th class="${calcColClass}"></th>
        ${generateControlHeaderHTML(true)}
        <th class="col-no track-b"></th>
        <th class="${calcColClass} track-b"></th>
        ${generateControlHeaderHTML(false)}
        <th class="table-filler"></th>
    </tr>`;
    
    return trackH + titleH + ctrlH;
}