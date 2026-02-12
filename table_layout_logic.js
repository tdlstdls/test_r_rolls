/** @file table_layout_logic.js */

injectStyles(`
    /* * 【重要】NO列（Sticky列）の基本レイアウト設定 
     * 水平スクロール時に一般のキャラ名セルよりも前面に来るよう、ベースの z-index を 100 に設定。
     * これによりデータ行の固定列は Tier 2 (100) となり、
     * ヘッダー行で指定した Tier 1 (110) の下に正しく潜り込みます。
     */
    #rolls-table-container .col-no {
        position: -webkit-sticky;
        position: sticky;
        left: 0;
        width: 30px;
        min-width: 30px;
        max-width: 30px;
        z-index: 100; /* データ行としての優先度を 100 に統一 */
        background-color: #f8f9fa;
        text-align: center;
        /* 右側の境界線がスクロール時に背後のコンテンツと混ざらないよう、box-shadowでクッキリ表示 */
        box-shadow: 1px 0 0 #ddd;
        overflow: hidden;
    }

    /* 狭幅モード（モバイル/圧縮表示）時のレイアウト制御 */
    #rolls-table-container .narrow-mode {
        table-layout: fixed;
        font-size: 11px;
    }
    #rolls-table-container .narrow-mode .gacha-column,
    #rolls-table-container .narrow-mode .gacha-cell,
    #rolls-table-container .narrow-mode .calc-column,
    #rolls-table-container .narrow-mode th.gacha-column,
    #rolls-table-container .narrow-mode td.gacha-cell {
        width: 80px;
        min-width: 80px;
        max-width: 80px;
        white-space: normal;
        word-break: break-all;
        line-height: 1.2;
        flex: none;
    }
    #rolls-table-container .narrow-mode .col-no,
    #rolls-table-container .narrow-mode th.col-no,
    #rolls-table-container .narrow-mode td.col-no {
        width: 30px;
        min-width: 30px;
        max-width: 30px;
        padding: 2px 0;
        z-index: 100; /* モードに関わらず固定列の優先度を維持 */
    }
    #rolls-table-container .narrow-mode .char-link {
        display: inline-block;
        max-width: 100%;
    }
    #rolls-table-container .narrow-mode .guaranteed-cell {
        padding: 1px;
    }
    #rolls-table-container .narrow-mode .guaranteed-cell .char-link {
        display: inline;
        white-space: normal;
    }

    /* フィラー（画面右端を埋める空白）のスタイル設定 */
    #rolls-table-container .table-filler,
    #rolls-table-container th.table-filler,
    #rolls-table-container td.table-filler {
        width: auto;
        min-width: 0;
        max-width: none;
        border: none;
        background: transparent; 
        background-color: transparent;
        box-shadow: none;
        outline: none;
        pointer-events: none;
    }
`);

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
        tableFinalStyle = "table-layout: auto; width: 100%; border-spacing: 0; border-collapse: separate;";
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