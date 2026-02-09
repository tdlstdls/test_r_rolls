/** @file view_schedule_table.js @description リスト形式のスケジュール表描画（スタイル内包型） */

function renderScheduleTable(tsvContent, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const data = parseGachaTSV(tsvContent);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayInt = getDateInt(yesterday);
    
    let filteredData = data.filter(item => parseInt(item.rawEnd) >= yesterdayInt);
    // フィルタ: 終了分の非表示設定
    if (hideEndedSchedules) {
        filteredData = filteredData.filter(item => {
            const endDt = parseDateTime(item.rawEnd, item.endTime);
            return now <= endDt;
        });
    }

    // ソート順：開催終了分を最優先 -> 通常ガチャ（日付順） -> 特別枠（日付順）
    filteredData.sort((a, b) => {
        const endA = parseDateTime(a.rawEnd, a.endTime);
        const endB = parseDateTime(b.rawEnd, b.endTime);
        const isEndedA = now > endA;
        const isEndedB = now > endB;

        if (isEndedA !== isEndedB) return isEndedA ? -1 : 1;

        const isSpecialA = isPlatinumOrLegend(a);
        const isSpecialB = isPlatinumOrLegend(b);
        if (isSpecialA !== isSpecialB) return isSpecialA ? 1 : -1; 

        return parseInt(a.rawStart) - parseInt(b.rawStart);
    });

    const ganttHtml = renderGanttChart(data);
    const hideBtnClass = hideEndedSchedules ? 'text-btn active' : 'text-btn';

    // スタイル定義：テーブル全体とセルの基本設定
    const tableBaseStyle = "width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 0; font-size: 14px; background-color: #fff;";
    const cellStyle = "border: 1px solid #ddd; padding: 8px; text-align: center; white-space: nowrap;";
    const headerStyle = cellStyle + " background-color: #eee; position: sticky; top: 0; z-index: 10; font-weight: bold;";

    let html = `
        <div style="margin-bottom: 15px;">
            <button onclick="toggleSchedule()" style="
                padding: 8px 16px; 
                font-size: 14px; 
                cursor: pointer; 
                border: none; 
                border-radius: 4px; 
                background-color: #007bff; 
                color: white; 
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">&larr; ロールズに戻る</button>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <h3 style="margin:0;">開催スケジュール</h3>
            <span onclick="toggleHideEnded()" class="${hideBtnClass}" style="font-size: 0.8em; cursor: pointer; text-decoration: underline; color: #007bff;">終了分を非表示</span>
        </div>
        
        ${ganttHtml}
        
        <div style="margin-top: 20px;"></div>
        <div style="overflow-x: auto; border: 1px solid #ddd; max-width: 100%;">
            <table style="${tableBaseStyle}">
            <thead>
                <tr>
                    <th style="${headerStyle} min-width:50px;">自</th>
                    <th style="${headerStyle} min-width:50px;">至</th>
                    <th style="${headerStyle} text-align: left;">ガチャ名 / 詳細</th>
                    <th style="${headerStyle}">レア</th>
                    <th style="${headerStyle}">激レア</th>
                    <th style="${headerStyle}">超激</th>
                    <th style="${headerStyle}">伝説</th>
                    <th style="${headerStyle}">確定</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredData.forEach((item, index) => {
        let seriesDisplay = item.seriesName ? item.seriesName : "シリーズ不明";
        
        if (item.guaranteed && !item.stepup && !seriesDisplay.includes("[確定]")) {
            seriesDisplay += " [確定]";
        }
        
        if (item.stepup && !seriesDisplay.includes("[StepUp]")) {
            seriesDisplay += " [StepUp]";
        }

        const startStr = `${formatDateJP(item.rawStart)}<br><span style="font-size:0.85em">${formatTime(item.startTime)}</span>`;
        const endDateFormatted = formatDateJP(item.rawEnd);
        let endStr = endDateFormatted;

        const isPlat = item.seriesName.includes("プラチナ");
        const isLeg = item.seriesName.includes("レジェンド");
        let isAppliedNextStart = false;

        if (isPlat || isLeg) {
            const nextSameType = filteredData.slice(index + 1).find(nextItem => {
                if (isPlat) return nextItem.seriesName.includes("プラチナ");
                if (isLeg) return nextItem.seriesName.includes("レジェンド");
                return false;
            });
    
            if (nextSameType) {
                if (parseInt(nextSameType.rawStart) < yesterdayInt) return;
                endStr = `${formatDateJP(nextSameType.rawStart)}<br><span style="font-size:0.85em">${formatTime(nextSameType.startTime)}</span>`;
                isAppliedNextStart = true;
            }
        }

        if (!isAppliedNextStart && endDateFormatted !== '永続') {
            endStr += `<br><span style="font-size:0.85em">${formatTime(item.endTime)}</span>`;
        }
        
        const isPlatLeg = isPlatinumOrLegend(item);
        const uberRateVal = parseInt(item.uber);
        let uberStyle = ( !isPlatLeg && uberRateVal !== 500 ) ? 'color:red; font-weight:bold;' : '';
        const legendRateVal = parseInt(item.legend);
        let legendStyle = ( !isPlatLeg && legendRateVal > 30 ) ? 'color:red; font-weight:bold;' : '';
        const endDateTime = parseDateTime(item.rawEnd, item.endTime);

        // 行のハイライト設定
        let rowInlineStyle = "";
        if (now > endDateTime) {
            rowInlineStyle = "background-color: #f9f9f9; color: #999; opacity: 0.8;"; // 終了分
        } else if (item.guaranteed && !item.stepup) {
            rowInlineStyle = "background-color: #fff0f0;"; // 確定枠（薄い赤）
        }
        
        html += `
            <tr style="${rowInlineStyle}">
                <td style="${cellStyle}">${startStr}</td>
                <td style="${cellStyle}">${endStr}</td>
                <td style="${cellStyle} text-align: left; white-space: normal; min-width: 250px; vertical-align: middle;">
                    <div style="font-weight:bold; color:#000;">${seriesDisplay} <span style="font-weight:normal; font-size:0.9em; color:#555; user-select: text;">(ID: ${item.id})</span></div>
                    <div style="font-size:0.85em; color:#333; margin-top:2px;">${item.tsvName}</div>
                </td>
                <td style="${cellStyle}">${fmtRate(item.rare)}</td>
                <td style="${cellStyle}">${fmtRate(item.supa)}</td>
                <td style="${cellStyle} ${uberStyle}">${fmtRate(item.uber)}</td>
                <td style="${cellStyle} ${legendStyle}">${fmtRate(item.legend)}</td>
                <td style="${cellStyle} font-size:1.2em;">
                    ${(item.guaranteed && !item.stepup) ? '<span style="color:red;">●</span>' : '-'}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;

    html += `
        <div style="margin-top: 20px; padding-bottom: 30px; text-align: center;">
            <button id="enter-edit-mode-btn" class="secondary" onclick="enterScheduleEditMode()" style="
                padding: 10px 20px; 
                font-size: 14px; 
                cursor: pointer; 
                border-radius: 4px; 
                background-color: #6c757d; 
                color: white; 
                border: none;">
                スケジュールを編集する
            </button>
        </div>
    `;

    container.innerHTML = html;
}