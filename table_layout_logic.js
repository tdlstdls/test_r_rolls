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