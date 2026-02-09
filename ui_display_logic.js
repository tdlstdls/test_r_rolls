injectStyles(`
    .sticky-row {
        position: relative;
    }
    .sticky-row th {
        position: -webkit-sticky;
        position: sticky;
        top: 0; 
        z-index: 5; 
        background-color: #f8f9fa;
        transition: opacity 0.3s, background-color 0.3s;
    }
    .sticky-row:not(.is-sticky) th,
    .sticky-row:not(.is-sticky) td {
        background: transparent;
        background-color: transparent;
        box-shadow: none;
        border-color: transparent;
        color: transparent;
    }
    .sticky-row:not(.is-sticky) th > * {
        visibility: hidden;
    }
    .sticky-row:not(.is-sticky) th.col-no:not(.track-b) {
        position: relative; 
        overflow: visible;
        z-index: 5; 
    }
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
        z-index: 5;
        pointer-events: none;
    }
    body.hide-sticky-logo .sticky-row:not(.is-sticky) th.col-no:not(.track-b)::after {
        opacity: 0;
        transition: opacity 0.2s ease-out;
    }
    .operation-panel-row th,
    .track-header-row th,
    .original-title-row th,
    .control-row th {
        position: relative; 
        z-index: 25;
        background-color: inherit;
    }
    .operation-panel-row th.col-no,
    .track-header-row th.col-no,
    .original-title-row th.col-no,
    .control-row th.col-no {
        z-index: 30;
        position: sticky;
        left: 0;
    }
    .operation-panel-row th,
    .original-title-row th {
        background-color: transparent;
        border: none;
        box-shadow: none;
    }
    .original-title-row th.track-b {
        background-color: transparent;
    }
    .operation-panel-row th {
        position: relative;
        z-index: 20;
        background-color: transparent;
        border: none;
    }
    .operation-panel-row th,
    th.track-header,
    .original-title-row th,
    .control-row th {
        position: relative;
        z-index: 20;
    }
    .sticky-row:not(.is-sticky) th.col-no.track-b::after {
        display: none;
    }
    .sticky-row.is-sticky th.col-no {
        overflow: hidden;
        z-index: 310;
        left: 0;
    }
    .sticky-row.is-sticky th.col-no::after {
        display: none;
    }
    .sticky-row.is-sticky th {
        z-index: 300;
        opacity: 1;
        color: #333;
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
        border-bottom: 2px solid #ccc;
    }
    .sticky-row.is-sticky th.track-b {
        background-color: #eef9ff;
        border-left: 1px solid #ddd;
    }
    .sticky-row.is-sticky th > * {
        visibility: visible;
    }
`);

/** @file ui_display_logic.js @description 表示要素（SEED列/マスター情報/Find）のトグル管理 */

// マスター情報の表示フラグ（初期値は非表示）
let isMasterInfoVisible = false;

/**
 * SEED詳細列（左側の計算用数値列）の表示/非表示を切り替える
 */
function toggleSeedColumns() {
    showSeedColumns = !showSeedColumns;
    if (typeof generateRollsTable === 'function') {
        generateRollsTable(); // ここで自動的に監視も再設定されるようになります
    }
    updateToggleButtons();
}

/**
 * SEED列切り替えボタンのテキストを現在の状態に合わせて更新する
 */
function updateToggleButtons() {
    const btnSeed = document.getElementById('toggle-seed-btn');
    if (btnSeed) {
        btnSeed.textContent = showSeedColumns ? 'SEED非表示' : 'SEED表示';
    }
}

/**
 * ガチャのマスター情報（キャラ一覧リスト）の表示/非表示を切り替える
 */
function toggleMasterInfo() {
    isMasterInfoVisible = !isMasterInfoVisible;

    // マスター表示ボタンの見た目（activeクラス）を更新
    const btn = document.getElementById('toggle-master-info-btn');
    if (btn) {
        if (isMasterInfoVisible) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // 【削除】content.style.display = ... の処理は不要になったため削除します
    // テーブルの再生成時に view_table.js 側のロジックで判定されるためです

    // テーブル全体を再生成して表示状態を反映
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
        setupStickyHeaderObserver(); // 再生成後に監視を再設定
    }
    if (typeof updateMasterInfoView === 'function') {
        updateMasterInfoView();
    }
}

/**
 * Find（高速予報・ターゲット検索）エリアの表示/非表示を切り替える
 */
function toggleFindInfo() {
    showFindInfo = !showFindInfo;
    
    const btn = document.getElementById('toggle-find-info-btn');
    
    // テーブル全体を再生成してFindエリアの有無を反映
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
        setupStickyHeaderObserver(); // 再生成後に監視を再設定
    }
    
    // Findボタンの活性化状態を更新
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
    if (!table || !stickyRow) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // entry.boundingClientRect.top が 0.5px 程度ずれることがあるため
            // 余裕を持たせた判定に変更
            const isOffScreen = entry.boundingClientRect.top < -0.5;
            
            if (!entry.isIntersecting && isOffScreen) {
                stickyRow.classList.add('is-sticky');
            } else {
                stickyRow.classList.remove('is-sticky');
            }
        });
    }, {
        threshold: [0, 1], // 完全に隠れた時と少し見えている時の両方を監視
        rootMargin: '0px 0px 0px 0px' // marginを0に戻し、判定を top 基準に一本化
    });

    const target = table.querySelector('thead');
    if (target) {
        observer.observe(target);
    }
}