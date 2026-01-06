// --- KHỞI TẠO TÀI NGUYÊN ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapImg = new Image(); mapImg.src = 'map.png';
const mobImg = new Image(); mobImg.src = 'mob.png'; // Cậu thêm ảnh quái vào đây nhé

const realms = [
    { name: "Luyện Khí", need: 100, absorb: 1.5, color: "#4facfe", atk: 30 },
    { name: "Trúc Cơ", need: 800, absorb: 4.0, color: "#00ff88", atk: 70 },
    { name: "Kim Đan", need: 3500, absorb: 10.0, color: "#f6d365", atk: 180 }
];

let player = {
    x: 1250, y: 1250, speed: 350,
    linhKhi: 0, realm: 0, hp: 100, maxHp: 100,
    mode: "BE_QUAN", lastShot: 0, shootDelay: 150
};

let bullets = [];
let mobs = [];
const keys = {};
const WORLD_SIZE = 2500;

// --- LOGIC NÚT BẤM THÔNG MINH ---
function toggleMode() {
    const btn = document.getElementById('btn-toggle-mode');
    if (player.mode === "BE_QUAN") {
        player.mode = "HANH_TAU";
        btn.innerText = "BẾ QUAN"; // Đổi tên nút
        spawnMobs(20);
    } else {
        player.mode = "BE_QUAN";
        btn.innerText = "HÀNH TẨU"; // Đổi tên nút
        mobs = [];
        player.x = canvas.width/2; player.y = canvas.height/2;
    }
    document.getElementById('display-state').innerText = (player.mode === "BE_QUAN" ? "Đang tọa thiền" : "Đang hành tẩu");
}

// --- HỆ THỐNG ĐỘT PHÁ (SỬA LỖI) ---
function tryBreakthrough() {
    const currentRealmNeed = realms[player.realm].need;
    if (player.linhKhi >= currentRealmNeed) {
        player.linhKhi = 0; // Reset linh khí sau khi đột phá
        player.realm = Math.min(player.realm + 1, realms.length - 1);
        player.maxHp += 250;
        player.hp = player.maxHp;
        
        // Hiệu ứng chấn động màn hình
        canvas.style.transform = "scale(1.05)";
        setTimeout(() => canvas.style.transform = "scale(1)", 100);
        console.log("Đột phá thành công lên: " + realms[player.realm].name);
    } else {
        console.log("Chưa đủ linh khí để đột phá!");
    }
}

// --- QUÁI VẬT ĐUỔI THEO ---
function updateMobs(dt) {
    mobs.forEach(m => {
        // Quái tự tìm đường đến người chơi
        const dist = Math.hypot(player.x - m.x, player.y - m.y);
        if (dist < 800) { // Chỉ đuổi khi ở gần
            const angle = Math.atan2(player.y - m.y, player.x - m.x);
            m.x += Math.cos(angle) * m.speed * dt;
            m.y += Math.sin(angle) * m.speed * dt;
        }
        // Gây sát thương nếu chạm người chơi
        if (dist < 40) {
            player.hp -= 0.5; // Trừ máu theo thời gian chạm
        }
    });
}

// --- VỆT SÁNG (ĐẠN) BAY ---
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life--;

        // Va chạm quái
        mobs.forEach((m, mi) => {
            if (Math.hypot(b.x - m.x, b.y - m.y) < 35) {
                m.hp -= realms[player.realm].atk;
                bullets.splice(i, 1);
                if (m.hp <= 0) {
                    mobs.splice(mi, 1);
                    player.linhKhi += 25;
                    spawnMobs(mobs.length + 1);
                }
            }
        });
        if (b.life <= 0) bullets.splice(i, 1);
    }
}

// --- VÒNG LẶP CHÍNH ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player.mode === "HANH_TAU") {
        ctx.save();
        let camX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_SIZE - canvas.width));
        let camY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_SIZE - canvas.height));
        ctx.translate(-camX, -camY);

        // Vẽ Map
        if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, WORLD_SIZE, WORLD_SIZE);

        // Vẽ Quái (Có hình ảnh)
        mobs.forEach(m => {
            if (mobImg.complete) ctx.drawImage(mobImg, m.x-25, m.y-25, 50, 50);
            else { ctx.fillStyle = "red"; ctx.beginPath(); ctx.arc(m.x, m.y, 25, 0, Math.PI*2); ctx.fill(); }
        });

        // Vẽ Nhân vật
        ctx.fillStyle = "white"; ctx.fillRect(player.x-20, player.y-20, 40, 40);
        
        // Vẽ Đạn (Có đuôi trail)
        bullets.forEach(b => {
            ctx.strokeStyle = b.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - b.vx*0.05, b.y - b.vy*0.05); ctx.stroke();
        });
        ctx.restore();
    } else {
        // Giao diện bế quan (như cũ nhưng mượt hơn)
        ctx.fillStyle = "#02040a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = realms[player.realm].color; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 110 + Math.sin(Date.now()/200)*10, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = "white"; ctx.fillRect(canvas.width/2-20, canvas.height/2-20, 40, 40);
    }

    updateLogic();
    requestAnimationFrame(draw);
}

function updateLogic() {
    const dt = 1/60;
    const r = realms[player.realm];
    
    // Nạp linh khí
    let gain = r.absorb * (player.mode === "BE_QUAN" ? 12 : 1.2);
    player.linhKhi += gain * dt;
    
    // UI
    document.getElementById("display-realm").innerText = r.name;
    document.getElementById("progress-bar").style.width = Math.min(100, (player.linhKhi/r.need)*100) + "%";
    document.getElementById("hp-bar").style.width = (player.hp/player.maxHp)*100 + "%";
    document.getElementById("speed-tag").innerText = `+${gain.toFixed(1)}/s`;

    if (player.mode === "HANH_TAU") {
        movePlayer(dt);
        updateMobs(dt);
        updateBullets(dt);
    }
}

function spawnMobs(count) {
    for(let i=0; i<count; i++) {
        mobs.push({
            x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE,
            hp: 60, maxHp: 60, speed: 100 + Math.random()*50
        });
    }
}

function movePlayer(dt) {
    if (keys["w"]) player.y = Math.max(0, player.y - player.speed * dt);
    if (keys["s"]) player.y = Math.min(WORLD_SIZE, player.y + player.speed * dt);
    if (keys["a"]) player.x = Math.max(0, player.x - player.speed * dt);
    if (keys["d"]) player.x = Math.min(WORLD_SIZE, player.x + player.speed * dt);
}

// Bắn đạn
canvas.addEventListener("mousedown", (e) => {
    const now = Date.now();
    if (player.mode === "HANH_TAU" && now - player.lastShot > player.shootDelay) {
        const camX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_SIZE - canvas.width));
        const camY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_SIZE - canvas.height));
        const angle = Math.atan2(e.clientY + camY - player.y, e.clientX + camX - player.x);
        bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle)*800, vy: Math.sin(angle)*800, life: 60, color: realms[player.realm].color });
        player.lastShot = now;
    }
});

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.addEventListener("resize", () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
draw();
