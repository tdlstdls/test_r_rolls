injectStyles(`
    #rolls-table-container table {
        border-collapse: separate;
        border-spacing: 0;
        width: auto;
        table-layout: auto;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
    }

    #rolls-table-container table th,
    #rolls-table-container table td {
        border-right: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        padding: 6px;
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: 13px;
    }

    #rolls-table-container table th { background-color: #f8f9fa; font-weight: bold; border-top: 1px solid #ddd; }

    #rolls-table-container table .gacha-column, 
    #rolls-table-container table .gacha-cell,
    #rolls-table-container table .calc-column {
        width: 170px;
        min-width: 170px;
        max-width: 170px;
        white-space: normal;
        word-break: break-all;
        line-height: 1.2;
    }
`);

/** @file table_builder.js */

function buildTableDOM(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, findAreaHtml, masterInfoHtml, txtRouteHtml = '', simNoticeHtml = '') {
    const totalTrackSpan = calculateTotalTrackSpan();
    const fullTableColSpan = 2 + (totalTrackSpan * 2) + 1;
    const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;

    const { tableFinalStyle, noWidth, unitWidth } = getTableLayoutSettings(totalTrackSpan);
    const sizingRowHtml = generateSizingRowHTML(totalTrackSpan, noWidth, unitWidth);
    const simControlsHtml = generateSimControlsUI();

    let html = `<div class="table-horizontal-wrapper" style="display: block; width: 100%;">`;
    html += `<table class="${isNarrowMode ? 'narrow-mode' : ''}" style="${tableFinalStyle}"><thead>`;
    html += sizingRowHtml + generateStickyHeaderRowHTML(calcColClass);
    html += generateOperationPanelRowHTML(fullTableColSpan, simControlsHtml, findAreaHtml, masterInfoHtml, txtRouteHtml, simNoticeHtml);
    html += generateSubHeaderRowsHTML(totalTrackSpan, calcColClass) + `</thead><tbody>`;
    html += generateTableBodyHTML(numRolls, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap);
    html += generateTableFooterHTML(fullTableColSpan) + `</tbody></table>`;
    html += `<div class="table-spacer" style="flex-grow: 1; background: transparent;"></div></div>`;
    
    return html;
}