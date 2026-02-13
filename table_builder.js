/** @file table_builder.js @description テーブル構築およびスタイル定義（最上部境界線および列固定の調整版） */

injectStyles(`
    #rolls-table-container table {
        border-collapse: separate;
        border-spacing: 0;
        width: auto;
        table-layout: auto;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
    }

    /**
     * 条件分岐: フィラー（.table-filler）以外のセルにのみ基本スタイルと罫線を適用
     */
    #rolls-table-container table th:not(.table-filler),
    #rolls-table-container table td:not(.table-filler) {
        border-right: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        padding: 6px;
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: 13px;
    }

    #rolls-table-container table th:not(.table-filler) { 
        background-color: #f8f9fa; 
        font-weight: bold; 
    }

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

    /**
     * NO列の横方向固定 (Sticky Column)
     */
    /* Aトラック・Bトラック共通のNO列スタイル */
    #rolls-table-container table .col-no {
        position: sticky;
        left: 0;
        z-index: 20; /* 通常のボディセルより前面 */
        background-clip: padding-box;
    }

    /* AトラックのNO列の背景色 */
    #rolls-table-container table th.col-no:not(.track-b),
    #rolls-table-container table td.col-no:not(.track-b) {
        background-color: #f8f9fa !important;
    }

    /* BトラックのNO列の背景色 */
    #rolls-table-container table th.col-no.track-b,
    #rolls-table-container table td.col-no.track-b {
        background-color: #eef9ff !important;
    }

    /* ヘッダー内かつNO列のセル: 縦固定(110)よりもさらに前面にする */
    #rolls-table-container table thead th.col-no {
        z-index: 130;
    }

    /* スクロール時に境界線が消えないための調整 */
    #rolls-table-container table .col-no {
        border-right: 1px solid #ddd !important;
    }
`);

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