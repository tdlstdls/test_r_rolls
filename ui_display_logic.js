/** @file ui_display_logic.js @description 表示要素（SEED列/マスター情報/Find）のトグル管理およびロゴ制御 */

injectStyles(`
    .sticky-row {
        position: relative;
    }
    
    /* ロゴ（R_Rolls）の表示制御：テーブルが固定されていない（header-is-stuckがない）時のみ表示 */
    #rolls-table-container table:not(.header-is-stuck) .sticky-row th.col-no:not(.track-b)::after {
        content: "R_Rolls";
        position: absolute;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
        white-space: nowrap;
        font-weight: bold;
        font-size: 18px;
        color: #333;
        visibility: visible;
        z-index: 101;
        pointer-events: none;
    }

    /* ロゴ非表示モード（設定用） */
    body.hide-sticky-logo #rolls-table-container table:not(.header-is-stuck) .sticky-row th.col-no:not(.track-b)::after {
        opacity: 0;
        transition: opacity 0.2s ease-out;
    }

    /* 固定表示中（header-is-stuck付与時）はロゴを隠し、本来の「NO.」を表示させる */
    #rolls-table-container table.header-is-stuck .sticky-row th.col-no::after {
        display: none;
    }

    /* z-index 管理：データ行のヘッダーが重ならないように調整 */
    .operation-panel-row th,
    .track-header-row th,
    .original-title-row th,
    .control-row th {
        position: relative; 
        z-index: 25;
    }
    .operation-panel-row th.col-no,
    .track-header-row th.col-no,
    .original-title-row th.col-no,
    .control-row th.col-no {
        z-index: 30;
        position: sticky;
        left: 0;
    }
`);

// マスター情報の表示フラグ
let isMasterInfoVisible = false;

/**
 * SEED詳細列の表示/非表示を切り替える
 */
function toggleSeedColumns() {
    showSeedColumns = !showSeedColumns;
    if (typeof generateRollsTable === 'function') {
        generateRollsTable(); 
    }
    updateToggleButtons();
}

/**
 * SEED列切り替えボタンのテキストを更新
 */
function updateToggleButtons() {
    const btnSeed = document.getElementById('toggle-seed-btn');
    if (btnSeed) {
        btnSeed.textContent = showSeedColumns ? 'SEED非表示' : 'SEED表示';
    }
}

/**
 * ガチャのマスター情報の表示/非表示を切り替える
 */
function toggleMasterInfo() {
    isMasterInfoVisible = !isMasterInfoVisible;
    const btn = document.getElementById('toggle-master-info-btn');
    if (btn) {
        if (isMasterInfoVisible) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
    if (typeof updateMasterInfoView === 'function') {
        updateMasterInfoView();
    }
}

/**
 * Find（ターゲット検索）エリアの表示/非表示を切り替える
 */
function toggleFindInfo() {
    showFindInfo = !showFindInfo;
    const btn = document.getElementById('toggle-find-info-btn');
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
    if (btn) {
        if (showFindInfo) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

/**
 * 注意：setupStickyHeaderObserver() は table_layout_logic.js 側の実装（header-is-stuckを使用）を
 * 優先させるため、このファイルからは削除しました。
 */