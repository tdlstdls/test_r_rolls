injectStyles(`
    table {
        border-collapse: separate !important;
        border-spacing: 0;
        width: auto;
        table-layout: auto;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
    }

    th, td {
        border-right: 1px solid #ddd !important;
        border-bottom: 1px solid #ddd !important;
        padding: 6px;
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: 13px;
    }

    th { background-color: #f8f9fa; font-weight: bold; border-top: 1px solid #ddd; }

    .gacha-column, 
    .gacha-cell,
    .calc-column {
        width: 170px !important;
        min-width: 170px !important;
        max-width: 170px !important;
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