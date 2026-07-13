// js/skinData.js

window.skinData = {
    nevus: {
        name: "痣 (Nevus)",
        type: "良性組織",
        emotion: "懷疑、觀察、輕度不安",
        info: "良性組織，但若形狀不對稱或邊緣改變，可能存在非典型病變風險。日常應養成每月自我檢查習慣。",
        dialogue: {
            theater: "「咦？這顆痣怎麼好像不太一樣？邊緣有點亂亂的，而且比昨天看起來好像大一點……我是不是該先觀察看看？」",
            careTip: "💡 日常護理卡提示：定期自我檢查皮膚，注意痣的大小、顏色、邊緣是否改變。",
            tasks: ["定期觀察", "每月自我檢查"]
        },
        features: { color: "#5c4033", border: "irregular-light", size: 22, type: "zoom-circle" },
        dangerTriggers: ["痣突然變大", "邊緣不規則", "顏色變深或不均"],
        warningText: "若痣持續變化，建議盡快就醫檢查。",
        score: { findAnomaly: 10, correctAction: 10, triggerAlert: 20, penalty: 0 },
        severity: "low"
    },
    melanoma: {
        name: "黑色素瘤 (Melanoma)",
        type: "高度惡性",
        emotion: "警覺、懷疑、需要快速判斷",
        info: "高度惡性。是最致命、最易轉移的皮膚癌。必須仔細觀察 ABCDE 變化（不對稱、邊緣不規則、顏色不均、直徑過大、快速進展）。",
        dialogue: {
            theater: "「這個黑點怎麼看起來有點奇怪？顏色好像不太均勻，邊邊也不是很圓。而且它是不是比前幾天更大了？這次不能只是擦藥，可能要快點檢查了。」",
            careTip: "💡 日常護理卡提示：確實做好日常防曬、定期自我檢查，密切注意新出現或持續變化中的惡性痣。",
            tasks: ["立即就醫", "需檢查"]
        },
        features: { color: "mixed", border: "highly-asymmetric", size: 35, type: "mark-compare" },
        dangerTriggers: ["新長出來的黑斑", "顏色不均", "形狀不對稱", "潰瘍、出血、久不癒合"],
        warningText: "這個病灶有高風險警訊，請盡快就醫。",
        score: { findAnomaly: 20, correctAction: 30, triggerAlert: 0, penalty: -20 },
        severity: "high"
    },
    scc: {
        name: "鱗狀細胞癌 (SCC)",
        type: "惡性皮膚癌",
        emotion: "困惑、拖延感、逐漸懷疑需要就醫",
        info: "惡性皮膚癌。常好發於陽光長期曝曬之部位，外觀看起來像小傷口或粗糙紅斑，但一直不會好。",
        dialogue: {
            theater: "「這塊皮膚怎麼一直粗粗的？像是破皮又不是破皮，還有點紅紅的。摸起來不太平，擦藥好像也沒什麼改善……這種情況不能一直拖下去吧？」",
            careTip: "💡 日常護理卡提示：保持傷口清潔，避免摩擦與抓破，密切注意是否擴大、出血或久不癒合。",
            tasks: ["持續觀察", "需就醫"]
        },
        features: { color: "#cc4444", border: "crusty", size: 30, type: "wipe-drag" },
        dangerTriggers: ["紅斑持續擴大", "傷口反覆出血", "多週不癒合", "變硬、結痂、潰瘍"],
        warningText: "若症狀持續惡化或傷口不癒合，請盡快就醫。",
        score: { findAnomaly: 10, correctAction: 20, triggerAlert: 0, penalty: -15 },
        severity: "high"
    },
    bcc: {
        name: "基底細胞癌 (BCC)",
        type: "常見惡性",
        emotion: "疑惑、觀察、慢慢意識到異常",
        info: "最常見的皮膚癌，惡性度較低但會逐漸侵蝕局部組織。外觀常呈現珍珠樣光澤、發亮的小丘疹或結節。",
        dialogue: {
            theater: "「這顆小疙瘩怎麼有點亮亮的？好像像珍珠一樣，表面還有點發亮。而且最近怎麼一直沒好？我是不是該去檢查一下？」",
            careTip: "💡 日常護理卡提示：極力避免長期日曬，多觀察臉、耳、鼻等暴露部位，注意是否持續不癒合。",
            tasks: ["防曬", "持續觀察", "記錄變化"]
        },
        features: { color: "#ccaaa0", border: "pearly-shining", size: 28, type: "zoom-detail" },
        dangerTriggers: ["珍珠樣光亮", "邊緣不清", "持續滲出", "長期不癒合", "慢慢變大"],
        warningText: "若病灶持續變化或久久不癒合，請盡快就醫。",
        score: { findAnomaly: 20, correctAction: 10, triggerAlert: 30, penalty: 0 },
        severity: "mid-high"
    }
};