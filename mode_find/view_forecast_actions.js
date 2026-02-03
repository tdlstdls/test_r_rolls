/** @file view_forecast_actions.js @description Find機能のユーザー操作担当 */

function toggleLegendTargets() {
    const columnConfigs = prepareColumnConfigs();
    const status = getAvailableSpecialTargets(columnConfigs);
    const ids = status.availableLegendIds;
    if (status.isLegendActive) {
        ids.forEach(id => hiddenFindIds.add(id));
    } else {
        ids.forEach(id => hiddenFindIds.delete(id));
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

function toggleLimitedTargets() {
    const columnConfigs = prepareColumnConfigs();
    const status = getAvailableSpecialTargets(columnConfigs);
    const ids = status.availableLimitedIds;
    if (status.isLimitedActive) {
        ids.forEach(id => hiddenFindIds.add(id));
    } else {
        ids.forEach(id => hiddenFindIds.delete(id));
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

/**
 * 超激レアボタンのトグル処理
 * 伝説・限定と同じく、候補リスト（選択エリア）への表示・非表示を切り替える
 */
function toggleUberTargets() {
    const columnConfigs = prepareColumnConfigs();
    const status = getAvailableSpecialTargets(columnConfigs);
    const ids = status.availableUberIds;

    // status.isUberActive は logic.js での修正により hiddenFindIds に基づいています
    if (status.isUberActive) {
        // ON -> OFF : 非表示リスト(hiddenFindIds)に追加する
        ids.forEach(id => {
            hiddenFindIds.add(id);
            hiddenFindIds.add(String(id));
        });
    } else {
        // OFF -> ON : 非表示リストから削除して表示させる
        ids.forEach(id => {
            hiddenFindIds.delete(id);
            hiddenFindIds.delete(String(id));
        });
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

/**
 * 激レアボタンのトグル処理
 */
function toggleSuperTargets() {
    const columnConfigs = prepareColumnConfigs();
    const status = getAvailableSpecialTargets(columnConfigs);
    const ids = status.availableSuperIds;

    if (status.isSuperActive) {
        // ON -> OFF : 非表示リストに追加
        ids.forEach(id => {
            hiddenFindIds.add(id);
            hiddenFindIds.add(String(id));
        });
    } else {
        // OFF -> ON : 非表示リストから削除
        ids.forEach(id => {
            hiddenFindIds.delete(id);
            hiddenFindIds.delete(String(id));
        });
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

/**
 * レアボタンのトグル処理
 */
function toggleRareTargets() {
    const columnConfigs = prepareColumnConfigs();
    const status = getAvailableSpecialTargets(columnConfigs);
    const ids = status.availableRareIds;

    if (status.isRareActive) {
        // ON -> OFF : 非表示リストに追加
        ids.forEach(id => {
            hiddenFindIds.add(id);
            hiddenFindIds.add(String(id));
        });
    } else {
        // OFF -> ON : 非表示リストから削除
        ids.forEach(id => {
            hiddenFindIds.delete(id);
            hiddenFindIds.delete(String(id));
        });
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

function toggleCharVisibility(id) {
    const cid = isNaN(id) ? id : parseInt(id);
    if (hiddenFindIds.has(cid)) {
        hiddenFindIds.delete(cid);
    } else {
        hiddenFindIds.add(cid);
        userTargetIds.delete(cid);
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

function prioritizeChar(id) {
    const cid = isNaN(id) ? id : parseInt(id);

    const idx = userPrioritizedTargets.indexOf(cid);
    const pIdx = prioritizedFindIds.indexOf(cid);

    // すでに優先リストに含まれている場合は、リストから削除（優先解除）
    if (idx > -1) {
        userPrioritizedTargets.splice(idx, 1);
        if (pIdx > -1) {
            prioritizedFindIds.splice(pIdx, 1);
        }
    } else {
        // 優先リストに含まれていない場合は、リストの先頭に追加（優先指定）
        userPrioritizedTargets.unshift(cid);
        if (pIdx > -1) { // 念のため古いリストでも重複を避ける
            prioritizedFindIds.splice(pIdx, 1);
        }
        prioritizedFindIds.unshift(cid);
    }
    
    if (typeof generateRollsTable === 'function') generateRollsTable();
}

/**
 * 「選択（next）」エリアでのキャラクリック処理（トグル動作）
 */
function selectTargetAndHighlight(id, gachaId, address) {
    const cid = (typeof id === 'string' && id.startsWith('sim-new-')) ? id : (isNaN(id) ? id : parseInt(id));
    
    // すでに追跡対象（ターゲットリスト）に含まれているか判定
    const isAlreadyTarget = userTargetIds.has(cid);

    if (isAlreadyTarget) {
        // --- 解除処理 ---
        userTargetIds.delete(cid);
        // 上部のタグリスト (searchTargets) からも削除
        if (typeof searchTargets !== 'undefined') {
            searchTargets = searchTargets.filter(t => String(t.id) !== String(cid));
        }
    } else {
        // --- 追加処理 ---
        userTargetIds.add(cid);
        hiddenFindIds.delete(cid); // 非表示リストに入っていた場合は解除
        hiddenFindIds.delete(String(cid));
        
        // 上部のタグリストへ追加（ui_target_view用）
        if (typeof searchTargets !== 'undefined' && !searchTargets.some(t => String(t.id) === String(cid))) {
            const cat = gachaMasterData.cats[cid];
            searchTargets.push({
                id: String(cid),
                name: cat ? cat.name : cid,
                rarity: cat ? cat.rarity : 'uber'
            });
        }
    }

    // UIの再描画
    if (typeof updateTargetListUI === 'function') updateTargetListUI();
    if (typeof generateRollsTable === 'function') generateRollsTable();

    // アドレスが渡されている場合のみルート検索を実行（選択エリアからは基本 null が渡されます）
    if (!isAlreadyTarget && address && address !== "9999+") {
        const isB = address.startsWith('B');
        const rowMatch = address.match(/\d+/);
        const row = rowMatch ? parseInt(rowMatch[0], 10) : 0;
        const sIdx = (row - 1) * 2 + (isB ? 1 : 0);
        const catName = gachaMasterData.cats[cid]?.name || cid;
        if (typeof onGachaCellClick === 'function') {
            onGachaCellClick(sIdx, gachaId, catName, null, true, cid);
        }
    }
}

/**
 * ガチャごとの表示/非表示（[+]/[-]）を切り替える
 */
function toggleGachaCollapse(gachaId) {
    if (collapsedGachaIds.has(gachaId)) {
        collapsedGachaIds.delete(gachaId);
    } else {
        collapsedGachaIds.add(gachaId);
    }
    if (typeof generateRollsTable === 'function') generateRollsTable();
}