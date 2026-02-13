/** @file table_layout_logic.js */

/**
 * Z座標（z-index）、背景色、および罫線の動的制御
 * ロゴ（R_Rolls）の見切れ防止と、A/Bトラック両方の「NO.」列固定を両立
 */
injectStyles(`
    /* 1. 全てのセルに対して position を明示し z-index を有効化 */
    #rolls-table-container table th,
    #rolls-table-container table td {
        position: relative;
        background-clip: padding-box;
    }

    /* === 2. [通常表示 / データ行] の Z座標および背景設定 === */

    /* 一般セル（80） */
    #rolls-table-container .gacha-cell,
    #rolls-table-container .gacha-column,
    #rolls-table-container .track-header,
    #rolls-table-container .operation-panel-row th,
    #rolls-table-container .control-row th {
        z-index: 80 !important;
    }

    /* Aトラック：左端固定列 (90) */
    #rolls-table-container table th.col-no,
    #rolls-table-container table td.col-no,
    #rolls-table-container .calc-column {
        position: sticky !important;
        left: 0;
        z-index: 90 !important;
        background-color: #f8f9fa !important;
        box-shadow: 1px 0 0 #ddd;
    }

    /* Bトラック全体：背景を薄い水色に統一 */
    #rolls-table-container .track-b {
        background-color: #eef9ff !important;
    }

    /* Bトラック：左端固定列 (100) */
    #rolls-table-container table th.col-no.track-b,
    #rolls-table-container table td.col-no.track-b,
    #rolls-table-container .track-b.calc-column {
        z-index: 100 !important;
        background-color: #eef9ff !important;
    }

    /* Bトラックの「B」と書かれたヘッダーセルの背景色 */
    #rolls-table-container .track-header.track-b {
        background-color: #eef9ff !important;
    }

    /* === 3. [最上部固定行（sticky-row）] の動的表示制御 === */

    /* 【A: 下にスクロールしていない時】表示を消去 */
    #rolls-table-container table:not(.header-is-stuck) .sticky-row th {
        z-index: 10 !important; 
        background-color: transparent !important;
        border-color: transparent !important;
        color: transparent !important;
        box-shadow: none !important;
        pointer-events: none;
    }

    /* Bトラックの背景色も、非スクロール時は透明にする */
    #rolls-table-container table:not(.header-is-stuck) .sticky-row th.track-b {
        background-color: transparent !important;
    }

    /* 【B: 縦スクロールあり（タイトル行流出後）】最前面表示 */
    #rolls-table-container table.header-is-stuck .sticky-row th {
        position: sticky !important;
        top: 0;
        z-index: 110 !important;
        background-color: #f8f9fa !important;
        border-bottom: 2px solid #ccc !important;
        color: #495057 !important;
        pointer-events: auto;
    }

    /* 固定時の Bトラック配色 */
    #rolls-table-container table.header-is-stuck .sticky-row .track-b,
    #rolls-table-container table.header-is-stuck .sticky-row th[style*="#eef9ff"] {
        background-color: #eef9ff !important;
    }

    /* 固定時の NO.セル：ロゴ（R_Rolls）を見えるようにしつつ横固定 */
    #rolls-table-container table.header-is-stuck .sticky-row th.col-no {
        z-index: 120 !important;
        left: 0 !important;
        overflow: visible !important; 
        white-space: nowrap;
    }
    #rolls-table-container table.header-is-stuck .sticky-row th.track-b.col-no {
        z-index: 130 !important;
        left: 0 !important;
    }

    /* === 4. 共通レイアウト基本設定 === */
    #rolls-table-container tbody .col-no {
        width: 30px;
        min-width: 30px;
        max-width: 30px;
        text-align: center;
        overflow: hidden;
    }

    #rolls-table-container .narrow-mode {
        table-layout: fixed;
        font-size: 11px;
    }
    #rolls-table-container .narrow-mode .gacha-column,
    #rolls-table-container .narrow-mode .gacha-cell {
        width: 80px;
        min-width: 80px;
        max-width: 80px;
    }

    #rolls-table-container .table-filler {
        width: auto;
        border: none;
        background: transparent !important;
        z-index: 1 !important;
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

/**
 * スクロール状況を監視し、ヘッダー固定用のクラスを管理する
 */
function setupStickyHeaderObserver() {
    const container = document.getElementById('rolls-table-container');
    const table = container ? container.querySelector('table') : null;
    if (!table) return;

    const target = table.querySelector('.original-title-row');
    if (!target) return;

    const updateStickyState = () => {
        const rect = target.getBoundingClientRect();
        if (rect.top <= 0) {
            if (!table.classList.contains('header-is-stuck')) {
                table.classList.add('header-is-stuck');
            }
        } else {
            if (table.classList.contains('header-is-stuck')) {
                table.classList.remove('header-is-stuck');
            }
        }
    };

    window.addEventListener('scroll', updateStickyState, { passive: true });
    
    if (window._stickySafetyTimer) clearInterval(window._stickySafetyTimer);
    window._stickySafetyTimer = setInterval(updateStickyState, 500);

    updateStickyState();
}