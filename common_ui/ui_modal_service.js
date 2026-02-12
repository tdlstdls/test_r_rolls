/** @file ui_modal_service.js @description 汎用モーダル表示エンジン（テーブル階層との整合性最適化版） */

/**
 * 汎用モーダルを表示する
 * テーブルの固定列(z-index:100-110)よりも確実に前面に表示するため、
 * システムの最上位レイヤーとして z-index を管理します。
 * @param {string} contentHtml - モーダル内部に表示するHTMLコンテンツ
 */
function showModal(contentHtml) {
    let modal = document.getElementById('common-modal');
    
    // モーダル要素が存在しない場合は新規作成
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'common-modal';
        
        /**
         * モーダル外枠のスタイル設定
         * z-index: 10000 は、テーブルの固定ヘッダー(110)を十分に上回る
         * アプリケーション内での「最前面」を保証する数値です。
         */
        const modalBaseStyle = [
            "display: none",
            "position: fixed",
            "z-index: 10000",
            "left: 0",
            "top: 0",
            "width: 100%",
            "height: 100%",
            "background: rgba(0,0,0,0.7)", // 背景の透過度
            "overflow: auto"
        ].join("; ");
        
        modal.setAttribute("style", modalBaseStyle);
        document.body.appendChild(modal);
    }

    /**
     * モーダルコンテンツの描画
     * 中央配置と影（box-shadow）の設定
     */
    modal.innerHTML = `
        <div style="background:#fff; margin:10% auto; padding:15px; width:90%; max-width:500px; border-radius:8px; position:relative; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            ${contentHtml}
        </div>`;
        
    modal.style.display = 'block';
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    const modal = document.getElementById('common-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}