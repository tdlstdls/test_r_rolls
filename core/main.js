/** @file main.js @description アプリ起動時の初期化フロー */

window.onload = async function() {
    injectStyles(`
        html, body {
            height: auto;
            margin: 0;
            overflow: visible;
            -webkit-text-size-adjust: 100%;
        }
        body { 
            font-family: "Helvetica Neue", Arial, sans-serif; 
            padding: 10px 15px; 
            box-sizing: border-box; 
            color: #333; 
            background-color: #fff; 
        }
        .header-row, 
        .description-box, 
        #result, 
        .forecast-summary-container,
        #table-global-controls {
            flex-shrink: 1;
            width: 100%;
            max-width: 100vw;
            box-sizing: border-box;
            word-break: break-word;
            overflow-wrap: break-word;
        }
        .hidden { display: none !important; }
    `);
    console.log("Initializing R_Rolls...");

    // 1. 概要表示の初期化
    if (typeof initDescriptionView === 'function') {
        try { 
            initDescriptionView(); 
        } catch (e) { 
            console.error("Description View Error:", e); 
        }
    }

    // 2. データロード
    try {
        const success = await loadAllData();
        if (!success) {
            console.error("Data loading failed.");
            return;
        }
    } catch (e) {
        console.error("Fatal Data Error:", e);
        return;
    }

    // 3. 各種状態の初期化と描画
    try {
        if (typeof processUrlParams === 'function') processUrlParams();
        if (typeof initializeDefaultGachas === 'function') initializeDefaultGachas();
        
        // スケジュールUIの準備（テーブル外の要素のため維持）
        if (typeof setupScheduleUI === 'function') setupScheduleUI();
        
        // 初回描画（テーブル生成：この中でテーブル内のコントロールも初期化されます）
        if (typeof onModeChange === 'function') onModeChange();

        // データ保持用要素(hidden)の値をヘッダー表示に反映
        if (typeof updateSeedDisplay === 'function') {
            updateSeedDisplay();
        }

        console.log("Application fully initialized with table-first layout.");
    } catch (e) {
        console.error("Initialization Flow Error:", e);
    }

    // 初回描画（テーブル生成）
        if (typeof onModeChange === 'function') onModeChange();

        // 【追記】スクロール監視の初期化
        if (typeof setupStickyHeaderObserver === 'function') {
            setupStickyHeaderObserver();
        }

        // データ保持用要素(hidden)の値をヘッダー表示に反映
        if (typeof updateSeedDisplay === 'function') {
            updateSeedDisplay();
        }
};

/**
 * デバッグ用関数
 */
window.getAppStatus = function() {
    return {
        seed: document.getElementById('seed')?.value,
        rolls: typeof currentRolls !== 'undefined' ? currentRolls : null,
        mode: typeof isSimulationMode !== 'undefined' ? (isSimulationMode ? "Sim" : "View") : "Unknown",
        gachas: typeof tableGachaIds !== 'undefined' ? tableGachaIds : []
    };
};