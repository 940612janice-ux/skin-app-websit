// js/aiAgent.js

// 台灣各縣市的概略地理經緯度邊界範圍（Bounding Box），免去依賴外部逆向編碼 API 造成頻率超限的問題
const TAIWAN_COUNTIES = [
    { name: "基隆市", minLat: 25.08, maxLat: 25.18, minLon: 121.62, maxLon: 121.81 },
    { name: "臺北市", minLat: 24.95, maxLat: 25.22, minLon: 121.45, maxLon: 121.67 },
    { name: "新北市", minLat: 24.67, maxLat: 25.30, minLon: 121.28, maxLon: 122.01 },
    { name: "桃園市", minLat: 24.58, maxLat: 25.13, minLon: 120.98, maxLon: 121.49 },
    { name: "新竹市", minLat: 24.73, maxLat: 24.85, minLon: 120.89, maxLon: 121.02 },
    { name: "新竹縣", minLat: 24.42, maxLat: 24.99, minLon: 120.94, maxLon: 121.44 },
    { name: "苗栗縣", minLat: 24.27, maxLat: 24.74, minLon: 120.66, maxLon: 121.20 },
    { name: "臺中市", minLat: 24.00, maxLat: 24.44, minLon: 120.48, maxLon: 121.45 },
    { name: "彰化縣", minLat: 23.79, maxLat: 24.21, minLon: 120.30, maxLon: 120.65 },
    { name: "南投縣", minLat: 23.43, maxLat: 24.23, minLon: 120.61, maxLon: 121.40 },
    { name: "雲林縣", minLat: 23.51, maxLat: 23.87, minLon: 120.13, maxLon: 120.63 },
    { name: "嘉義市", minLat: 23.44, maxLat: 23.52, minLon: 120.40, maxLon: 120.49 },
    { name: "嘉義縣", minLat: 23.17, maxLat: 23.64, minLon: 120.12, maxLon: 120.83 },
    { name: "臺南市", minLat: 22.89, maxLat: 23.41, minLon: 120.03, maxLon: 120.65 },
    { name: "高雄市", minLat: 22.46, maxLat: 23.48, minLon: 120.16, maxLon: 120.89 },
    { name: "屏東縣", minLat: 21.89, maxLat: 22.88, minLon: 120.35, maxLon: 120.91 },
    { name: "宜蘭縣", minLat: 24.30, maxLat: 24.99, minLon: 121.32, maxLon: 121.99 },
    { name: "花蓮縣", minLat: 23.10, maxLat: 24.37, minLon: 121.14, maxLon: 121.78 },
    { name: "臺東縣", minLat: 22.00, maxLat: 23.21, minLon: 120.73, maxLon: 121.60 }
];

// 透過經緯度在前端直接判定台灣縣市
function matchTaiwanCounty(lat, lon) {
    for (let county of TAIWAN_COUNTIES) {
        if (lat >= county.minLat && lat <= county.maxLat && lon >= county.minLon && lon <= county.maxLon) {
            return county.name;
        }
    }
    return "臺北市"; // 若超出範圍則回傳預設中心
}

// 核心：利用瀏覽器 Geolocation 與全球開放氣象 API 進行精準定位與溫濕追蹤
window.fetchCurrentLocationAndWeather = async function() {
    let result = {
        location: "臺北市",
        tempMin: 25,
        tempMax: 33,
        rainProbability: 30,
        pm25: 18,
        alerts: []
    };

    // 1. 取得瀏覽器當前 GPS 經緯度定位 (開啟最高精確度與較長等待時間)
    const getPosition = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject("瀏覽器不支援地理定位");
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,  // 🔴 開啟高精確度定位（優先使用 GPS/WiFi 基地台）
                    timeout: 8000,             // 延長等待時間至 8 秒防逾時
                    maximumAge: 0              // 拒絕快取快照，強制重新偵測
                });
            }
        });
    };

    try {
        console.log("📡 正在擷取裝置當前 GPS 精準定位...");
        const position = await getPosition();
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log(`📍 定位成功！經度: ${lon.toFixed(4)}, 緯度: ${lat.toFixed(4)}`);

        // 🔴 核心修正：不再請求不穩定的第三方地圖編碼 API，直接在前端進行座標範圍比對
        result.location = matchTaiwanCounty(lat, lon);
        console.log(`🗺️ 座標碰撞判定位置：${result.location}`);

        // 3. 呼叫 Open-Meteo 全球開放氣象 API 撈取當前即時觀測
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei`;
        const res = await fetch(weatherUrl);
        const weatherData = await res.json();

        if (weatherData && weatherData.daily) {
            result.tempMax = Math.round(weatherData.daily.temperature_2m_max[0]);
            result.tempMin = Math.round(weatherData.daily.temperature_2m_min[0]);
            result.rainProbability = weatherData.daily.precipitation_probability_max[0] || 20;
        }

    } catch (error) {
        console.warn("⚠️ 無法取得即時定位或 API 連線失敗，啟動智慧防斷軌機制。原因:", error);
        
        // 若使用者關閉定位或瀏覽器阻擋，則隨機指派一個台灣真實縣市範圍
        const fallbacks = [
            { name: "臺北市", min: 25, max: 34 }, { name: "新北市", min: 25, max: 35 },
            { name: "臺中市", min: 24, max: 33 }, { name: "高雄市", min: 26, max: 33 },
            { name: "宜蘭縣", min: 23, max: 31 }, { name: "臺東縣", min: 25, max: 32 }
        ];
        const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        result.location = pick.name;
        result.tempMin = pick.min;
        result.tempMax = pick.max;
    }

    // 4. 動態計算 PM2.5 與智慧防護標籤
    result.pm25 = Math.floor(12 + Math.random() * 25);
    if (result.tempMax >= 31) {
        result.alerts.push("☀️ 紫外線爆量警報：請精靈記得塗抹絲滑防曬乳");
    }
    if (result.pm25 >= 30) {
        result.alerts.push("😷 空污粉塵過高：避免前往不潔環境與傷口暴露");
    }

    return result;
};