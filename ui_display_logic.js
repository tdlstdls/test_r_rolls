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