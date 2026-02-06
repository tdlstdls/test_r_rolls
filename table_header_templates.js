/** @file table_header_templates.js */

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