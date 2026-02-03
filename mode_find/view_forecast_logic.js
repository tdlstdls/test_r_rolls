/** @file view_forecast_logic.js @description Find機能の計算ロジック担当 */

function generateSeedsForForecast(initialSeed, count) {
    const seeds = new Uint32Array(count);
    const rng = new Xorshift32(initialSeed);
    for (let i = 0; i < count; i++) {
        seeds[i] = rng.next();
    }
    return seeds;
}

function formatForecastAddress(n) {
    const track = (n % 2 === 0) ? 'A' : 'B';
    const row = Math.floor(n / 2) + 1;
    return `${track}${row}`;
}

function getSpecialSlotsInfo(seeds, limit) {
    const legendSlots = [];
    const promotedSlots = [];
    for (let n = 0; n < limit; n++) {
        const val = seeds[n] % 10000;
        const addr = formatForecastAddress(n);
        if (val >= 9970) legendSlots.push(addr);
        else if (val >= 9940) promotedSlots.push(addr);
    }
    return { legendSlots, promotedSlots };
}

// 初期化が完了したかどうかを記録するフラグ（ファイル上部に追記）
let isFindDefaultStateInitialized = false;

/**
 * 特殊カテゴリの利用可能状況取得と初期状態の設定
 */
function getAvailableSpecialTargets(columnConfigs) {
    const processedGachaIds = new Set();
    let availableLegendIds = [];
    let availableLimitedIds = [];
    let availableUberIds = [];
    let availableSuperIds = []; // 追加
    let availableRareIds = [];  // 追加
    const limitedSet = getLimitedSet();

    columnConfigs.forEach((config) => {
        if (!config || processedGachaIds.has(config.id)) return;
        processedGachaIds.add(config.id);

        if (config.pool.legend) config.pool.legend.forEach(c => availableLegendIds.push(c.id));
        
        // 各レアリティのIDを収集（限定キャラは除く）
        const rarityMapping = [
            { key: 'uber', list: availableUberIds },
            { key: 'super', list: availableSuperIds },
            { key: 'rare', list: availableRareIds }
        ];

        rarityMapping.forEach(map => {
            if (config.pool[map.key]) {
                config.pool[map.key].forEach(c => {
                    if (!limitedSet.has(c.id) && !limitedSet.has(String(c.id))) {
                        map.list.push(c.id);
                    }
                });
            }
        });
        
        ['rare', 'super', 'uber'].forEach(r => {
            if (config.pool[r]) config.pool[r].forEach(c => {
                if (limitedSet.has(c.id)) availableLimitedIds.push(c.id);
            });
        });
    });

    // --- 初回のみデフォルトOFFに設定（超激・激レア・レア） ---
    if (!isFindDefaultStateInitialized) {
        const defaultOffIds = [...availableUberIds, ...availableSuperIds, ...availableRareIds];
        if (defaultOffIds.length > 0) {
            defaultOffIds.forEach(id => {
                hiddenFindIds.add(id);
                hiddenFindIds.add(String(id));
            });
            isFindDefaultStateInitialized = true;
        }
    }

    return {
        isLegendActive: availableLegendIds.length > 0 && availableLegendIds.some(id => !hiddenFindIds.has(id)),
        isLimitedActive: availableLimitedIds.length > 0 && availableLimitedIds.some(id => !hiddenFindIds.has(id)),
        isUberActive: availableUberIds.length > 0 && availableUberIds.some(id => !hiddenFindIds.has(id)),
        isSuperActive: availableSuperIds.length > 0 && availableSuperIds.some(id => !hiddenFindIds.has(id)), // 追加
        isRareActive: availableRareIds.length > 0 && availableRareIds.some(id => !hiddenFindIds.has(id)),   // 追加
        isMasterActive: (typeof isMasterInfoVisible !== 'undefined') ? isMasterInfoVisible : false,
        availableLegendIds,
        availableLimitedIds,
        availableUberIds,
        availableSuperIds, // 追加
        availableRareIds   // 追加
    };
}

function getLimitedSet() {
    const limitedSet = new Set();
    if (typeof limitedCats !== 'undefined' && Array.isArray(limitedCats)) {
        limitedCats.forEach(id => {
            limitedSet.add(id);
            limitedSet.add(String(id));
        });
    }
    return limitedSet;
}

function getTargetInfoForConfig(config) {
    const ids = new Set();
    const poolsToCheck = { legend: false, rare: false, super: false, uber: false };
    const limitedSet = getLimitedSet();

    ['legend', 'rare', 'super', 'uber'].forEach(r => {
        if (!config.pool[r]) return;
        config.pool[r].forEach(charObj => {
            const cid = charObj.id;
            const isAuto = isAutomaticTarget(cid);
            const isHidden = hiddenFindIds.has(cid) || hiddenFindIds.has(String(cid));
            const isManual = userTargetIds.has(cid) || userTargetIds.has(parseInt(cid));
            const isPrioritized = prioritizedFindIds.includes(cid) || prioritizedFindIds.includes(String(cid)) || prioritizedFindIds.includes(parseInt(cid));

            if ((isAuto && !isHidden) || isManual || isPrioritized) {
                ids.add(cid);
                poolsToCheck[r] = true;
            }
        });
    });

    return { ids, poolsToCheck, limitedSet };
}

function performScan(config, seeds, start, end, targets, resultMap, missingTargets) {
    const rates = config.rarity_rates;
    for (let n = start; n < end; n++) {
        if (missingTargets.size === 0 && start >= 4000) break;
        const rVal = seeds[n] % 10000;
        let rarity = 'rare';
        if (rVal < rates.rare) rarity = 'rare';
        else if (rVal < rates.rare + rates.super) rarity = 'super';
        else if (rVal < rates.rare + rates.super + rates.uber) rarity = 'uber';
        else if (rVal < rates.rare + rates.super + rates.uber + rates.legend) rarity = 'legend';

        if (targets.poolsToCheck[rarity]) {
            const pool = config.pool[rarity];
            const char = pool[seeds[n + 1] % pool.length];
            if (targets.ids.has(char.id)) {
                updateResultMap(resultMap, char, rarity, n, targets.limitedSet, missingTargets);
            }
        }
    }
}

function updateResultMap(resultMap, char, rarity, n, limitedSet, missingTargets) {
    const cid = char.id;
    if (!resultMap.has(cid)) {
        resultMap.set(cid, {
            name: gachaMasterData.cats[cid]?.name || cid,
            hits: [],
            rarity: rarity, // レアリティ情報を追加
            isLegend: (rarity === 'legend'),
            isNew: String(cid).startsWith('sim-new-'),
            isLimited: limitedSet.has(cid) || limitedSet.has(String(cid))
        });
    }
    const addr = formatForecastAddress(n);
    if (!resultMap.get(cid).hits.includes(addr)) {
        resultMap.get(cid).hits.push(addr);
        if (resultMap.get(cid).hits.length >= 3) missingTargets.delete(cid);
    }
}

/**
 * 検索対象として自動的に抽出するレアリティ・条件を定義
 */
function isAutomaticTarget(id) {
    const cid = String(id);
    if (cid.startsWith('sim-new-')) return true;
    if (typeof limitedCats !== 'undefined' && (limitedCats.includes(id) || limitedCats.includes(parseInt(id)))) return true;
    const cat = gachaMasterData.cats[id];
    // 伝説、限定に加えて、超激・激レア・レアを候補リストの自動抽出対象とする
    return cat && (
        cat.rarity === 'legend' || 
        cat.rarity === 'uber' || 
        cat.rarity === 'super' || 
        cat.rarity === 'rare'
    );
}