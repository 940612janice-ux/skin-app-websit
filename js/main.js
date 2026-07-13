// js/main.js

let currentPickedKey = null;      // 本關卡正確病症 Key
let currentIssueData = null;     // 本關卡病症資料
let selectedCareTasks = new Set(); // 記錄玩家選取的防護策略
let isDisclaimerAccepted = false; // 是否已按下第一關的確認
let wrongAttempts = 0;           // 第2關答錯次數
const WRONG_HINTS = [
    "再仔細聽聽細胞的心聲，注意描述中的關鍵症狀…",
    "想想看：這個描述聽起來像良性還是惡性的狀況？",
    "線索提示：注意病灶的顏色、形狀、邊緣、以及變化的速度。"
];

let canvasCtx = null;
let canvasScale = 1.0;
let interactionPoints = [];
let lastPickedKey = null;

let lastWipeSoundTime = 0;
const AUDIO_THROTTLE_MS = 150;

/**
 * 核心換頁引擎（切換 1 ~ 5 頁面）
 */
window.switchPage = function(pageNumber) {
    console.log(`🧭 切換至第 ${pageNumber} 頁面`);
    
    // 隱藏所有頁面
    for (let i = 1; i <= 5; i++) {
        const page = document.getElementById(`page-${i}`);
        if (page) page.classList.add('id-hidden');
    }
    
    // 顯示指定頁面
    const targetPage = document.getElementById(`page-${pageNumber}`);
    if (targetPage) targetPage.classList.remove('id-hidden');

    // 進入特定頁面的專屬初始化觸發器
    if (pageNumber === 4) {
        setTimeout(() => {
            initCanvas();
            generateMockPoints();
            drawCanvas();
        }, 50); // 確保 DOM 渲染完畢再抓取畫布
    }
};

/**
 * ==========================================
 * 第一關：免責聲明與環境感知
 * ==========================================
 */
window.handlePage1Action = async function() {
    // 1. 處理第一次點擊：授權環境感知 + 解鎖環境資訊顯示
    if (!isDisclaimerAccepted) {
        isDisclaimerAccepted = true;
        const envBox = document.getElementById('p1-env-box');
        if (envBox) envBox.classList.remove('hidden');
        
        const actionBtn = document.getElementById('p1-action-btn');
        if (actionBtn) actionBtn.innerText = "🌱 進入皮膚護理生態球 ➔";

        // ✨ 觸發定位與天氣（現在是在點擊動作內，瀏覽器會彈出授權視窗）
        try {
            if (window.fetchCurrentLocationAndWeather) {
                const weather = await window.fetchCurrentLocationAndWeather();
                const cityEl = document.getElementById('env-city');
                const tempEl = document.getElementById('env-temp');
                const uvEl = document.getElementById('env-uv-tip');
                
                if (cityEl) cityEl.innerText = weather.location || "療癒生態區";
                if (tempEl) tempEl.innerText = `${weather.tempMin || 22}°C ~ ${weather.tempMax || 30}°C`;
                if (uvEl) {
                    uvEl.innerText = weather.rainProbability > 50 ? "🌧️ 當前降雨機率高，記得防潮" : "☀️ 紫外線常態，加強防護！";
                }
            }
        } catch(err) {
            console.warn("定位授權被拒，使用預設氣候參數");
        }

        try { if (window.AudioEngine) window.AudioEngine.playBellSound(); } catch(e){}
    } 
    // 2. 處理第二次點擊：正式進入遊戲
    else {
        startNewEcosystemGame();
    }
};

/**
 * 開始全新局：隨機抽取題目並導向第二關
 */
function startNewEcosystemGame() {
    const keys = Object.keys(window.skinData || {});
    let filteredKeys = keys.filter(k => k !== lastPickedKey);
    if (!filteredKeys.length) filteredKeys = keys; 
    
    currentPickedKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
    lastPickedKey = currentPickedKey;
    currentIssueData = window.skinData[currentPickedKey];

    console.log(`🎰 本輪生態球核心鎖定為：${currentIssueData.name}`);

    // 重置全局資料與狀態
    selectedCareTasks.clear();
    wrongAttempts = 0;
    
    // 渲染第二關：心理劇場文字與選項按鈕
    document.getElementById('theater-dialogue-text').innerText = currentIssueData.dialogue?.theater || "「感覺細胞內部有些異常波動……」";
    const errorTip = document.getElementById('p2-error-tip');
    if (errorTip) errorTip.classList.add('hidden');
    const hintArea = document.getElementById('p2-hint-area');
    if (hintArea) hintArea.classList.add('hidden');

    const btnContainer = document.getElementById('identification-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = "";
        keys.forEach(key => {
            const item = window.skinData[key];
            const displayName = item.name.split(' ')[0];
            const typeLabel = item.type === "高度惡性" || item.type === "惡性皮膚癌" || item.type === "常見惡性" ? "⚠️惡性" : "✅良性";
            btnContainer.innerHTML += `
                <button onclick="window.checkIdentification('${key}')" 
                        data-key="${key}"
                        class="ident-btn bg-white/80 border border-amber-200/80 hover:bg-amber-100 text-gray-700 text-[11px] font-bold py-2.5 px-1 rounded-xl transition active:scale-95 truncate">
                    ${displayName}
                    <span class="block text-[9px] font-normal opacity-60">${typeLabel}</span>
                </button>
            `;
        });
    }

    // 渲染第三關預備內容
    document.getElementById('p3-title').innerText = `🔬 鑑定標本：${currentIssueData.name} (${currentIssueData.type})`;
    document.getElementById('p3-info').innerText = currentIssueData.info;
    document.getElementById('p3-care-tip').innerText = currentIssueData.dialogue?.careTip || "";

    // 渲染第五關預備內容（風險提醒）
    document.getElementById('p5-warning-text').innerText = `🚨 醫學指引核心提示：${currentIssueData.warningText}`;
    const dangerBox = document.getElementById('p5-danger-triggers');
    if (dangerBox) {
        dangerBox.innerHTML = "<span class='font-bold text-gray-700'>⚠️ 具備危險誘發因子包括：</span><br>";
        (currentIssueData.dangerTriggers || []).forEach(t => {
            dangerBox.innerHTML += `• ${t}<br>`;
        });
    }

    // 重置第四關 Canvas 頁面組件狀態
    const p4Btn = document.getElementById('p4-next-btn');
    if (p4Btn) { p4Btn.disabled = true; p4Btn.classList.add('opacity-40', 'pointer-events-none'); }
    const p4TaskBox = document.getElementById('p4-task-box');
    if (p4TaskBox) p4TaskBox.classList.add('hidden');
    document.getElementById('microscope-tip').innerText = "🔬 請點擊鎖定中央病灶的核心，以進行細胞阻斷鑑定";
    document.getElementById('microscope-tip').className = "text-[10px] text-gray-500 font-bold animate-pulse";

    // 🚀 前往第二關
    window.switchPage(2);
}

/**
 * ==========================================
 * 第二關：心理劇場判別答案
 * ==========================================
 */
window.checkIdentification = function(selectedKey) {
    const errorTip = document.getElementById('p2-error-tip');
    const hintArea = document.getElementById('p2-hint-area');
    const hintText = document.getElementById('p2-hint-text');
    if (selectedKey === currentPickedKey) {
        // 答對了！高亮正確按鈕，短暫延遲後進入第三關
        if (errorTip) errorTip.classList.add('hidden');
        if (hintArea) hintArea.classList.add('hidden');
        const correctBtn = document.querySelector(`.ident-btn[data-key="${selectedKey}"]`);
        if (correctBtn) correctBtn.classList.add('ident-btn-correct');
        try { if (window.AudioEngine) window.AudioEngine.playCorrectPop(); } catch(e){}
        setTimeout(() => window.switchPage(3), 600);
    } else {
        // 答錯了！
        wrongAttempts++;
        // 禁用點錯的按鈕，防止重複點擊
        const wrongBtn = document.querySelector(`.ident-btn[data-key="${selectedKey}"]`);
        if (wrongBtn) wrongBtn.classList.add('ident-btn-wrong');
        // 顯示錯誤提示
        if (errorTip) errorTip.classList.remove('hidden');
        // 顯示漸進提示
        if (hintArea && hintText) {
            const hintIndex = Math.min(wrongAttempts - 1, WRONG_HINTS.length - 1);
            hintText.innerText = WRONG_HINTS[hintIndex];
            hintArea.classList.remove('hidden');
        }
        try { if (window.AudioEngine) window.AudioEngine.playWipeSound(); } catch(e){}
    }
};

/**
 * ==========================================
 * 第四關：顯微鏡病灶互動 (Canvas + 護理任務)
 * ==========================================
 */
function initCanvas() {
    const canvas = document.getElementById('microscope-canvas');
    if (!canvas) return;
    canvasCtx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvasCtx.scale(dpr, dpr);
    canvasScale = dpr;

    // 綁定點擊事件 (點擊鎖定核心法)
    canvas.onclick = function(e) {
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        // 檢查是否點到中央大病灶核心粒子 (核心位於 interactionPoints[0])
        const p = interactionPoints[0];
        if (p && !p.identified) {
            const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
            if (dist <= p.r + 15) { // 加大判定半徑便於操作
                p.identified = true;
                handleCanvasCoreLocked();
            }
        }
    };
}

function generateMockPoints() {
    interactionPoints = [];
    if (!currentIssueData) return;

    const baseColor = currentIssueData.features?.color || "#5c4033";
    const baseSize = currentIssueData.features?.size || 20;
    const opType = currentIssueData.features?.type || "zoom-circle";

    // 核心大病灶
    interactionPoints.push({ x: 140, y: 140, r: baseSize, color: baseColor, identified: false, opType: opType });

    // 衛星小粒子
    for (let i = 0; i < 6; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = baseSize + 15 + Math.random() * 25;
        interactionPoints.push({
            x: 140 + Math.cos(angle) * dist,
            y: 140 + Math.sin(angle) * dist,
            r: 3 + Math.random() * 4,
            color: Math.random() > 0.4 ? baseColor : "#88cc88",
            identified: false,
            opType: "none"
        });
    }
}

function drawCanvas() {
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, 300, 300);
    canvasCtx.fillStyle = '#030712';
    canvasCtx.fillRect(0, 0, 300, 300);

    // 培養皿同心圓網格
    canvasCtx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    canvasCtx.lineWidth = 1;
    for(let i=30; i<300; i+=30){
        canvasCtx.beginPath(); canvasCtx.moveTo(i, 0); canvasCtx.lineTo(i, 300); canvasCtx.stroke();
        canvasCtx.beginPath(); canvasCtx.moveTo(0, i); canvasCtx.lineTo(300, i); canvasCtx.stroke();
    }

    interactionPoints.forEach((p) => {
        canvasCtx.beginPath();
        canvasCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        
        if (p.identified) {
            canvasCtx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            canvasCtx.fill();
            canvasCtx.strokeStyle = '#10b981';
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();

            // 準心繪製
            canvasCtx.strokeStyle = '#ffffff';
            canvasCtx.lineWidth = 1.5;
            canvasCtx.beginPath();
            canvasCtx.moveTo(p.x - p.r - 4, p.y); canvasCtx.lineTo(p.x + p.r + 4, p.y);
            canvasCtx.moveTo(p.x, p.y - p.r - 4); canvasCtx.lineTo(p.x, p.y + p.r + 4);
            canvasCtx.stroke();
        } else {
            canvasCtx.fillStyle = p.color;
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = p.color;
            canvasCtx.fill();
            
            // 特異法視覺提示
            if (p.opType === "zoom-circle") {
                canvasCtx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
                canvasCtx.lineWidth = 1;
                canvasCtx.setLineDash([4, 4]);
                canvasCtx.beginPath(); canvasCtx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2); canvasCtx.stroke();
                canvasCtx.setLineDash([]);
            } else if (p.opType === "wipe-drag") {
                canvasCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                canvasCtx.lineWidth = 1.5;
                canvasCtx.beginPath(); canvasCtx.arc(p.x, p.y, p.r + 6, Math.PI * 0.25, Math.PI * 1.25); canvasCtx.stroke();
            }
        }
        canvasCtx.shadowBlur = 0;
    });
}

function handleCanvasCoreLocked() {
    drawCanvas();
    try { if (window.AudioEngine) window.AudioEngine.playBellSound(); } catch(e){}

    document.getElementById('microscope-tip').innerText = "🎯 異常細胞防禦雷射已鎖定！請指派下方護理日常卡";
    document.getElementById('microscope-tip').className = "text-[10px] text-emerald-600 font-bold animate-none";

    const taskBox = document.getElementById('p4-task-box');
    const taskContainer = document.getElementById('p4-care-tasks');
    if (taskBox && taskContainer) {
        taskBox.classList.remove('hidden');
        taskContainer.innerHTML = "";
        
        const tasks = currentIssueData.dialogue?.tasks || ["定期自我檢查"];
        tasks.forEach((task, idx) => {
            taskContainer.innerHTML += `
                <button id="p4-t-btn-${idx}" onclick="window.toggleP4Task('${task}', 'p4-t-btn-${idx}')"
                        class="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-1 px-2.5 rounded-lg transition">
                    ➕ ${task}
                </button>
            `;
        });
    }

    const p4Btn = document.getElementById('p4-next-btn');
    if (p4Btn) { p4Btn.disabled = false; p4Btn.classList.remove('opacity-40', 'pointer-events-none'); }
}

window.toggleP4Task = function(taskName, btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const now = Date.now();

    if (selectedCareTasks.has(taskName)) {
        selectedCareTasks.delete(taskName);
        btn.className = "bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-1 px-2.5 rounded-lg transition";
        btn.innerText = `➕ ${taskName}`;
    } else {
        selectedCareTasks.add(taskName);
        btn.className = "bg-emerald-50 border border-emerald-500 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded-lg transition";
        btn.innerText = `✅ ${taskName}`;
        
        if (now - lastWipeSoundTime > AUDIO_THROTTLE_MS) {
            try { if (window.AudioEngine) window.AudioEngine.playWipeSound(); } catch(e){}
            lastWipeSoundTime = now;
        }
    }
};

/**
 * ==========================================
 * 第五關：大決策防禦、多維度分數與結算
 * ==========================================
 * 修正點：將相容的舊名稱與可能導致 JS 爆錯的 DOM 動畫保護機制補上
 */
window.submitDecision = function(choice) { window.submitFinalDecision(choice); }; // 相容舊對接呼叫

window.submitFinalDecision = function(choice) {
    if (!currentIssueData) return;

    // 隱藏決策按鈕群
    document.getElementById('decision-buttons-group').classList.add('hidden');

    // 核心判定邏輯
    const isCorrect = (currentIssueData.severity === 'low' && choice === 'home') || 
                      (currentIssueData.severity === 'high' && choice === 'hospital');

    // 多維度積分計算公式
    let scoreFind = currentIssueData.score?.findAnomaly || 10;
    let scoreAction = isCorrect ? (currentIssueData.score?.correctAction || 10) : (currentIssueData.score?.penalty || 0);
    let scoreAlert = (choice === 'hospital') ? (currentIssueData.score?.triggerAlert || 0) : 0;
    let totalRoundPoints = Math.max(0, scoreFind + scoreAction + scoreAlert);

    // 呼叫外部滾動分數動畫（加入安全閥，防止舊格式抓取 points-container 失敗中斷程式）
    try {
        if (window.animateAddPoints) {
            // 防禦性檢查：如果沒有這個容器就偽造一個臨時物件，避免舊 state.js 報錯卡死
            if (!document.getElementById('points-container')) {
                const dummy = document.createElement('div');
                dummy.id = 'points-container';
                document.body.appendChild(dummy);
            }
            window.animateAddPoints(totalRoundPoints);
        }
    } catch (err) {
        console.warn("分數動畫閃爍保護觸發：", err);
    }

    // 顯示清算明細報告面板
    const reportBox = document.getElementById('settlement-report');
    if (reportBox) {
        reportBox.classList.remove('hidden');
        reportBox.innerHTML = `
            <h4 class="text-xs font-black ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}">
                ${isCorrect ? '🌿 生態防禦決策完全正確！' : '⚠️ 生態防禦防線輕度受阻'}
            </h4>
            <div class="text-[9px] text-gray-500 font-mono space-y-0.5 pt-1">
                <div>+ 發現病灶異常分 (findAnomaly): ${scoreFind} Mpts</div>
                <div>+ 終極決策防禦分 (correctAction/Penalty): ${scoreAction} Mpts</div>
                <div>+ 醫療警報觸發權重 (triggerAlert): ${scoreAlert} Mpts</div>
                <div class="border-t pt-1 font-black text-emerald-700 text-[10px]">🏆 本輪共獲修護量能：+${totalRoundPoints} Mpts</div>
            </div>
        `;
    }

    // 顯示下一輪進化按鈕
    document.getElementById('next-cycle-group').classList.remove('hidden');

    try { if (window.AudioEngine) window.AudioEngine.playSuccessDing(); } catch(e){}
};

/**
 * 重新啟動下一大輪
 */
window.restartEcosystemCycle = function() { window.restartWholeCycle(); }; // 相容相依性

window.restartWholeCycle = function() {
    document.getElementById('decision-buttons-group').classList.remove('hidden');
    document.getElementById('settlement-report').classList.add('hidden');
    document.getElementById('next-cycle-group').classList.add('hidden');

    // 從第二關重新抽題開始循環！
    startNewEcosystemGame();
};

// 頁面初始化時，只切換頁面，不請求任何敏感 API
document.addEventListener("DOMContentLoaded", () => {
    window.switchPage(1);
    console.log("✅ 系統已啟動，等待點擊...");
});

// 統一管理天氣顯示的函式 (不會自動觸發，只在手動呼叫時執行)
function updateWeatherUI(weather) {
    const cityEl = document.getElementById('env-city');
    const tempEl = document.getElementById('env-temp');
    const uvEl = document.getElementById('env-uv-tip');

    if (cityEl) cityEl.innerText = weather.location || "療癒生態區";
    if (tempEl) tempEl.innerText = `${weather.tempMin || 22}°C ~ ${weather.tempMax || 30}°C`;
    if (uvEl) {
        uvEl.innerText = (weather.rainProbability > 50) 
            ? "🌧️ 降雨機率高，請防潮" 
            : "☀️ 紫外線常態，加強防護！";
    }
}

// 這是唯一的觸發入口，由 index.html 的按鈕 onclick 呼叫
window.handleConsentClick = async function() {
    // 1. 關閉免責頁面
    const modal = document.getElementById('disclaimer-modal');
    if (modal) modal.classList.add('hidden');
    
    // 2. 切換頁面
    window.switchPage(1);

    // 3. 獲取資料
    try {
        console.log("🌦️ 使用者點擊，嘗試定位中...");
        if (window.fetchCurrentLocationAndWeather) {
            const weather = await window.fetchCurrentLocationAndWeather();
            updateWeatherUI(weather);
        }
    } catch (err) {
        console.warn("⚠️ 定位失敗，自動載入預設值");
        updateWeatherUI({ location: "臺灣", tempMin: 25, tempMax: 30, rainProbability: 20 });
    }
};


// 統一管理天氣顯示的函式

function updateWeatherUI(weather) {

    const cityEl = document.getElementById('env-city');

    const tempEl = document.getElementById('env-temp');

    const uvEl = document.getElementById('env-uv-tip');



    if (cityEl) cityEl.innerText = weather.location || "療癒生態區";

    if (tempEl) tempEl.innerText = `${weather.tempMin || 22}°C ~ ${weather.tempMax || 30}°C`;

    if (uvEl) {

        uvEl.innerText = weather.rainProbability > 50 ? "🌧️ 降雨機率高，請防潮" : "☀️ 紫外線常態，加強防護！";

    }

}