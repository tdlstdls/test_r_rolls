/** @file table_content_templates.js */

function generateTableBodyHTML(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap) {
    let html = '';
    for (let i = 0; i < numRolls; i++) {
        html += `<tr>${renderTableRowSide(i, i * 2, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, true)}`;
        html += `${renderTableRowSide(i, i * 2 + 1, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, false)}`;
        html += `<td class="table-filler" style="border:none !important; background:transparent !important;"></td></tr>`;
    }
    return html;
}

function generateTableFooterHTML(fullTableColSpan) {
    const btnHtml = `<button onclick="addMoreRolls()">+100行</button> <button id="toggle-seed-btn" class="secondary" onclick="toggleSeedColumns()">${showSeedColumns ? 'SEED非表示' : 'SEED表示'}</button>`;
    const explHtml = `<div id="seed-calc-explanation" class="${showSeedColumns ? '' : 'hidden'}" style="text-align: left; margin-top: 20px;">${typeof generateSeedExplanationHtml === 'function' ? generateSeedExplanationHtml() : ''}</div>`;
    return `<tr><td colspan="${fullTableColSpan}" style="padding: 10px; text-align: center; border-top: 1px solid #ddd;">${btnHtml}${explHtml}</td></tr>`;
}