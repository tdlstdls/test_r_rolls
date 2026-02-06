injectStyles(`
    .col-no {
        position: -webkit-sticky !important;
        position: sticky !important;
        left: 0 !important;
        width: 30px !important;
        min-width: 30px !important;
        max-width: 30px !important;
        z-index: 20 !important; 
        background-color: #f8f9fa;
        text-align: center !important;
        box-shadow: 1px 0 0 #ddd;
        overflow: hidden;
    }
    .narrow-mode {
        table-layout: fixed !important;
        font-size: 11px !important;
    }
    .narrow-mode .gacha-column,
    .narrow-mode .gacha-cell,
    .narrow-mode .calc-column,
    .narrow-mode th.gacha-column,
    .narrow-mode td.gacha-cell {
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
        white-space: normal !important;
        word-break: break-all;
        line-height: 1.2;
        flex: none !important;
    }
    .narrow-mode .col-no,
    .narrow-mode th.col-no,
    .narrow-mode td.col-no {
        width: 30px !important;
        min-width: 30px !important;
        max-width: 30px !important;
        padding: 2px 0 !important;
    }
    .narrow-mode .char-link {
        display: inline-block;
        max-width: 100%;
    }
    .narrow-mode .guaranteed-cell {
        padding: 1px !important;
    }
    .narrow-mode .guaranteed-cell .char-link {
        display: inline !important;
        white-space: normal !important;
    }
    .table-filler,
    th.table-filler,
    td.table-filler {
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
        border: none !important;
        background: transparent !important; 
        background-color: transparent !important;
        box-shadow: none !important;
        outline: none !important;
        pointer-events: none;
    }
`);

/** @file table_layout_logic.js */

/**
 * テーブルのレイアウト設定を取得する
 */
function getTableLayoutSettings(totalTrackSpan) {
    const winWidth = window.innerWidth;
    const noWidth = 30; 
    const unitWidth = isNarrowMode ? 80 : 170; 
    
    const oneSideWidth = noWidth + (totalTrackSpan * unitWidth);
    const totalContentWidth = oneSideWidth * 2;
    
    let tableFinalStyle = "";
    if (isNarrowMode) {
        const isNarrowerThanWindow = totalContentWidth < (winWidth - 40);
        tableFinalStyle = `table-layout: fixed; width: ${isNarrowerThanWindow ? '100%' : 'max-content'}; border-spacing: 0;`;
    } else {
        tableFinalStyle = "table-layout: auto; width: 100%; border-spacing: 0;";
    }

    return { tableFinalStyle, noWidth, unitWidth };
}

/**
 * トラックあたりの総Colspanを計算
 */
function calculateTotalTrackSpan() {
    const calcColSpan = showSeedColumns ? 1 : 0;
    let gachaColSpan = 0;
    tableGachaIds.forEach(idWithSuffix => {
        let id = idWithSuffix.replace(/[gfs]$/, '');
        if (gachaMasterData.gachas[id]) {
            gachaColSpan += /[gfs]$/.test(idWithSuffix) ? 2 : 1;
        }
    });
    return calcColSpan + gachaColSpan;
}