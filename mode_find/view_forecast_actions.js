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

    // hiddenFindIds を使って表示状態を管理するように統一
    if (status.isUberActive) {
        // 現在ONなら -> すべて非表示リストへ追加
        ids.forEach(id => hiddenFindIds.add(id));
    } else {
        // 現在OFFなら -> 非表示リストから削除して表示させる
        ids.forEach(id => hiddenFindIds.delete(id));
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
 * 「選択（next）」エリアでキャラがクリックされた時の処理
 * キャラをターゲットリストに追加し、詳細表示側へ反映させる。
 * ルート検索（スクロール）はここでは行わず、ターゲットリストのアドレスクリック時に任せる。
 */
function selectTargetAndHighlight(id, gachaId, address) {
    // IDの型を調整
    const cid = (typeof id === 'string' && id.startsWith('sim-new-')) ? id : (isNaN(id) ? id : parseInt(id));
    
    // 1. ターゲット状態を更新（追跡リストへ追加）
    userTargetIds.add(cid);
    hiddenFindIds.delete(cid); // 念のため非表示設定も解除
    
    // 2. 検索ターゲットリスト（UI上部のタグ用）にも同期
    if (typeof searchTargets !== 'undefined' && !searchTargets.some(t => String(t.id) === String(cid))) {
        const cat = gachaMasterData.cats[cid];
        searchTargets.push({
            id: String(cid),
            name: cat ? cat.name : cid,
            rarity: cat ? cat.rarity : 'uber'
        });
    }

    // 3. UIの再描画
    // これにより、選択エリアのキャラが黄色くハイライトされ、
    // 上部の Target List エリアに詳細情報が表示されるようになります
    if (typeof updateTargetListUI === 'function') updateTargetListUI();
    if (typeof generateRollsTable === 'function') generateRollsTable();

    // 4. アドレスが渡されている場合のみルート検索を実行（現在は選択エリアからは null が渡される設定）
    if (address && address !== "9999+") {
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