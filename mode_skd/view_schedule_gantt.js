/** @file view_schedule_gantt.js @description ガントチャートの描画処理（固定列への重なり防止・スタイル内包型） */

function renderGanttChart(data) {
    const filteredData = data.filter(item => !isPlatinumOrLegend(item));
    if (filteredData.length === 0) return '<p>表示可能なスケジュールがありません。</p>';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayInt = getDateInt(yesterday);
    
    let activeData = filteredData.filter(item => parseInt(item.rawEnd) >= yesterdayInt);
    const now = new Date();
    if (hideEndedSchedules) {
        activeData = activeData.filter(item => {
            const endDt = parseDateTime(item.rawEnd, item.endTime);
            return now <= endDt;
        });
    }

    activeData.sort((a, b) => {
        const endA = parseDateTime(a.rawEnd, a.endTime);
        const endB = parseDateTime(b.rawEnd, b.endTime);
        const isEndedA = now > endA;
        const isEndedB = now > endB;
        if (isEndedA !== isEndedB) return isEndedA ? -1 : 1;
        return parseInt(a.rawStart) - parseInt(b.rawStart);
    });
    if (activeData.length === 0) return '<p>表示可能な開催中のスケジュールはありません。</p>';

    let minDateInt = parseInt(activeData[0].rawStart);
    let maxEndDateTime = new Date(0);
    let maxLabelTextWidth = 0;
    activeData.forEach(item => {
        const s = parseInt(item.rawStart);
        if (s < minDateInt) minDateInt = s;
        const eDt = parseDateTime(item.rawEnd, item.endTime);
        if (eDt > maxEndDateTime) maxEndDateTime = eDt;

        let displayName = item.seriesName;
        if (item.guaranteed && !item.stepup && !displayName.includes("[確定]")) {
            displayName += " [確定]";
        }
        if (item.stepup && !displayName.includes("[StepUp]")) {
            displayName += " [StepUp]";
        }
        
        if (typeof calcTextWidth === 'function') {
            const textW = calcTextWidth(displayName);
            if (textW > maxLabelTextWidth) maxLabelTextWidth = textW;
        }
    });
    let labelWidth = Math.max(160, maxLabelTextWidth + 20);
    if (labelWidth > 1000) labelWidth = 1000;

    let minDate = parseDateStr(String(minDateInt));
    const viewStartDate = new Date(yesterday);
    viewStartDate.setDate(viewStartDate.getDate() - 2);
    if (minDate < viewStartDate) minDate = viewStartDate;

    let chartEnd = new Date(maxEndDateTime);
    chartEnd.setHours(0, 0, 0, 0);
    chartEnd.setDate(chartEnd.getDate() + 1);

    const totalDays = Math.ceil((chartEnd - minDate) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return '';
    const dayWidth = 50; 
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalWidth = labelWidth + (totalDays * dayWidth);
    
    let currentLineHtml = '';
    if (now >= minDate && now < chartEnd) {
        const diffNowMs = now - minDate;
        const currentLineLeftPx = (diffNowMs / msPerDay) * dayWidth;
        // 赤い線のz-indexを5に設定
        currentLineHtml = `<div class="gantt-current-line" style="position: absolute; top: 0; bottom: 0; width: 2px; background-color: #ff0000; z-index: 5; opacity: 0.7; pointer-events: none; left:${currentLineLeftPx}px;"></div>`;
    }

    // ヘッダーのラベル列z-indexを20に設定
    let headerHtml = `<div class="gantt-header" style="width: ${totalWidth}px; min-width: ${totalWidth}px; display: flex; flex-wrap: nowrap; background: #f9f9f9; height: 30px; border-bottom: 1px solid #ccc; position: sticky; top: 0; z-index: 6;">
        <div class="gantt-label-col" style="width:${labelWidth}px; min-width:${labelWidth}px; flex: none; display: block; height: 30px; line-height: 30px; text-align: center; box-sizing: border-box; font-weight: bold; border-right: 1px solid #ccc; background-color: #f9f9f9; position: sticky; left: 0; z-index: 20;">ガチャ名</div>`;
    
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        const dateStr = getShortDateStr(d);
        const isToday = getDateInt(d) === getDateInt(new Date());
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        let cellBg = isToday ? '#ffeb3b' : (isWeekend ? '#e0f7fa' : 'transparent');
        headerHtml += `<div class="gantt-date-cell" style="width:${dayWidth}px; flex: none; display: block; height: 30px; line-height: 30px; text-align: center; box-sizing: border-box; border-right: 1px solid #eee; font-size: 10px; background-color: ${cellBg};">${dateStr}</div>`;
    }
    headerHtml += `</div>`;

    let bodyHtml = '';
    activeData.forEach(item => {
        const startDateTime = parseDateTime(item.rawStart, item.startTime);
        const endDateTime = parseDateTime(item.rawEnd, item.endTime);
        const isEnded = now > endDateTime;

        const diffStartMs = startDateTime - minDate;
        const durationMs = endDateTime - startDateTime;

        let offsetPx = (diffStartMs / msPerDay) * dayWidth;
        let widthPx = (durationMs / msPerDay) * dayWidth;

        if (offsetPx < 0) { widthPx += offsetPx; offsetPx = 0; }
        const maxPx = totalDays * dayWidth;
        if (offsetPx >= maxPx) return;
        if (offsetPx + widthPx > maxPx) widthPx = maxPx - offsetPx; 
        if (widthPx <= 0) return;

        let displayName = item.seriesName;
        if (item.guaranteed && !item.stepup && !displayName.includes("[確定]")) {
            displayName += " [確定]";
        }
        if (item.stepup && !displayName.includes("[StepUp]")) {
            displayName += " [StepUp]";
        }

        let barBgColor = '#4caf50';
        if (displayName.includes("極選抜")) barBgColor = '#e91e63';
        else if (displayName.includes("超選抜")) barBgColor = '#9c27b0';
        else if (displayName.includes("ネコ祭")) barBgColor = '#ff9800';
        else if (displayName.includes("コラボ")) barBgColor = '#2196f3';

        const durationDays = Math.max(1, Math.round(durationMs / msPerDay));
        
        // スタイル設定：行全体の不透明度は1のままにする（透過防止）
        let rowStyle = `width: ${totalWidth}px; min-width: ${totalWidth}px; display: flex; flex-wrap: nowrap; height: 30px; border-bottom: 1px solid #eee;`;
        
        // ラベル列のz-indexを10に設定（赤い線より前面）し、背景色を不透明に。文字色を中間濃度に調整
        let labelStyle = `width:${labelWidth}px; min-width:${labelWidth}px; flex: none; display: block; height: 30px; line-height: 30px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #ccc; box-sizing: border-box; position: sticky; left: 0; z-index: 10;`;
        
        // バーエリアのスタイル
        let barAreaStyle = `width: ${totalDays * dayWidth}px; flex: none; position: relative; height: 30px;`;
        
        // バー本体のスタイル
        let barStyle = `position: absolute; top: 5px; height: 20px; border-radius: 3px; color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; z-index: 2; left: ${offsetPx}px; width: ${widthPx}px; background-color: ${barBgColor}; border: 1px solid ${barBgColor};`;

        if (isEnded) {
            rowStyle += " background-color: #f9f9f9;";
            labelStyle += " background-color: #f8f9fa; color: #777;"; // 終了分は文字だけグレーに
            barAreaStyle += " opacity: 0.75;"; // 終了分はバーエリアのみを薄くする（ラベルは薄くしない）
            barStyle += " filter: grayscale(0.3); opacity: 0.8;";
        } else {
            const isGuaranteedRow = item.guaranteed && !item.stepup;
            const bg = isGuaranteedRow ? "#fff0f0" : "#fff";
            rowStyle += ` background-color: ${bg};`;
            labelStyle += ` background-color: ${bg}; color: #000;`;
        }

        bodyHtml += `
            <div class="gantt-row" style="${rowStyle}">
                <div class="gantt-label-col" style="${labelStyle}" title="${displayName} (ID:${item.id})">${displayName}</div>
                <div class="gantt-bar-area" style="${barAreaStyle}">
                    ${generateGridLines(totalDays, dayWidth, minDate)}
                    <div class="gantt-bar" style="${barStyle}">
                        <span style="font-size: 10px; line-height: 20px;">${durationDays}日間</span>
                    </div>
                    ${currentLineHtml}
                </div>
            </div>
        `;
    });

    return `
        <div class="gantt-outer-wrapper" style="width: 100%; max-width: 100%; overflow: hidden;">
            <div style="margin-bottom: 5px; text-align: right;">
                <button onclick="saveGanttImage()" class="secondary" style="font-size: 11px; padding: 4px 8px; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 4px;">画像として保存</button>
            </div>
            <div class="gantt-chart-container" style="width: 100%; max-width: 100%; overflow: hidden; border: 1px solid #ccc; background: #fff;">
                <div class="gantt-scroll-wrapper" style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
                    <div style="width: ${totalWidth}px; min-width: ${totalWidth}px; position: relative;">
                        ${headerHtml}
                        <div class="gantt-body" style="position: relative;">${bodyHtml}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateGridLines(days, width, startDate) {
    let html = '';
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        let gridBg = isWeekend ? '#f0faff' : 'transparent';
        const style = `left:${i * width}px; width:${width}px; position: absolute; top: 0; bottom: 0; border-right: 1px solid #eee; box-sizing: border-box; pointer-events: none; background-color: ${gridBg}; z-index: 0;`;
        html += `<div class="gantt-grid-line" style="${style}"></div>`;
    }
    return html;
}