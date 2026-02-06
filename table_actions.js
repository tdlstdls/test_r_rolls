/** @file table_actions.js */

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

function toggleWidthMode() {
    isNarrowMode = !isNarrowMode;
    if (typeof generateRollsTable === 'function') {
        generateRollsTable();
    }
}

// スクロール監視
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        document.body.classList.add('hide-sticky-logo');
    } else {
        document.body.classList.remove('hide-sticky-logo');
    }
}, { passive: true });