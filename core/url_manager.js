/**
 * @file url_manager.js
 * @description URLパラメータとアプリ状態(SEED、ルート、選択ガチャ)の相互同期
 * @managed_state seed, sim_config, tableGachaIds, uberAdditionCounts
 * @input_output window.location.search
 */

// --- 状態保持用のバックアップ変数 ---
// UI要素がDOMから一時的に消えても、値を保持してURLを維持するために使用します
let lastSimConfig = "";
let lastMaxPlat = "0";
let lastMaxGuar = "0";

/**
 * URLパラメータを読み取り、アプリの状態に反映させる
 */
function processUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    const simConfigParam = urlParams.get('sim_config');
    const gachasParam = urlParams.get('gachas');

    // uberAdditionCounts をリセット (ui_globals.js で定義されたものを使用)
    if (typeof uberAdditionCounts !== 'undefined') {
        uberAdditionCounts.length = 0;
    } else {
        window.uberAdditionCounts = [];
    }

    // ガチャ列パラメータの解析
    if (gachasParam) {
        const parts = gachasParam.split('-');
        tableGachaIds = []; // reset
        
        parts.forEach((part, index) => {
            // "1006gadd5" 形式への対応
            if (part.includes('add')) {
                const subParts = part.split('add');
                const id = subParts[0];
                const addVal = parseInt(subParts[1], 10);
                
                tableGachaIds.push(id);
                if (!isNaN(addVal) && addVal > 0) {
                    uberAdditionCounts[index] = addVal;
                } else {
                    uberAdditionCounts[index] = 0;
                }
            } else {
                tableGachaIds.push(part);
                uberAdditionCounts[index] = 0;
            }
        });
    }

    // SEEDの反映
    const seedEl = document.getElementById('seed');
    if (seedParam) {
        if(seedEl) seedEl.value = seedParam;
    } else {
        if(seedEl && !seedEl.value) seedEl.value = "12345";
    }

    // sim_config param の処理 (s-xxx or v-xxx)
    if (simConfigParam) {
        let rawConfig = simConfigParam;
        let mode = null;

        if (rawConfig.startsWith('s-')) {
            mode = 'sim';
            rawConfig = rawConfig.substring(2);
        } else if (rawConfig.startsWith('v-')) {
            mode = 'view';
            rawConfig = rawConfig.substring(2);
        } else {
            // 互換性: プレフィックスなしの場合はSimモードとみなす
            mode = 'sim';
        }

        // バックアップ変数に保存
        lastSimConfig = rawConfig.replace(/\+/g, ' ');

        const configEl = document.getElementById('sim-config');
        if(configEl) {
            configEl.value = lastSimConfig;
        }
        
        // モードの反映
        if (mode === 'sim') {
            if(typeof isSimulationMode !== 'undefined') isSimulationMode = true;
        } else if (mode === 'view') {
            if(typeof isSimulationMode !== 'undefined') isSimulationMode = false;
        }
    }
}

/**
 * 現在のアプリ状態をURLパラメータに反映させる
 */
function updateUrlParams() {
    // 1. 要素の存在を確認しながら値を取得し、バックアップを更新する
    const seedEl = document.getElementById('seed');
    const seed = seedEl ? seedEl.value : "";
    
    const configEl = document.getElementById('sim-config');
    if (configEl) lastSimConfig = configEl.value.trim();
    
    const maxPlatEl = document.getElementById('sim-max-plat');
    if (maxPlatEl) lastMaxPlat = maxPlatEl.value;

    const maxGuarEl = document.getElementById('sim-max-guar');
    if (maxGuarEl) lastMaxGuar = maxGuarEl.value;

    const urlParams = new URLSearchParams(window.location.search);

    // 2. SEEDをURLに設定
    if (seed) {
        urlParams.set('seed', seed);
    } else {
        urlParams.delete('seed');
    }
    
    // 3. ルート設定(sim_config)をURLに設定 (バックアップ変数を使用)
    if (lastSimConfig) {
        const prefix = (typeof isSimulationMode !== 'undefined' && isSimulationMode) ? 's-' : 'v-';
        urlParams.set('sim_config', prefix + lastSimConfig);
    } else {
        urlParams.delete('sim_config');
    }
    
    // 4. ガチャ列(gachas)をURLに設定
    if (typeof tableGachaIds !== 'undefined' && tableGachaIds.length > 0) {
        const joined = tableGachaIds.map((id, index) => {
            // ID重複などのクリーンアップ
            let cleanedId = id;
            if (id.endsWith('gg')) cleanedId = id.slice(0, -1);
            if (id.endsWith('fg')) cleanedId = id.slice(0, -1);
            if (id.endsWith('ff')) cleanedId = id.slice(0, -1);

            const addVal = (typeof uberAdditionCounts !== 'undefined') ? uberAdditionCounts[index] : 0;
            if (addVal && addVal > 0) {
                return `${cleanedId}add${addVal}`;
            }
            return cleanedId;
        }).join('-');
        urlParams.set('gachas', joined);
    } else {
        urlParams.delete('gachas');
    }

    // 5. URLの更新実行
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    try { 
        window.history.pushState({path: newUrl}, '', newUrl);
    } catch (e) { 
        console.warn("URL update failed", e); 
    }
}