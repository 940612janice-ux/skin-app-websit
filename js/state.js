// js/state.js
// 移除 export 關鍵字
window.gameState = {
    userPoints: 0,
    currentSkinIssue: null, 
    stage: 0               
};

window.animateAddPoints = function(amount) {
    const navPointsEl = document.getElementById('nav-points');
    const containerEl = document.getElementById('points-container');
    
    let startValue = gameState.userPoints;
    gameState.userPoints += amount;
    let endValue = gameState.userPoints;
    
    let duration = 800; 
    let startTime = null;

    containerEl.classList.add('pulse-glow');
    setTimeout(() => {
        containerEl.classList.remove('pulse-glow');
    }, 600);

    function rollNumber(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = timestamp - startTime;
        let rate = Math.min(progress / duration, 1);
        
        let currentValue = Math.floor(startValue + (endValue - startValue) * rate);
        navPointsEl.innerText = currentValue;

        if (rate < 1) {
            requestAnimationFrame(rollNumber);
        } else {
            navPointsEl.innerText = endValue;
        }
    }
    
    requestAnimationFrame(rollNumber);
};

window.resetGameState = function() {
    gameState.currentSkinIssue = null;
};