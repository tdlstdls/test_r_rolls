/** @file view_table_renderer.js @description 行・セルの描画処理（全セル罫線表示・操作パネル境界線最適化版） */

// テーブル全体の罫線とレイアウトを制御するスタイルを注入
if (typeof injectStyles === 'function') {
    injectStyles(`
        #rolls-table-container table {
            border-collapse: separate;
            border-spacing: 0;
            /* テーブル全体の外枠（上・左）を完全に除去し、セル単位の制御に委ねる */
            border: none;
        }

        /**
         * 条件分岐: フィラー（.table-filler）以外のセルにのみ右と下の罫線を適用
         */
        #rolls-table-container table th:not(.table-filler),
        #rolls-table-container table td:not(.table-filler) {
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            box-sizing: border-box;
        }

        /**
         * 条件分岐: データエリアの左端（NO列）にのみ左罫線を適用
         * これにより、.col-no を持たない操作パネル行（SEED変更等）の左側の線が消えます
         */
        #rolls-table-container .col-no {
            border-left: 1px solid #ddd;
            z-index: 10;
        }
    `);
}

/**
 * 行レンダリング (A/Bサイド別)
 * @param {number} rowIndex - 表示上の行番号
 * @param {number} seedIndex - 計算用のシードインデックス
 * @param {Array} columnConfigs - ガチャ列の設定
 * @param {Array} tableData - シミュレーション結果データ
 * @param {Array} seeds - シード値の配列
 * @param {Object} highlightMap - 通常ハイライト用マップ
 * @param {Object} guarHighlightMap - 確定枠ハイライト用マップ
 * @param {boolean} isLeftSide - Aトラック(左側)かどうか
 */
function renderTableRowSide(rowIndex, seedIndex, columnConfigs, tableData, seeds, highlightMap, guarHighlightMap, isLeftSide) {
    const rowData = tableData[seedIndex];
    if (!rowData) return ''; 

    // No列の背景色を決定 (再抽選等の状態に応じて変化)
    const rowInfo = rowData.rowInfo || {};
    let noColBgColor = isLeftSide ? '#f8f9fa' : '#eef9ff';
    if (rowInfo.isNormalReroll) {
        noColBgColor = '#FFFF00';
    } else if (rowInfo.isCrossReroll) {
        noColBgColor = '#FFA500';
    } else if (rowInfo.isActualReroll) {
        noColBgColor = '#FFDAB9';
    }

    // No列の描画 (左端の境界線を含む)
    let sideHtml = `<td class="col-no" style="background: ${noColBgColor}; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; border-left: 1px solid #ddd; ${isLeftSide ? 'position: sticky; left: 0; z-index: 5;' : ''}">${rowIndex + 1}</td>`;

    // 詳細計算セルの描画 (SEED列)
    if (typeof generateDetailedCalcCells === 'function') {
        sideHtml += generateDetailedCalcCells(seedIndex, seeds, tableData);
    } else {
        const calcColClass = `calc-column ${showSeedColumns ? '' : 'hidden'}`;
        sideHtml += `<td class="${calcColClass}" style="border-right: 1px solid #ddd; border-bottom: 1px solid #ddd;">-</td>`;
    }

    // 各ガチャ列のセルを描画
    tableGachaIds.forEach((idWithSuffix, colIndex) => {
        const id = idWithSuffix.replace(/[gfs]$/, '');
        const suffix = idWithSuffix.match(/[gfs]$/)?.[0] || '';
        const data = rowData.cells ? rowData.cells[colIndex] : null;

        // 通常セルの描画（非確定セル）
        if (typeof generateCell === 'function') {
            sideHtml += generateCell(seedIndex, id, colIndex, tableData, seeds, highlightMap, isSimulationMode);
        } else {
            sideHtml += `<td style="border-right: 1px solid #ddd; border-bottom: 1px solid #ddd;">-</td>`;
        }

        // 確定枠セルの描画
        if (suffix) {
            if (data && (data.guaranteed || (data.result && data.result.guaranteed))) {
                sideHtml += renderGuaranteedCell(seedIndex, id, suffix, data, seeds, colIndex, guarHighlightMap);
            } else {
                sideHtml += `<td class="gacha-cell gacha-column guaranteed-cell" style="border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; background: #eee; text-align:left;">-</td>`;
            }
        }
    });
    return sideHtml;
}

/**
 * 確定枠セルの詳細描画
 */
function renderGuaranteedCell(seedIndex, id, suffix, data, seeds, colIndex, guarHighlightMap) {
    let cellStyle = 'white-space: normal; word-break: break-all; vertical-align: middle; padding: 0; text-align: left; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; background-color: #ffffff;';

    const gMain = data.guaranteed || (data.result ? data.result.guaranteed : null);
    const gAlt = data.alternativeGuaranteed || (data.result ? data.result.alternativeGuaranteed : null);
    
    let gContent = '<div style="padding: 4px;">---</div>';
    if (gMain && (gMain.name || (gMain.finalChar && gMain.finalChar.name))) {
        const buildGHtml = (res, isAltRoute) => {
            if (!res) return "";
            const addr = formatTableAddress(res.nextRollStartSeedIndex);
            const verifiedStyle = (!res.isVerified && showSeedColumns && !isAltRoute) ? "border-left: 3px solid #ff4444;" : "";
            const gType = (suffix === 'g') ? '11g' : (suffix === 'f' ? '15g' : '7g');
            const charName = res.name || (res.finalChar ? res.finalChar.name : "データ不足");
            const escapedName = charName.replace(/'/g, "\\'");
            const finalSeedInProcess = seeds[res.nextRollStartSeedIndex - 1];
            
            let clickAction = "";
            if (showSeedColumns) {
                 clickAction = `onclick="if(!event.ctrlKey) showRollProcessPopup(${seedIndex}, '${id}', ${colIndex}, true, ${isAltRoute})"`;
            } else if (isSimulationMode) {
                clickAction = `onclick="if(!event.ctrlKey) onGachaCellClick(${seedIndex}, '${id}', '${escapedName}', '${gType}')"`;
            } else {
                clickAction = (res.nextRollStartSeedIndex >= 0 ? `onclick="if(!event.ctrlKey) updateSeedAndRefresh(${finalSeedInProcess})"` : "");
            }

            return `
            <div ${clickAction} style="cursor:pointer; padding:4px; ${verifiedStyle} ${isAltRoute ? 'border-bottom:1px dashed #ccc;' : ''}">
                <span class="cell-addr">${addr})</span><span class="char-link" style="font-weight:normal; color:#000;">${charName}</span>
            </div>`;
        };
        gContent = gAlt ? buildGHtml(gAlt, true) + buildGHtml(gMain, false) : buildGHtml(gMain, false);
    }
    
    return `<td class="gacha-cell gacha-column guaranteed-cell" style="${cellStyle}">${gContent}</td>`;
}

/**
 * テーブル用アドレス（A1, B25等）のフォーマット
 */
function formatTableAddress(index) {
    if (index === null || index === undefined || index < 0) return "---";
    const row = Math.floor(index / 2) + 1;
    const track = (index % 2 === 0) ? "A" : "B";
    return `${track}${row}`;
}

/**
 * 計算方法の詳細説明HTMLを生成
 */
function generateSeedExplanationHtml() {
    return `
        <div class="seed-explanation-container">
            <h4 style="margin-top: 0; color: #17a2b8; border-bottom: 2px solid #17a2b8; display: inline-block;">📖 SEED計算と排出の仕組み</h4>
            <div class="explanation-content">
                <p>左側のSEED詳細列を表示している際、キャラクター名をクリックすることで詳細な算出過程を確認できます：</p>
                <ul style="padding-left: 20px;">
                    <li><strong>1. レア度判定 (s0):</strong> <br>
                        そのシードのSEED値を <strong>10000</strong> で割った剰余を使用します。
                    </li>
                    <li><strong>2. キャラ判定 (s1):</strong> <br>
                        レア度決定後、<strong>「その次のシード (Index + 1)」</strong>のSEED値を使用し、レアリティ内のキャラ数で割った剰余で決定します。
                    </li>
                    <li style="margin-top: 15px;"><strong>3. 【参考表示】レア被り再抽選 (s2～):</strong> <br>
                        レアリティがレアで、かつ「前回引いたキャラ」と「今回判定されたキャラ」が同じ場合、さらに「その次のシード (Index + 2～)」で違うキャラが出るまで再抽選を繰り返し行います。<br>
                        再抽選を行う際は、一時的なキャラプール（当該レアの総数-1）を使用して算出します。使用したシード数が奇数の場合はトラック(A/B)が切り替わります。
                        
                        <div style="background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 6px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                            <strong style="color: #d9534f; font-size: 1.1em;">▼ 連鎖するレア被り（R表示）の例</strong>
                            <ol style="margin-top: 10px; padding-left: 25px;">
                                <li><strong>地点A1</strong>: 通常は「ねこ占い師」だが、直前と被ったため再抽選。結果 <strong>「ネコ魔女」</strong> に決定。</li>
                                <li><strong>移動先B2</strong>: 奇数消費によりB2へ移動。しかしB2の本来の通常キャラがたまたま <strong>「ネコ魔女」</strong> だった。</li>
                                <li><strong>判定</strong>: 移動先でも「直前に確定した最終キャラ」と被ったため、B2でも即座に再抽選が実行されます。</li>
                                <li><strong>表示</strong>: この場合、連鎖を意味する <strong>「R」</strong> が付与され、さらにトラックがA4へ戻る現象が発生します（RA4）。</li>
                            </ol>
                        </div>
                    </li>

                    <li style="margin-top: 15px;"><strong>4. 確定枠の挙動:</strong> <br>
                        確定枠（G列）ではレア度判定を行わず、直接超激レアを決定します。常に1つのSEEDを消費するため、必ずトラックが切り替わります。
                    </li>
                </ul>

                <div style="background: #e7f3fe; border-left: 5px solid #2196f3; padding: 18px; margin-top: 25px; border-radius: 4px;">
                    <strong style="color: #0d47a1; font-size: 1.1em;">💡 回避/誘発テクニック：トラック移行をコントロールする</strong>
                    <p style="margin-top: 10px;">
                        レア被りによるトラック移行を意図的に避けたり、あるいは逆に移行させたい場合は以下の方法が有効です。
                    </p>
                    <ul style="padding-left: 20px;">
                        <li><strong>回避：別のガチャを1回挟む</strong><br>
                            「キャラ判定(s1)」は排出されるレアキャラが異なる別のガチャを1回だけ引くことで、計算結果が変わり、レア被りを回避して同一トラックを維持できます。
                        </li>
                        <li><strong>誘発：あえて同じキャラが出るガチャを選ぶ</strong><br>
                            逆に、あえてレア被りが発生するガチャを引くことで、意図的にトラックを切り替えて目的のルートへ合流させることができます。
                        </li>
                        <li><strong>回避：プラチナチケットの活用</strong><br>
                            プラチナチケットは「レア被り」が発生しません。再抽選を発生させずに同一トラックを維持して進むことが可能です。
                        </li>
                    </ul>
                </div>
                
                <div style="background: #fffbe6; border: 1px solid #ffe58f; padding: 18px; margin-top: 25px; border-radius: 6px; color: #856404; line-height: 1.6;">
                    <strong style="font-size: 1.1em;">⚠️ 【参考表示】および注意点について</strong>
                    <p style="margin-top: 10px;">
                        このテーブルの「遷移先アドレス」は、常に同じガチャを引き続けた場合の理論値です。途中でガチャを切り替えた場合の正確な挙動は、シミュレーションモードを活用してご確認ください。
                    </p>
                </div>
            </div>
        </div>
    `;
}