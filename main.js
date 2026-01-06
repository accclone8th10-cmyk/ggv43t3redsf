const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Thông số cấu hình từ bộ nhớ hệ thống của bạn
const CONFIG = {
    INFINITY_RADIUS: 13,
    SPEED_MULTIPLIER: 3 
};

// Cấu hình cảnh giới chuyên sâu cho Idle
const levels = [
    { name: "Luyện Khí", need: 100, color: "#4facfe", gain: 20 },
    { name: "Trúc Cơ", need: 500, color: "#00ff88", gain: 50 },
    { name: "Kim Đan", need: 2000, color: "#f6d365", gain: 150 },
    { name: "Nguyên Anh", need: 10000, color: "#ff0844", gain: 500 }
];

let player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    size: 35,
    linhKhi: 0,
    level: 0,
    angle: 0
};

// --- FIX: Thêm Resize xử lý méo màn hình ---
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
});
window.dispatchEvent(new Event('resize'));

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") tryBreakthrough();
});

function tryBreakthrough() {
    const current = levels[player.level];
    if (current && player.linhKhi >= current.need) {
        player.linhKhi = 0;
        player.level++;
        canvas.style.filter = "brightness(2)"; // Hiệu ứng lóe sáng
        setTimeout(() => canvas.style.filter = "brightness(1)", 200);
    }
}

function update(dt) {
    const current = levels[player.level] || levels[levels.length - 1];
    // Tốc độ tăng linh khí dựa trên cảnh giới * multiplier hệ thống
    player.linhKhi += dt * current.gain * CONFIG.SPEED_MULTIPLIER;
    player.angle += dt * 1.5; // Tốc độ xoay aura

    // Cập nhật UI
    const progress = document.getElementById("progress");
    document.getElementById("level-name").innerText = `Cảnh giới: ${current.name}`;
    document.getElementById("spirit-count").innerText = Math.floor(player.linhKhi);
    progress.style.width = Math.min((player.linhKhi / current.need) * 100, 100) + "%";
    progress.style.background = current.color;
    progress.style.boxShadow = `0 0 10px ${current.color}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentLevel = levels[player.level] || levels[levels.length-1];

    // --- FIX: Vòng sáng xoay cho "đã tu" ---
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    ctx.beginPath();
    ctx.strokeStyle = currentLevel.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 15]); // Tạo nét đứt cho vòng xoay linh khí
    ctx.arc(0, 0, player.size + CONFIG.INFINITY_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    
    // Nhân vật trung tâm
    ctx.rotate(-player.angle * 1.5); // Xoay ngược lại cho nhân vật
    ctx.fillStyle = "white";
    ctx.shadowBlur = 20;
    ctx.shadowColor = currentLevel.color;
    ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
    ctx.restore();
}

let lastTime = 0;
function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
