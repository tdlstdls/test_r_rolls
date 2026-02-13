/** @file table_actions.js @description テーブル操作（列追加、削除、ガチャ切替、設定変更）のロジック */

/**
 * 直接IDを入力して列を追加するUIを表示
 */
function showIdInput() {
    const trigger = document.getElementById('add-id-trigger');
    if (!trigger) return;

    trigger.onclick = null;
    trigger.innerHTML = `<input type="text" id="direct-id-input" placeholder="ID" style="width:50px; font-size:10px; border:none; outline:none; padding:0; margin:0; background:transparent; color:white; text-align:center;" onkeydown="if(event.key==='Enter') applyDirectId()">`;
    
    const input = document.getElementById('direct-id-input');
    input.focus();

    input.onblur = () => { 
        setTimeout(() => { 
            trigger.innerText = 'IDで追加';
            trigger.onclick = showIdInput; 
        }, 200); 
    };
}

/**
 * 入力されたIDを検証してテーブルの末尾に追加
 */
function applyDirectId() {
    const input = document.getElementById('direct-id-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        const baseId = val.replace(/[gfs]$/, '');
        if (gachaMasterData.gachas[baseId]) {
            tableGachaIds.push(val);
            if (typeof updateUrlParams === 'function') updateUrlParams();
            resetAndGenerateTable();
        } else {
            alert("無効なガチャIDです。");
        }
    }
}

/**
 * プルダウンから選択されたガチャに更新する
 * @param {HTMLSelectElement} el - セレクトボックス要素
 * @param {number} index - 更新対象の列インデックス
 */
function updateGachaSelection(el, index) {
    if (!el || index === undefined) return;
    const newBaseId = el.value;
    if (!newBaseId) return;

    // 現在の列のサフィックス（g, f, s等）を取得して維持する
    const oldIdWithSuffix = tableGachaIds[index] || "";
    const suffixMatch = oldIdWithSuffix.match(/[gfs]$/);
    const suffix = suffixMatch ? suffixMatch[0] : '';

    // 新しいIDに既存のサフィックスを結合して配列を更新
    tableGachaIds[index] = newBaseId + suffix;

    if (typeof updateUrlParams === 'function') updateUrlParams();
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * ガチャ列の確定ステップをプルダウン選択により更新する
 * @param {HTMLSelectElement} el - セレクトボックス要素
 * @param {number} index - 対象の列インデックス
 */
function updateGachaStep(el, index) {
    if (!el || index === undefined) return;
    const newSuffix = el.value; // '', 'g', 'f', 's'
    let idWithSuffix = tableGachaIds[index];
    if (!idWithSuffix) return;

    // ID部分を抽出し、新しいサフィックスを付与する
    let baseId = idWithSuffix.replace(/[gfs]$/, '');
    tableGachaIds[index] = baseId + newSuffix;

    if (typeof updateUrlParams === 'function') updateUrlParams();
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * 指定したインデックスのガチャ列を削除する
 */
function removeGachaColumn(index) {
    if (tableGachaIds.length <= 1) {
        alert("これ以上列を削除できません。");
        return;
    }
    tableGachaIds.splice(index, 1);
    
    // 超激レア追加カウントも同期して削除
    if (typeof uberAdditionCounts !== 'undefined' && Array.isArray(uberAdditionCounts)) {
        uberAdditionCounts.splice(index, 1);
    }

    if (typeof updateUrlParams === 'function') updateUrlParams();
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * デフォルトの列追加（末尾の列をコピー）
 */
function addGachaColumn() {
    const lastId = tableGachaIds.length > 0 ? tableGachaIds[tableGachaIds.length - 1] : "349";
    tableGachaIds.push(lastId);

    if (typeof updateUrlParams === 'function') updateUrlParams();
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * 全ての追加列を削除し、最初の1列のみにする
 */
function resetToFirstGacha() {
    if (tableGachaIds.length <= 1) return;
    tableGachaIds.splice(1);
    if (typeof uberAdditionCounts !== 'undefined' && Array.isArray(uberAdditionCounts)) {
        uberAdditionCounts.splice(1);
    }
    
    if (typeof updateUrlParams === 'function') updateUrlParams();
    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * 超激レア追加設定の数値を更新する
 */
function updateUberAddition(el, index) {
    if (!el) return;
    const val = parseInt(el.value, 10);
    if (isNaN(val)) return;

    if (typeof uberAdditionCounts === 'undefined') window.uberAdditionCounts = [];
    uberAdditionCounts[index] = val;

    if (typeof resetAndGenerateTable === 'function') {
        resetAndGenerateTable();
    }
}

/**
 * 列内の「add」ボタンクリック時に数値選択用プルダウンを表示する
 */
function showAddInput(index) {
    const wrapper = document.getElementById(`add-select-wrapper-${index}`);
    const trigger = document.getElementById(`add-trigger-${index}`);
    if (wrapper) {
        wrapper.style.display = 'inline';
        if (trigger) trigger.style.display = 'none';
        
        const select = wrapper.querySelector('select');
        if (select) {
            select.focus();
            select.onblur = () => {
                setTimeout(() => {
                    wrapper.style.display = 'none';
                    if (trigger) trigger.style.display = 'inline';
                }, 200);
            };
        }
    }
}

/**
 * 狭幅表示モードの切り替え
 */
function toggleWidthMode() {
    if (typeof isNarrowMode !== 'undefined') {
        isNarrowMode = !isNarrowMode;
    }
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
}

// スクロール監視：ヘッダーのロゴ表示制御
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        document.body.classList.add('hide-sticky-logo');
    } else {
        document.body.classList.remove('hide-sticky-logo');
    }
}, { passive: true });