// js/companion.js — 療癒小夥伴

const COMPANION_CHATTER = [
    "今天也要好好照顧皮膚喔 🌿",
    "嗯～這個決定不錯！",
    "加油加油～你可以的！",
    "嘿嘿，我好喜歡跟你一起玩～",
    "你選對了！好厲害 ✨",
    "不要擔心，慢慢來～",
    "我們一起守護皮膚健康吧 💚",
    "你專心的樣子好棒！",
    "嘻，戳我幹嘛～",
    "嗯？發現什麼了嗎？",
    "今天天氣真好，適合護膚～",
    "我轉～我轉～我轉轉轉！",
    "你點我這麼多次，是不是很喜歡我啊？",
    "好睏……但我會陪你的 💤",
    "咿！嚇我一跳！"
];

const COMPANION_EMOJIS = ["🌸", "✨", "💚", "🌟", "💕", "🌀", "⭐", "❤️"];

window.Companion = {
    init() {
        this.body = document.getElementById('companion-body');
        this.bubble = document.getElementById('companion-bubble');
        this.bubbleText = document.getElementById('companion-text');
        this.emojiEl = document.getElementById('companion-emoji');
        this.leftPupil = document.getElementById('left-pupil');
        this.rightPupil = document.getElementById('right-pupil');
        this.companion = document.getElementById('companion');
        this.isRolling = false;

        this.trackMouse();
        this.companion.addEventListener('click', (e) => this.onClick(e));
    },

    trackMouse() {
        document.addEventListener('mousemove', (e) => {
            const rect = this.companion.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const angle = Math.atan2(dy, dx);
            const maxDist = 4;
            const moveX = Math.cos(angle) * maxDist;
            const moveY = Math.sin(angle) * maxDist;
            const dist = Math.hypot(dx, dy);
            const strength = Math.min(dist / 200, 1);
            const finalX = moveX * strength;
            const finalY = moveY * strength;
            this.leftPupil.style.transform = `translate(${finalX}px, ${finalY}px)`;
            this.rightPupil.style.transform = `translate(${finalX}px, ${finalY}px)`;
        });
    },

    onClick(e) {
        // 漣漪效果
        const ripple = document.createElement('div');
        ripple.className = 'companion-ripple';
        this.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        const rand = Math.random();

        if (rand < 0.3) {
            // 翻滾！
            this.doRoll();
        } else if (rand < 0.6) {
            // 碎碎念
            this.sayRandom();
        } else {
            // 表情反應 + 音效
            this.reactWithEmoji();
        }

        // 隨機 ASMR 音效
        this.playRandomAsmr();
    },

    doRoll() {
        if (this.isRolling) return;
        this.isRolling = true;
        this.companion.classList.add('companion-rolling');
        this.say("我轉～我轉～我轉轉轉！");
        setTimeout(() => {
            this.companion.classList.remove('companion-rolling');
            this.hideBubble();
            this.isRolling = false;
        }, 700);
    },

    sayRandom() {
        const msg = COMPANION_CHATTER[Math.floor(Math.random() * COMPANION_CHATTER.length)];
        this.say(msg);
        setTimeout(() => this.hideBubble(), 2500);
    },

    say(text) {
        this.bubbleText.innerText = text;
        this.bubble.classList.remove('hidden');
    },

    hideBubble() {
        this.bubble.classList.add('hidden');
    },

    reactWithEmoji() {
        this.companion.classList.add('companion-happy');
        const emoji = COMPANION_EMOJIS[Math.floor(Math.random() * COMPANION_EMOJIS.length)];
        this.emojiEl.innerText = emoji;
        this.emojiEl.classList.remove('hidden');
        setTimeout(() => {
            this.companion.classList.remove('companion-happy');
            this.emojiEl.classList.add('hidden');
        }, 800);
    },

    playRandomAsmr() {
        try {
            if (!window.AudioEngine) return;
            const sounds = ['playBellSound', 'playCorrectPop', 'playTinkSound', 'playSparkleSound', 'playSuccessDing'];
            const pick = sounds[Math.floor(Math.random() * sounds.length)];
            window.AudioEngine[pick]();
        } catch(e) {}
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.Companion.init();
});
