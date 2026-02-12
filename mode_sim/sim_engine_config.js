/** @file sim_engine_config.js @description 経路探索の統合制御（ターゲットインデックス同期・特定地点差し替え・末尾アクション自動付加版） */

/**
 * 経路探索エントリポイント
 * 特定の条件を満たす場合、既存ルートの一部を差し替える「Surgical Splice」を実行します。
 */
function calculateRouteToCell(targetSeedIndex, targetGachaId, visibleGachaIds, currentConfigStr, finalActionOverride = null, primaryTargetId = null) {
    const estimatedNeededSeeds = Math.max(targetSeedIndex, 1000) + 500;
    const simSeeds = generateSeedsForSim(estimatedNeededSeeds);

    const usableConfigs = visibleGachaIds.map(idStr => {
        const id = idStr.replace(/[gfs]$/, '');
        const config = gachaMasterData.gachas[id] || null;
        if (config) config._fullId = idStr;
        return config;
    }).filter(c => c !== null);

    const maxPlat = parseInt(document.getElementById('sim-max-plat')?.value || 0, 10);
    const maxGuar = parseInt(document.getElementById('sim-max-guar')?.value || 0, 10);

    // --- 仕様変更：既存ルートの途中書き換え（Surgical Splice）判定 ---
    if (currentConfigStr && currentConfigStr.trim() !== "") {
        const currentSegments = parseSimConfig(currentConfigStr);
        const fullPathActions = flattenSegments(currentSegments);
        
        // 現在のルートをシミュレートして、各アクションの開始インデックスを特定
        let tempIdx = 0;
        let tempStates = null;
        let originalRouteData = []; // {startIdx, action, endIdx, trackB}

        for (const action of fullPathActions) {
            const res = simulateSingleSegment(action, tempIdx, tempStates, simSeeds, 'sim');
            originalRouteData.push({
                startIdx: tempIdx,
                action: action,
                endIdx: res.nextIndex,
                trackB: (tempIdx % 2 !== 0)
            });
            tempIdx = res.nextIndex;
            tempStates = res.trackStates;
        }

        const currentFinalIdx = tempIdx;

        // 条件：クリックされたセルが既存ルートの終点より上にある
        if (targetSeedIndex < currentFinalIdx) {
            // クリックされたインデックスに対応するアクションを探す
            const hitIndex = originalRouteData.findIndex(d => d.startIdx === targetSeedIndex);
            
            if (hitIndex !== -1) {
                const originalStep = originalRouteData[hitIndex];
                const cleanTargetId = targetGachaId.replace(/[gfs]$/, "");
                
                // 条件：ガチャが異なり、かつトラック（A/B）が一致している
                if (originalStep.action.id !== cleanTargetId) {
                    
                    // 条件：新しいガチャをその地点で引いたときにレア被り（トラック移動）が発生しないか確認
                    const newAction = { id: cleanTargetId, rolls: 1, g: false, fullId: targetGachaId };
                    const prevStepStates = hitIndex > 0 ? 
                        simulateRouteUntil(fullPathActions.slice(0, hitIndex), simSeeds) : null;
                    
                    const testRes = simulateSingleSegment(newAction, targetSeedIndex, prevStepStates, simSeeds, 'sim');
                    const seedsConsumed = testRes.nextIndex - targetSeedIndex;

                    // 通常、レア被りなしなら2シード消費（確定枠でない場合）
                    // 以前と同じシード消費数（経路のズレがない）かつ、トラック移動フラグが立っていないことを理想とする
                    const isRerolled = testRes.trackStates?.lastAction?.isRerolled || false;

                    if (!isRerolled && seedsConsumed === (originalStep.endIdx - originalStep.startIdx)) {
                        console.log("[Sim] ルートの部分差し替えを実行します");
                        
                        const newPath = [
                            ...fullPathActions.slice(0, hitIndex),
                            newAction,
                            ...fullPathActions.slice(hitIndex + 1)
                        ];
                        
                        return compressRoute(newPath);
                    }
                }
            }
        }
    }

    // --- 通常の探索ロジック（従来通り） ---
    let workingConfig = currentConfigStr;
    const MAX_RETRIES = 8;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const { startIdx, initialLastDraw, baseSegments } = calculateInitialState(workingConfig, targetSeedIndex, simSeeds);

        let route = findPathBeamSearch(startIdx, targetSeedIndex, targetGachaId, usableConfigs, simSeeds, initialLastDraw, primaryTargetId, 0, 0, false);
        
        if (!route && (maxGuar > 0 || maxPlat > 0)) {
            route = findPathBeamSearch(startIdx, targetSeedIndex, targetGachaId, usableConfigs, simSeeds, initialLastDraw, primaryTargetId, maxPlat, maxGuar, false);
        }

        if (route) {
            if (finalActionOverride) {
                route.push(finalActionOverride);
            } else {
                route.push({ 
                    id: targetGachaId.replace(/[gfs]$/, ""), 
                    rolls: 1, 
                    g: false, 
                    fullId: targetGachaId 
                });
            }
            return compressRoute([...baseSegments, ...route]);
        }

        if (attempt < MAX_RETRIES && workingConfig && workingConfig.trim() !== "") {
            const backtrackAmount = Math.max(1, Math.min(Math.floor(parseSimConfig(workingConfig).reduce((sum, s) => sum + s.rolls, 0) / 10), 10));
            for (let i = 0; i < backtrackAmount; i++) {
                workingConfig = decrementLastRollOrRemoveSegment(workingConfig);
                if (!workingConfig) break;
            }
        } else {
            break;
        }
    }

    return null;
}

/**
 * セグメント配列を、1ロールずつのアクション配列に展開する
 */
function flattenSegments(segments) {
    const flat = [];
    for (const seg of segments) {
        if (seg.g) {
            flat.push({ ...seg }); // 確定枠はそのまま
        } else {
            for (let i = 0; i < seg.rolls; i++) {
                flat.push({ id: seg.id, rolls: 1, g: false, fullId: seg.id });
            }
        }
    }
    return flat;
}

/**
 * 指定したアクション配列の最後までシミュレートし、最終状態（trackStates）を返す
 */
function simulateRouteUntil(actions, seeds) {
    let currentIdx = 0;
    let states = null;
    for (const action of actions) {
        const res = simulateSingleSegment(action, currentIdx, states, seeds, 'sim');
        currentIdx = res.nextIndex;
        states = res.trackStates;
    }
    return states;
}

/**
 * 探索用の乱数シード配列を生成
 */
function generateSeedsForSim(targetSeedIndex) {
    const seedEl = document.getElementById('seed');
    const initialSeed = parseInt(seedEl ? seedEl.value : 12345, 10);
    const rng = new Xorshift32(initialSeed);
    const tempSeeds = [];
    
    const limit = Math.max(targetSeedIndex, 1000) + 500;
    for (let i = 0; i < limit; i++) {
        tempSeeds.push(rng.next());
    }
    return tempSeeds;
}

/**
 * 現在のルート入力値を解析し、探索を開始すべき地点の状態を算出
 */
function calculateInitialState(currentConfigStr, targetSeedIndex, simSeeds) {
    let startIdx = 0;
    let initialLastDraw = null;
    let validConfigParts = [];

    if (currentConfigStr && currentConfigStr.trim() !== "") {
        const existingConfigs = parseSimConfig(currentConfigStr);
        let tempIdx = 0;
        let tempLastDraw = null;

        for (const segment of existingConfigs) {
            const res = simulateSingleSegment(segment, tempIdx, tempLastDraw, simSeeds, 'sim');
            if (res.nextIndex > targetSeedIndex) break;

            validConfigParts.push(segment);
            tempIdx = res.nextIndex; 
            tempLastDraw = res.trackStates;
            
            if (tempIdx === targetSeedIndex) break;
        }
        startIdx = tempIdx;
        initialLastDraw = tempLastDraw;
    }
    
    return { 
        startIdx, 
        initialLastDraw, 
        baseSegments: validConfigParts 
    };
}