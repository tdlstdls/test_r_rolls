injectStyles(`
    .sticky-row {
        position: relative;
    }
    .sticky-row th {
        position: -webkit-sticky;
        position: sticky;
        top: 0; 
        z-index: 5; 
        /* 背景色の遷移アニメーションを削除し、再描画時の背景色の残像（チラつき）を防止 */
        transition: opacity 0.3s;
    }
    
    /* ロゴ（R_Rolls）を表示するNOセルの設定：右側へのはみ出しを許可 */
    .sticky-row th.col-no:not(.track-b) {
        position: sticky;
        left: 0;
        overflow: visible; 
        z-index: 100;      
    }

    /* ロゴ（R_Rolls）の定義 */
    .sticky-row:not(.is-sticky) th.col-no:not(.track-b)::after {
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

    body.hide-sticky-logo .sticky-row:not(.is-sticky) th.col-no:not(.track-b)::after {
        opacity: 0;
        transition: opacity 0.2s ease-out;
    }

    /* 固定表示時はロゴを隠す */
    .sticky-row.is-sticky th.col-no::after {
        display: none;
    }

    /* z-index 管理 */
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

/** @file ui_display_logic.js @description 表示要素（SEED列/マスター情報/Find）のトグル管理 */

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
 * 固定ヘッダーの表示・非表示をスクロール位置で切り替える
 */
function setupStickyHeaderObserver() {
    const table = document.querySelector('table');
    const stickyRow = document.querySelector('.sticky-row');
    const target = table?.querySelector('thead');
    if (!table || !stickyRow || !target) return;

    /**
     * 条件分岐によりインラインスタイルを直接書き換えて表示を制御する
     */
    const updateHeaderStyles = (isStickyMode) => {
        if (isStickyMode) {
            stickyRow.classList.add('is-sticky');
        } else {
            stickyRow.classList.remove('is-sticky');
        }

        const ths = stickyRow.querySelectorAll('th');
        ths.forEach(th => {
            // --- フィラー領域（余白埋め）の制御 ---
            if (th.classList.contains('table-filler')) {
                th.style.border = 'none';
                th.style.background = 'transparent';
                th.style.backgroundColor = 'transparent';
                th.style.boxShadow = 'none';
                const children = th.querySelectorAll('*');
                children.forEach(c => { c.style.visibility = isStickyMode ? 'visible' : 'hidden'; });
                return;
            }

            // --- 条件分岐によるスタイル操作 ---
            if (isStickyMode) {
                // 固定表示時：本来の背景色を適用
                const isTrackB = th.classList.contains('track-b');
                th.style.backgroundColor = isTrackB ? '#eef9ff' : '#f8f9fa';
                th.style.color = '#333';
                th.style.borderBottom = '2px solid #ccc';
                th.style.borderRight = '1px solid #ddd';

                if (th.classList.contains('col-no') && isTrackB) {
                    th.style.borderLeft = '1px solid #ddd';
                } else {
                    th.style.borderLeft = ''; 
                }

                th.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                const children = th.querySelectorAll('*');
                children.forEach(c => { c.style.visibility = 'visible'; });
            } else {
                // ロゴ表示モード：背景色や文字、枠線を透明に上書きしてチラつきを防止
                th.style.backgroundColor = 'transparent';
                th.style.color = 'transparent'; 
                th.style.borderBottomColor = 'transparent';
                th.style.borderRightColor = 'transparent';
                th.style.borderLeftColor = 'transparent';
                th.style.boxShadow = 'none';
                
                const children = th.querySelectorAll('*');
                children.forEach(c => { c.style.visibility = 'hidden'; });
            }
        });
    };

    // 初期状態（再描画時）のスクロール位置を即座に判定して適用
    const rect = target.getBoundingClientRect();
    updateHeaderStyles(rect.top < -0.5);

    // 以降の動的なスクロール監視
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isOffScreen = entry.boundingClientRect.top < -0.5;
            const isStickyMode = !entry.isIntersecting && isOffScreen;
            updateHeaderStyles(isStickyMode);
        });
    }, {
        threshold: [0, 1],
        rootMargin: '0px 0px 0px 0px'
    });

    observer.observe(target);
}