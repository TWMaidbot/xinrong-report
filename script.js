// Firebase Initialization
// Version 1.0.0
let db = null;
if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase initialized");
    } catch (e) {
        console.error("Firebase init error:", e);
        // Using a function that will be defined later, so this might need care if called immediately
        // But this runs on load, showToast might not be ready if defined later in this file?
        // Actually functions are hoisted.
        // But showToast relies on DOM element 'toast', which must be ready. 
        // This script is usually at the bottom of body, so DOM is ready.
        // showToast is defined below.
    }
} else {
    console.log("Firebase config not found, using LocalStorage");
}

const STORAGE_KEY = 'xinrong_reports_v5';
const USER_KEY = 'xinrong_user';
const USERS_KEY = 'xinrong_users_v8';
const LAST_MACHINE_KEY = 'xinrong_last_machine'; // [NEW]

// ... (existing code)



// ... (existing code)



// 預設員工名冊
const defaultEmployees = [
    { id: 'H01', name: '吳界', role: 'admin' },
    { id: 'P02', name: '王雅惠', role: 'worker' },
    { id: 'P03', name: '葉世光', role: 'worker' },
    { id: 'P04', name: '阮氏草', role: 'worker' },
    { id: 'P06', name: '李群', role: 'worker' },
    { id: 'P07', name: '羅國維', role: 'worker' },
    { id: 'P08', name: '吳均婕', role: 'worker' },
    { id: 'P10', name: '楊子威', role: 'worker' },
    { id: 'P11', name: '陳智偉', role: 'worker' },
    { id: 'P12', name: '陳曉東', role: 'worker' },
    { id: 'P13', name: '林玉珠', role: 'worker' },
    { id: 'P14', name: '陳欽勇', role: 'worker' },
    { id: 'P17', name: '邱志祥', role: 'worker' },
    { id: 'P21', name: '羅唯瑜', role: 'worker' },
    { id: 'P23', name: '莊峻溢', role: 'worker' },
    { id: 'P24', name: '潘曉傑', role: 'worker' },
    { id: 'S01', name: '鐘議德', role: 'worker' }
];

async function getEmployees() {
    if (db) {
        try {
            const snapshot = await db.collection('users').get();
            if (!snapshot.empty) {
                const list = [];
                snapshot.forEach(doc => list.push(doc.data()));
                localStorage.setItem(USERS_KEY, JSON.stringify(list)); // 快取一份供離線用
                return list;
            }
        } catch (e) { console.error("DB Error", e); }
    }
    // Fallback to LocalStorage
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) {
        const list = JSON.parse(saved);
        // 如果列表為空 (意外清空)，則回復預設值，確保至少有管理者
        if (list && list.length > 0) return list;
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultEmployees));
    return defaultEmployees;
}
async function saveEmployees(list) {
    if (db) {
        // 全量覆蓋策略 (簡單粗暴但有效) - 實際應單筆更新
        // 這裡為了簡化 Prototype，我們先更新 LocalStorage，再非同步更新 DB
        list.forEach(u => {
            db.collection('users').doc(u.id).set(u).catch(e => console.error(e));
        });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

const MACHINES_KEY = 'xinrong_machines_v1';
// Default machines as constant for initialization
const defaultMachines = [
    { id: 'M101', name: '大剪台(上下剪)', category: '大剪台' }, { id: 'M102', name: '大剪台(甩剪)', category: '大剪台' }, { id: 'M103', name: '小剪台', category: '小剪台' },
    { id: 'M201', name: '多片機(大)', category: '多片機' }, { id: 'M202', name: '多片機(小)', category: '多片機' },
    { id: 'M301', name: '凹槽機(大)', category: '凹槽機/斜角' }, { id: 'M302', name: '凹槽機(小)', category: '凹槽機/斜角' }, { id: 'M303', name: '斜角', category: '凹槽機/斜角' },
    { id: 'M401', name: '合板機', category: '合板機' },
    { id: 'M501', name: '棧板', category: '棧板' }, { id: 'M502', name: '棧板', category: '棧板' }, { id: 'M503', name: '棧板', category: '棧板' }, { id: 'M504', name: '棧板', category: '棧板' }
];

async function getMachines() {
    if (db) {
        try {
            const snapshot = await db.collection('machines').orderBy('id').get();
            if (!snapshot.empty) {
                const list = [];
                snapshot.forEach(doc => list.push(doc.data()));
                localStorage.setItem(MACHINES_KEY, JSON.stringify(list));
                return list;
            }
        } catch (e) { console.error("DB Error", e); }
    }
    const saved = localStorage.getItem(MACHINES_KEY);
    if (saved) {
        let list = JSON.parse(saved);
        // [New] Migration: Fix old categories
        let dirty = false;
        list.forEach(m => {
            if (m.category === '剪台') {
                if (m.id === 'M103') m.category = '小剪台';
                else m.category = '大剪台';
                dirty = true;
            }
        });
        if (dirty) localStorage.setItem(MACHINES_KEY, JSON.stringify(list));
        return list;
    }
    localStorage.setItem(MACHINES_KEY, JSON.stringify(defaultMachines));
    return defaultMachines;
}



async function saveMachine(machine) {
    if (db) {
        try { await db.collection('machines').doc(machine.id).set(machine); }
        catch (e) { console.error(e); }
    }
    const list = await getMachines();
    const idx = list.findIndex(m => m.id === machine.id);
    if (idx >= 0) list[idx] = machine; else list.push(machine);
    // Sort by ID
    list.sort((a, b) => a.id.localeCompare(b.id));
    localStorage.setItem(MACHINES_KEY, JSON.stringify(list));
}

async function deleteMachine(id) {
    if (db) {
        try { await db.collection('machines').doc(id).delete(); }
        catch (e) { console.error(e); }
    }
    let list = await getMachines();
    list = list.filter(m => m.id !== id);
    localStorage.setItem(MACHINES_KEY, JSON.stringify(list));
    return list;
}

const categoryWorkTypes = {
    '大剪台': [{ id: 'log', name: '原木', unit: '件' }, { id: 'scrap', name: '餘料', unit: '隻' }, { id: 'board_strip', name: '板材、條子', unit: '片' }, { id: 'pellet', name: '木粒', unit: '顆' }],
    '小剪台': [{ id: 'board_strip', name: '板材、條子', unit: '片' }, { id: 'pellet', name: '木粒', unit: '顆' }],
    '多片機': [{ id: 'plank', name: '板子', unit: '片' }, { id: 'strip', name: '木條', unit: '隻' }, { id: 'chip', name: '改木粒', unit: '隻' }],
    '凹槽機/斜角': [{ id: 'groove', name: '凹槽', unit: '隻' }, { id: 'bevel', name: '斜角', unit: '隻' }],
    '合板機': [{ id: 'panel', name: '面板', unit: '片' }, { id: 'slat', name: '條子', unit: '片' }],
    '棧板': [{ id: 'pallet_3legs', name: '木棧板(三隻腳)', unit: '片' }, { id: 'pallet_pellet', name: '木棧板(木粒)', unit: '片' }, { id: 'pallet_glue', name: '膠合棧板', unit: '片' }, { id: 'cover', name: '面板、蓋板', unit: '片' }, { id: 'combo_pallet', name: '組合', unit: '片' }, { id: 'box', name: '木箱', unit: '個' }, { id: 'l_angle', name: 'L 型角板', unit: '片' }]
};

async function getWorkTypesForMachine(machineId) {
    const machines = await getMachines();
    const m = machines.find(x => x.id === machineId);
    if (!m) return [];
    const cat = m.category || '剪台';
    return categoryWorkTypes[cat] || [];
}

const roleLabels = { admin: '管理者', manager: '主管', worker: '一般員工' };

let currentUser = null;
let filteredReports = [];
let selectedCoworkers = new Set();
let editingUserId = null;

// 登入相關
const loginInput = document.getElementById('login-id');
if (loginInput) {
    loginInput.addEventListener('input', function () {
        const id = this.value.toUpperCase().trim();
        getEmployees().then(employees => {
            const user = employees.find(e => e.id === id);
            const preview = document.getElementById('login-preview');
            const error = document.getElementById('login-error');

            if (user) {
                document.getElementById('preview-name').textContent = user.name;
                document.getElementById('preview-role').textContent = roleLabels[user.role] || '員工';
                preview.classList.add('show');
                error.classList.remove('show');
            } else {
                preview.classList.remove('show');
            }
        });
    });
    loginInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') doLogin(); });
}

async function doLogin() {
    // Debugging
    console.log('doLogin called');
    const idInput = document.getElementById('login-id');
    const id = idInput.value.toUpperCase().trim();
    console.log('Login attempt with ID:', id);

    if (!id) {
        showToast('請輸入工號');
        return;
    }

    try {
        const employees = await getEmployees();
        console.log('Employees loaded:', employees);
        const user = employees.find(e => e.id === id);

        if (!user) {
            console.log('User not found');
            document.getElementById('login-error').classList.add('show');
            showToast('工號不存在');
            return;
        }

        console.log('User found:', user);
        currentUser = user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        document.getElementById('current-user-name').textContent = `${user.name}（${user.id}）`;
        document.getElementById('sidebar-user-name').textContent = `${user.name}（${user.id}）`;
        updateMenuVisibility();
        showPage('home-page');
        showToast(`歡迎，${user.name}！`);
    } catch (err) {
        console.error('Login error:', err);
        alert('系統錯誤: ' + err);
    }
}

function doLogout() {
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    document.getElementById('login-id').value = '';
    document.getElementById('login-preview').classList.remove('show');
    document.getElementById('login-error').classList.remove('show');
    showPage('login-page');
}

function checkLogin() {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
        currentUser = JSON.parse(saved);
        // 確認用戶還存在
        getEmployees().then(employees => {
            const stillExists = employees.find(e => e.id === currentUser.id);
            if (stillExists) {
                currentUser = stillExists; // 更新權限
                document.getElementById('current-user-name').textContent = `${currentUser.name}（${currentUser.id}）`;
                document.getElementById('sidebar-user-name').textContent = `${currentUser.name}（${currentUser.id}）`;
                updateMenuVisibility();
            }
        });
        return true; // 先回傳 LocalStorage 的結果讓 UI 顯示
    }
    return false;
}

function updateMenuVisibility() {
    if (!currentUser) return;
    const canViewDashboard = currentUser.role === 'admin' || currentUser.role === 'manager';
    const canManageUsers = currentUser.role === 'admin';

    // Mobile Menu
    const menuDashboard = document.getElementById('menu-dashboard');
    if (menuDashboard) {
        menuDashboard.disabled = !canViewDashboard;
        menuDashboard.style.display = canViewDashboard ? '' : 'none';
    }
    const menuHistory = document.getElementById('menu-history');
    if (menuHistory) {
        menuHistory.disabled = !canViewDashboard;
        menuHistory.style.display = canViewDashboard ? '' : 'none';
    }
    const menuUsers = document.getElementById('menu-users');
    if (menuUsers) {
        menuUsers.disabled = !canManageUsers;
        menuUsers.style.display = canManageUsers ? '' : 'none';
    }
    const menuMachines = document.getElementById('menu-machines');
    if (menuMachines) {
        menuMachines.disabled = !canManageUsers;
        menuMachines.style.display = canManageUsers ? '' : 'none';
    }

    // Sidebar Menu (Desktop)
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) navDashboard.style.display = canViewDashboard ? 'flex' : 'none';
    const navHistory = document.getElementById('nav-history');
    if (navHistory) navHistory.style.display = canViewDashboard ? 'flex' : 'none';
    const navUsers = document.getElementById('nav-users');
    if (navUsers) navUsers.style.display = canManageUsers ? 'flex' : 'none';
    const navMachines = document.getElementById('nav-machines');
    if (navMachines) navMachines.style.display = canManageUsers ? 'flex' : 'none';
}

async function updateCoworkerList() {
    selectedCoworkers.clear();
    const employees = await getEmployees();
    const list = document.getElementById('coworker-list');
    list.innerHTML = employees.filter(e => e.id !== currentUser?.id && e.role !== 'admin' && e.role !== 'manager')
        .map(e => `<div class="coworker-chip" data-id="${e.id}" onclick="toggleCoworker(this)">${e.name}</div>`).join('');
}

function toggleCoworker(el) {
    const id = el.dataset.id;
    // If clicking an already selected one, deselect it
    if (selectedCoworkers.has(id)) {
        selectedCoworkers.delete(id);
        el.classList.remove('selected');
        return;
    }

    // New Logic: Single Select - Clear previous selection
    if (selectedCoworkers.size > 0) {
        selectedCoworkers.clear();
        document.querySelectorAll('.coworker-chip.selected').forEach(chip => chip.classList.remove('selected'));
    }

    selectedCoworkers.add(id);
    el.classList.add('selected');
}

function showPage(id) {
    if (id !== 'login-page' && !currentUser) { if (!checkLogin()) { showPage('login-page'); return; } }

    // 權限檢查
    if (id === 'dashboard-page' || id === 'history-page') {
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            showToast('您沒有權限查看此頁面'); return;
        }
    }
    if (id === 'users-page') {
        if (currentUser.role !== 'admin') {
            showToast('您沒有權限查看此頁面'); return;
        }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // Update Sidebar Active State
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    const navLinks = {
        'report-page': 0,
        'dashboard-page': 1,
        'history-page': 2,
        'users-page': 3,
        'machines-page': 4
    };
    const navIndex = navLinks[id];
    if (navIndex !== undefined) {
        const navEl = document.querySelectorAll('.nav-link')[navIndex];
        if (navEl) navEl.classList.add('active');
    }

    if (id === 'dashboard-page') updateDashboard();
    else if (id === 'history-page') { updateFilterSelects(); updateHistory(); }
    else if (id === 'report-page') { updateCoworkerList(); updateMachineSelect(); } // update machines too
    else if (id === 'users-page') renderUserList();
    else if (id === 'machines-page') renderMachineList();
}

async function updateMachineSelect() {
    const machines = await getMachines();
    const sel = document.getElementById('machine-select');
    // 依照 category 分組
    const grouped = {};
    machines.forEach(m => {
        const cat = m.category || '其他';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m);
    });

    let html = '<option value="">選擇機台</option>';
    for (const [cat, list] of Object.entries(grouped)) {
        html += `<optgroup label="${cat}">` + list.map(m => `<option value="${m.id}">${m.id} - ${m.name}</option>`).join('') + `</optgroup>`;
    }
    sel.innerHTML = html;

    // [NEW] Auto-load last selected machine
    const lastMachine = localStorage.getItem(LAST_MACHINE_KEY);
    if (lastMachine && machines.some(m => m.id === lastMachine)) {
        sel.value = lastMachine;
        sel.dispatchEvent(new Event('change'));
    }
}

async function updateFilterSelects() {
    const employees = await getEmployees();
    const machines = await getMachines();
    document.getElementById('filter-machine').innerHTML = '<option value="">全部機台</option>' + machines.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
    document.getElementById('filter-worker').innerHTML = '<option value="">全部員工</option>' + employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

function adjustQty(d) { const i = document.getElementById('quantity'); i.value = Math.max(0, (parseInt(i.value) || 0) + d); }

let html5QrCode;

function scanQRCode() {
    document.getElementById('scanner-modal').classList.add('show');

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
            console.error(err);
            showToast('無法啟動相機: ' + err);
        });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-modal').classList.remove('show');
            html5QrCode.clear();
        }).catch(err => console.log(err));
    } else {
        document.getElementById('scanner-modal').classList.remove('show');
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    // 假設掃到的內容是網址如 https://...?m=M101 或直接是 M101
    // 我們嘗試擷取機台代號
    let machineId = decodedText.toUpperCase().trim();

    // 簡單解析：如果包含 =M... 取後面，否則直接用
    if (decodedText.includes('=')) {
        const parts = decodedText.split('=');
        machineId = parts[parts.length - 1].toUpperCase().trim();
    }

    const machines = await getMachines();
    const sel = document.getElementById('machine-select');
    if (machines.some(m => m.id === machineId)) {
        sel.value = machineId;
        sel.dispatchEvent(new Event('change'));
        showToast(`掃描成功：${machineId}`);
        stopScanner();

        // 震動回饋
        if (navigator.vibrate) navigator.vibrate(200);
    } else {
        console.log(`掃描到無效代號: ${machineId}`);
    }
}

function onScanFailure(error) {
    // 掃描中但不成功的狀況，通常忽略即可，避免 log 洗版
    // console.warn(`Code scan error = ${error}`);
}

const machineSelect = document.getElementById('machine-select');
if (machineSelect) {
    machineSelect.addEventListener('change', async function () {
        const mid = this.value;

        // [NEW] Save selection
        if (mid) {
            localStorage.setItem(LAST_MACHINE_KEY, mid);
        } else {
            localStorage.removeItem(LAST_MACHINE_KEY);
        }

        const wsel = document.getElementById('work-type');
        const ul = document.getElementById('unit-label');
        wsel.innerHTML = ''; ul.textContent = '-';
        if (!mid) { wsel.innerHTML = '<option value="">請先選擇機台</option>'; return; }

        const types = await getWorkTypesForMachine(mid);

        wsel.innerHTML = '<option value="">選擇工作類型</option>' + types.map(t => `<option value="${t.id}" data-unit="${t.unit}">${t.name}（${t.unit}）</option>`).join('');
    });
}

const workTypeSelect = document.getElementById('work-type');
if (workTypeSelect) {
    workTypeSelect.addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];
        document.getElementById('unit-label').textContent = opt?.dataset?.unit || '-';
    });
}

let isSubmitting = false; // 防呆旗標：防止連續點擊重複報工

// 鎖定/解鎖提交按鈕的共用函數
function lockSubmitBtn() {
    const btn = document.querySelector('.submit-btn');
    if (btn) {
        btn.disabled = true;                    // HTML disabled 屬性
        btn.classList.add('submitting');         // 加上 CSS 視覺效果
        btn.style.pointerEvents = 'none';       // 徹底阻止點擊事件
        btn.textContent = '⏳ 提交中...';       // 改按鈕文字
    }
}

function unlockSubmitBtn() {
    const btn = document.querySelector('.submit-btn');
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('submitting');
        btn.style.pointerEvents = '';
        btn.textContent = '✓ 提交報工';         // 還原按鈕文字
    }
}

async function submitReport() {
    // 防呆：點擊後立即鎖定，3 秒內不允許重複提交
    if (isSubmitting) {
        showToast('⚠️ 請稍候，勿重複點擊');
        return;
    }
    isSubmitting = true;  // 最先鎖定，比驗證還早
    lockSubmitBtn();      // 立即視覺鎖定

    if (!currentUser) { showToast('請先登入'); isSubmitting = false; unlockSubmitBtn(); return; }
    const m = document.getElementById('machine-select').value;
    const wsel = document.getElementById('work-type');
    const w = wsel.value;
    const q = parseInt(document.getElementById('quantity').value) || 0;
    const n = document.getElementById('note').value;
    if (!m) { showToast('請選擇機台'); isSubmitting = false; unlockSubmitBtn(); return; }
    if (!w) { showToast('請選擇工作類型'); isSubmitting = false; unlockSubmitBtn(); return; }
    if (q <= 0) { showToast('請輸入數量'); isSubmitting = false; unlockSubmitBtn(); return; }

    const opt = wsel.options[wsel.selectedIndex];
    const unit = opt?.dataset?.unit || '';
    const workName = opt?.textContent?.split('（')[0] || w;

    const employees = await getEmployees();
    const coworkers = [...selectedCoworkers].map(id => employees.find(e => e.id === id)?.name).filter(Boolean);

    const machines = await getMachines();
    const r = {
        id: Date.now(),
        machine: m,
        machineName: machines.find(x => x.id === m)?.name || m,
        workType: w,
        workTypeName: workName,
        quantity: q,
        unit: unit,
        note: n,
        worker: currentUser.name,
        workerId: currentUser.id,
        coworkers: coworkers,
        timestamp: new Date().toISOString()
    };

    saveReport(r);
    // document.getElementById('machine-select').value = ''; // Retain Machine
    // document.getElementById('work-type').innerHTML = '<option value="">請先選擇機台</option>'; // Retain Work Type
    document.getElementById('quantity').value = '0'; // field to reset
    document.getElementById('note').value = '';     // field to reset
    // document.getElementById('unit-label').textContent = '-'; // Retain Unit
    // selectedCoworkers.clear(); // Retain Coworkers selection
    // document.querySelectorAll('.coworker-chip').forEach(el => el.classList.remove('selected')); // Retain Coworkers UI
    showToast('報工成功！✓');
    if (navigator.vibrate) navigator.vibrate(100);

    // 3 秒後解鎖，才允許再次提交（視覺回饋讓使用者知道正在冷卻）
    setTimeout(() => {
        isSubmitting = false;
        unlockSubmitBtn();
    }, 3000);
}

async function saveReport(r) {
    if (db) {
        try {
            await db.collection('reports').add(r);
        } catch (e) {
            console.error("DB Save Error", e);
            showToast("⚠️ 雲端備份失敗，僅儲存於本地");
        }
    }
    const rs = await getReports();
    rs.unshift(r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rs));
}

async function getReports() {
    // 優先讀取 LocalStorage 以求速度，但會在背景同步
    // 為了戰情看板即時性，如果連上 DB 應該要讀 DB
    if (db) {
        try {
            // 簡單實作：只抓最近 500 筆
            const snapshot = await db.collection('reports').orderBy('timestamp', 'desc').limit(500).get();
            if (!snapshot.empty) {
                const list = [];
                snapshot.forEach(doc => list.push(doc.data()));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                return list;
            }
        } catch (e) { console.error("DB Read Error", e); }
    }

    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

async function getTodayReports() {
    const now = new Date();
    // Use Taiwan Local Date string YYYY-MM-DD
    const offset = now.getTimezoneOffset() * 60000; // in ms
    const localTime = new Date(now.getTime() - offset);
    // Actually simpler:
    const t = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\//g, '-');
    // Wait, toLocaleDateString might return 2026/02/05. 
    // Let's stick to a robust manual format or just checks.
    // robust: 
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const rs = await getReports();
    // Check if timestamp (ISO) falls on this local date
    return rs.filter(r => {
        const d = new Date(r.timestamp);
        const dStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
            .replace(/\//g, '-');
        // Format usually YYYY/MM/DD or YYYY-MM-DD depending on locale impl.
        // Safest:
        const rYear = d.getFullYear();
        const rMonth = String(d.getMonth() + 1).padStart(2, '0');
        const rDay = String(d.getDate()).padStart(2, '0');
        return `${rYear}-${rMonth}-${rDay}` === dateStr;
    });
}

async function updateDashboard() {
    const rs = await getTodayReports();
    const machines = await getMachines();

    // --- New Category Stats Logic ---
    const grid = document.getElementById('category-stats-grid');
    grid.innerHTML = '';

    const categories = ['棧板', '大剪台', '小剪台', '多片機', '凹槽機/斜角', '合板機'];

    categories.forEach(cat => {
        const workTypes = categoryWorkTypes[cat];
        // Find all machines in this category
        const catMachines = machines.filter(m => (m.category || '大剪台') === cat).map(m => m.id);

        // Filter reports for these machines
        const catReports = rs.filter(r => catMachines.includes(r.machine));

        // Aggregate by work type
        const stats = {};
        workTypes.forEach(wt => stats[wt.name] = 0);

        // 如果是棧板，我們也要統計舊的 workType 到對應的顯示名稱
        const legacyMapping = {
            'pallet': '木棧板(三隻腳)', // 將舊的 pallet 預設歸類到顯示上，或建立一個統一名稱
            'combo': '木棧板(三隻腳)',
            'special': '木棧板(三隻腳)'
        };

        catReports.forEach(r => {
            const known = workTypes.find(wt => wt.id === r.workType);
            if (known) {
                stats[known.name] = (stats[known.name] || 0) + r.quantity;
            } else if (cat === '棧板' && legacyMapping[r.workType]) {
                const mappedName = legacyMapping[r.workType];
                stats[mappedName] = (stats[mappedName] || 0) + r.quantity;
            }
        });

        // Check if there is any data for this category
        const totalQty = Object.values(stats).reduce((a, b) => a + b, 0);
        if (totalQty === 0) return;

        // Render Card
        let listHtml = '';
        workTypes.forEach(wt => {
            const val = stats[wt.name] || 0;
            if (val > 0) {
                listHtml += `
                    <div class="stat-row">
                        <span class="stat-label">${wt.name}</span>
                        <span class="stat-value">${val}</span>
                    </div>
                `;
            }
        });

        grid.innerHTML += `
            <div class="category-card">
                <div class="category-header">${cat}</div>
                <div class="stat-list">
                    ${listHtml}
                </div>
            </div>
        `;
    });

    // --- Employee Progress (Leaderboard) ---
    const epContainer = document.getElementById('machine-progress-container');
    // Change Title if possible (hacky way via JS or just accept the ID reuse)
    // Ideally user might want to change the header text in HTML, but I can do it here.
    // Change Title
    const sectionTitle = document.querySelectorAll('.section-title');
    if (sectionTitle.length > 1) {
        sectionTitle[1].textContent = '今日同仁績效排行榜';
    } else if (sectionTitle.length === 1) {
        sectionTitle[0].textContent = '今日同仁績效排行榜';
    }

    epContainer.innerHTML = '';

    // 1. Calculate Scores
    // Weights
    const weights = {
        'log': 20, 'scrap': 0.11, 'board': 0.05, 'shear_strip': 0.05, 'board_strip': 0.05, 'pellet': 0.08,
        'plank': 0.025, 'strip': 0.05, 'chip': 0.1,
        'groove': 0.04, 'bevel': 0.05,
        'panel': 0.25, 'slat': 0.083,
        'pallet_3legs': 0.95, 'pallet_pellet': 1.3, 'pallet_glue': 0.9, 'cover': 0.6, 'combo_pallet': 0.7, 'box': 10, 'l_angle': 0.1,
        // 為避免歷史數據計算錯誤，保留舊的 ID
        'pallet': 0.95, 'combo': 0.55, 'special': 4
    };

    const scores = {}; // { '王小明': 105.5 }

    // Helper to add score
    const addScore = (name, pts) => {
        if (!name) return;
        scores[name] = (scores[name] || 0) + pts;
    };

    rs.forEach(r => {
        const w = r.workType;
        // Find weight by ID (e.g. 'log')
        // We need to map workType ID to weight. 
        // My weights object uses IDs? Yes.
        // Let's check categoryWorkTypes in script.js to match IDs.
        // 'log' is '原木'.

        let weight = weights[w] || 0;

        const points = r.quantity * weight;

        // Credit Main Worker
        addScore(r.worker, points);

        // Credit Coworkers
        if (r.coworkers && Array.isArray(r.coworkers)) {
            r.coworkers.forEach(c => addScore(c, points));
        }
    });

    // 2. Sort Employees
    // Convert to array
    const scoreList = Object.entries(scores).map(([name, score]) => ({ name, score }));
    scoreList.sort((a, b) => b.score - a.score);

    // 3. Render
    let gridHtml = '<div class="machine-grid">';

    if (scoreList.length === 0) {
        gridHtml += '<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">尚無報工紀錄</div>';
    }

    scoreList.forEach((p, index) => {
        const s = parseFloat(p.score.toFixed(1));

        // Trophy Logic
        let rankHtml = '';
        if (index === 0) rankHtml = ' <span style="font-size:1.2em">🏆</span>';
        else if (index === 1) rankHtml = ' <span style="font-size:1.2em">🥈</span>';
        else if (index === 2) rankHtml = ' <span style="font-size:1.2em">🥉</span>';


        // Determine Color Class
        let colorClass = 'status-green'; // Default (80~100)
        if (s < 80) colorClass = 'status-red';
        else if (s > 100) colorClass = 'status-yellow';

        const pct = Math.min(100, (s / 100) * 100);

        gridHtml += `
            <div class="machine-card employee-card">
                <div class="machine-name" style="font-size:1.2em; display:flex; justify-content:space-between; align-items:center;">
                    <span>${p.name}${rankHtml}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width:${pct}%"></div>
                </div>
                <div class="machine-count" style="font-size:1.1em; font-weight:bold; color:#333;">
                    ${s} 分
                </div>
            </div>`;
    });
    gridHtml += '</div>';

    epContainer.innerHTML = gridHtml;
}

async function applyFilter() {
    const sd = document.getElementById('filter-date-start').value;
    const ed = document.getElementById('filter-date-end').value;
    const m = document.getElementById('filter-machine').value;
    const w = document.getElementById('filter-worker').value;
    const employees = await getEmployees();
    let rs = await getReports();
    if (sd) rs = rs.filter(r => r.timestamp.split('T')[0] >= sd);
    if (ed) rs = rs.filter(r => r.timestamp.split('T')[0] <= ed);
    if (m) rs = rs.filter(r => r.machine === m);
    if (w) rs = rs.filter(r => r.workerId === w || (r.coworkers || []).some(c => employees.find(e => e.name === c)?.id === w));
    filteredReports = rs; renderHistory(rs); showToast(`找到 ${rs.length} 筆`);
}

async function updateHistory() { filteredReports = await getReports(); renderHistory(filteredReports.slice(0, 50)); }

function renderHistory(rs) {
    const hl = document.getElementById('history-list');
    if (rs.length === 0) { hl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>無符合條件的紀錄</p></div>'; return; }

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

    hl.innerHTML = rs.slice(0, 50).map(r => {
        const t = new Date(r.timestamp), ds = t.toLocaleDateString('zh-TW'), ts = t.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const workers = [r.worker, ...(r.coworkers || [])].filter(Boolean).join('、');

        let actions = '';
        if (isAdmin) {
            actions = `
            <div class="history-actions" style="margin-top:10px;padding-top:10px;border-top:1px dashed #eee;display:flex;gap:10px;justify-content:flex-end">
                <button onclick="editReport(${r.id})" style="background:#e3f2fd;color:#1976d2;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px">編輯數量</button>
                <button onclick="deleteReport(${r.id})" style="background:#ffebee;color:#c62828;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px">刪除</button>
            </div>`;
        }

        return `<div class="history-item">
            <div class="history-header"><span class="history-machine">${r.machine} ${r.machineName}</span><span class="history-time">${ds} ${ts}</span></div>
            <div class="history-detail">${r.workTypeName} <span style="font-weight:bold;color:var(--primary)">${r.quantity}</span> ${r.unit}${r.note ? ' - ' + r.note : ''}</div>
            <div class="history-worker">👤 ${workers}</div>
            ${actions}
        </div>`;
    }).join('');
}

async function deleteReport(reportId) {
    if (!confirm('確定要刪除這筆報工紀錄嗎？')) return;

    // 1. Delete from LocalStorage
    let rs = await getReports();
    rs = rs.filter(r => r.id !== reportId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rs));

    // 2. Delete from Firestore (Query by id field)
    if (db) {
        try {
            const q = await db.collection('reports').where('id', '==', reportId).get();
            q.forEach(doc => doc.ref.delete());
        } catch (e) {
            console.error("DB Delete Error", e);
            showToast("⚠️ 雲端刪除失敗");
        }
    }

    updateHistory();
    filteredReports = await getReports(); // Refresh filtered cache
    showToast('已刪除');
}

async function editReport(reportId) {
    const rs = await getReports();
    const r = rs.find(x => x.id === reportId);
    if (!r) return;

    const newQty = prompt(`修改 ${r.machineName} - ${r.workTypeName} 的數量：`, r.quantity);
    if (newQty === null) return;
    const q = parseInt(newQty);
    if (isNaN(q) || q <= 0) { showToast('請輸入有效的數字'); return; }

    // 1. Update LocalStorage
    r.quantity = q;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rs));

    // 2. Update Firestore
    if (db) {
        try {
            const qSnap = await db.collection('reports').where('id', '==', reportId).get();
            qSnap.forEach(doc => doc.ref.update({ quantity: q }));
        } catch (e) {
            console.error("DB Update Error", e);
            showToast("⚠️ 雲端更新失敗");
        }
    }

    updateHistory();
    filteredReports = await getReports(); // Refresh filtered cache
    showToast('更新成功');
}

function exportFiltered() { exportCSV(filteredReports, '篩選結果'); }
async function exportDaily() { const d = prompt('日期 (YYYY-MM-DD)', new Date().toISOString().split('T')[0]); if (d) { const rs = await getReports(); exportCSV(rs.filter(r => r.timestamp.startsWith(d)), `日報表_${d}`); } }
async function exportMonthly() { const m = prompt('月份 (YYYY-MM)', new Date().toISOString().slice(0, 7)); if (m) { const rs = await getReports(); exportCSV(rs.filter(r => r.timestamp.startsWith(m)), `月報表_${m}`); } }

function exportCSV(rs, fn) {
    if (rs.length === 0) { showToast('沒有資料'); return; }

    // 1. 產生明細資料
    const h = ['時間', '機台', '機台名稱', '工作類型', '數量', '單位', '報工者', '共同作業者', '備註'];
    const rows = rs.map(r => [r.timestamp, r.machine, r.machineName, r.workTypeName, r.quantity, r.unit, r.worker, (r.coworkers || []).join('/'), r.note || '']);
    let csv = [h, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');

    // 2. 附加分數總結 (依每日計算分數與評價，並統計次數)
    const weights = {
        'log': 20, 'scrap': 0.11, 'board': 0.05, 'shear_strip': 0.05, 'board_strip': 0.05, 'pellet': 0.08,
        'plank': 0.025, 'strip': 0.1, 'chip': 0.2,
        'groove': 0.04, 'bevel': 0.05,
        'panel': 0.25, 'slat': 0.083,
        'pallet_3legs': 0.95, 'pallet_pellet': 1.4, 'pallet_glue': 0.9, 'cover': 0.6, 'box': 10, 'l_angle': 0.1,
        'pallet': 0.95, 'combo': 0.55, 'special': 4
    };

    const employeeStats = {};
    const initEmployee = (name) => {
        if (!employeeStats[name]) {
            employeeStats[name] = { '低於預期': 0, '正常': 0, '出類拔萃': 0, '總分': 0 };
        }
    };

    // 先依日期分組
    const dailyData = {};
    rs.forEach(r => {
        if (!r.timestamp) return;
        const d = new Date(r.timestamp);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;

        if (!dailyData[localDateStr]) dailyData[localDateStr] = [];
        dailyData[localDateStr].push(r);
    });

    // 依每日計算分數與評價
    for (const dateStr in dailyData) {
        const records = dailyData[dateStr];
        const dailyScores = {};

        const addDailyScore = (name, pts) => {
            if (!name) return;
            initEmployee(name);
            dailyScores[name] = (dailyScores[name] || 0) + pts;
            employeeStats[name]['總分'] += pts;
        };

        records.forEach(r => {
            const w = r.workType;
            let weight = weights[w] || 0;
            const points = r.quantity * weight;
            addDailyScore(r.worker, points);
            if (r.coworkers && Array.isArray(r.coworkers)) {
                r.coworkers.forEach(c => addDailyScore(c, points));
            }
        });

        for (const [name, score] of Object.entries(dailyScores)) {
            const s = parseFloat(score.toFixed(1));
            if (s < 80) employeeStats[name]['低於預期']++;
            else if (s <= 100) employeeStats[name]['正常']++;
            else employeeStats[name]['出類拔萃']++;
        }
    }

    const statList = Object.entries(employeeStats).map(([name, stats]) => ({ name, ...stats }));
    statList.sort((a, b) => b['總分'] - a['總分']);

    if (statList.length > 0) {
        csv += '\n\n"--- 同仁分數與評價總覽 (依每日計算) ---"\n';
        csv += '"姓名","期間總分","出類拔萃 (天)","正常 (天)","低於預期 (天)"\n';
        statList.forEach(p => {
            const totalScore = parseFloat(p['總分'].toFixed(1));
            csv += `"${p.name}","${totalScore}","${p['出類拔萃']}","${p['正常']}","${p['低於預期']}"\n`;
        });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fn}.csv`; a.click();
    showToast('匯出成功！');
}

// 使用者管理
async function renderUserList() {
    const employees = await getEmployees();
    const container = document.getElementById('user-list-container');
    container.innerHTML = employees.map(e => `
<div class="user-item">
<div class="user-left">
    <span class="user-id">${e.id}</span>
    <span class="user-name">${e.name}</span>
    <span class="user-role ${e.role}">${roleLabels[e.role]}</span>
</div>
<div class="user-actions">
    <button class="btn-edit" onclick="editUser('${e.id}')">編輯</button>
    <button class="btn-delete" onclick="deleteUser('${e.id}')">刪除</button>
</div>
</div>
`).join('');
}

function showAddUserModal() {
    editingUserId = null;
    document.getElementById('modal-title').textContent = '新增使用者';
    document.getElementById('modal-id').value = '';
    document.getElementById('modal-id').disabled = false;
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-role').value = 'worker';
    document.getElementById('user-modal').classList.add('show');
}

async function editUser(id) {
    const employees = await getEmployees();
    const user = employees.find(e => e.id === id);
    if (!user) return;

    editingUserId = id;
    document.getElementById('modal-title').textContent = '編輯使用者';
    document.getElementById('modal-id').value = user.id;
    document.getElementById('modal-id').disabled = true;
    document.getElementById('modal-name').value = user.name;
    document.getElementById('modal-role').value = user.role;
    document.getElementById('user-modal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
}

async function saveUser() {
    const id = document.getElementById('modal-id').value.toUpperCase().trim();
    const name = document.getElementById('modal-name').value.trim();
    const role = document.getElementById('modal-role').value;

    if (!id || !name) { showToast('請填寫完整資料'); return; }

    let employees = await getEmployees();

    if (editingUserId) {
        const idx = employees.findIndex(e => e.id === editingUserId);
        if (idx !== -1) {
            employees[idx] = { ...employees[idx], name, role };
        }
        if (db) {
            try { await db.collection('users').doc(editingUserId).update({ name, role }); } // Fixed collection name 'employees' -> 'users' based on previous context, but line 1371 said 'users'. Line 2117 said 'employees'. I should stick to 'users' or 'employees'. getEmployees uses 'users'. I will use 'users'.
            catch (e) {
                // Actually the original code had 'employees' in saveUser (line 2117) and deleteUser but 'users' in getEmployees (1371).
                // This implies a bug in the original code or a mix.
                // Line 1371: db.collection('users').get()
                // Line 1395: db.collection('users').doc(u.id).set(u)
                // Line 2117: db.collection('employees').doc...
                // I should standardize on 'users' as getEmployees uses it.
                // Wait, let's look at the original code carefully.
                // Line 1371: db.collection('users').get()
                // Line 1395: db.collection('users')
                // Line 2117: db.collection('employees')
                // I will fix this to 'users' to be consistent.
                console.error(e);
            }
        }
    } else {
        if (employees.find(e => e.id === id)) {
            showToast('此工號已存在'); return;
        }
        const newUser = { id, name, role };
        employees.push(newUser);
        if (db) {
            try { await db.collection('users').doc(id).set(newUser); }
            catch (e) { console.error(e); }
        }
    }

    saveEmployees(employees);
    closeUserModal();
    renderUserList();
    showToast('儲存成功！');
}

async function deleteUser(id) {
    if (id === currentUser.id) { showToast('無法刪除自己'); return; }
    if (!confirm(`確定要刪除使用者 ${id}？`)) return;

    let employees = await getEmployees();
    employees = employees.filter(e => e.id !== id);
    saveEmployees(employees);

    if (db) {
        try { await db.collection('users').doc(id).delete(); }
        catch (e) { console.error("DB Delete Error", e); }
    }

    renderUserList();
    showToast('已刪除');
}

// 機台管理
async function renderMachineList() {
    const machines = await getMachines();
    const container = document.getElementById('machine-list-container');
    container.innerHTML = machines.map(m => `
        <div class="user-item" style="display:flex;flex-direction:column;align-items:flex-start;">
            <div style="font-weight:bold;font-size:18px;margin-bottom:5px;">${m.id}</div>
            <div style="margin-bottom:5px;">${m.name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:10px;">分類: ${m.category || '未分類'}</div>
            <div class="user-actions" style="width:100%;display:flex;justify-content:flex-end;">
                <button class="btn-edit" onclick="printMachineQR('${m.id}')">🖨️ QR</button>
                <button class="btn-edit" onclick='editMachine(${JSON.stringify(m)})'>編輯</button>
                <button class="btn-delete" onclick="deleteMachineUI('${m.id}')">刪除</button>
            </div>
        </div>
    `).join('');
}

function showAddMachineModal() {
    document.getElementById('machine-modal-title').textContent = '新增機台';
    document.getElementById('machine-id').value = '';
    document.getElementById('machine-id').disabled = false;
    document.getElementById('machine-name').value = '';
    document.getElementById('machine-category').value = '剪台';
    document.getElementById('machine-modal').classList.add('show');
}

function editMachine(m) {
    // If m is a string (id), try to find it (backward compatibility or if called with ID)
    if (typeof m === 'string') {
        getMachines().then(machines => {
            const found = machines.find(x => x.id === m);
            if (found) editMachine(found);
        });
        return;
    }

    document.getElementById('machine-modal-title').textContent = '編輯機台';
    document.getElementById('machine-id').value = m.id;
    document.getElementById('machine-id').disabled = true;
    document.getElementById('machine-name').value = m.name;
    document.getElementById('machine-category').value = m.category || '剪台';
    document.getElementById('machine-modal').classList.add('show');
}

function closeMachineModal() {
    document.getElementById('machine-modal').classList.remove('show');
}

async function saveMachineUI() {
    const id = document.getElementById('machine-id').value.toUpperCase().trim();
    const name = document.getElementById('machine-name').value.trim();
    const category = document.getElementById('machine-category').value;

    if (!id || !name) { showToast('請填寫完整資料'); return; }

    await saveMachine({ id, name, category });
    closeMachineModal();
    renderMachineList();
    showToast('儲存成功！');
}

async function deleteMachineUI(id) {
    if (!confirm(`確定要刪除機台 ${id}？`)) return;
    await deleteMachine(id);
    renderMachineList();
    showToast('已刪除');
}

let editingMachineId = null;

// QR Code 列印
function printMachineQR(id) {
    const url = `https://${window.location.host}${window.location.pathname}?m=${id}`;
    // 這裡我們暫時只印一個
    printQRCodes([id]);
}

async function printAllQRCodes() {
    const machines = await getMachines();
    printQRCodes(machines.map(m => m.id));
}

async function printQRCodes(ids) {
    const machines = await getMachines();
    const printWindow = window.open('', '_blank');

    const style = `
        body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
        .qr-card { border: 2px solid #000; padding: 20px; text-align: center; width: 220px; page-break-inside: avoid; }
        .qr-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .qr-code { margin: 0 auto; display: flex; justify-content: center; }
        .qr-name { font-size: 16px; margin-top: 10px; }
        @media print { .no-print { display: none; } }
    `;

    const htmlContent = `
        <div class="no-print" style="width:100%;margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 20px;font-size:20px;">🖨️ 列印</button>
        </div>
    ` + ids.map(id => {
        const m = machines.find(x => x.id === id);
        return `
        <div class="qr-card">
            <div class="qr-title">${id}</div>
            <div id="qr-${id}" class="qr-code"></div>
            <div class="qr-name">${m?.name || ''}</div>
        </div>`;
    }).join('');

    printWindow.document.write(`<html><head><title>列印 QR Code</title><style>${style}</style></head><body>${htmlContent}</body></html>`);

    // Dynamically load script and trigger QR generation
    const script = printWindow.document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = function () {
        const script2 = printWindow.document.createElement('script');
        script2.textContent = `
            const ids = ${JSON.stringify(ids)};
            ids.forEach(id => {
                new QRCode(document.getElementById("qr-" + id), {
                    text: "${window.location.href.split('?')[0]}?m=" + id,
                    width: 150,
                    height: 150
                });
            });
        `;
        printWindow.document.body.appendChild(script2);
    };
    printWindow.document.head.appendChild(script);
    printWindow.document.close();
}

function showToast(m) {
    const t = document.getElementById('toast');
    if (t) {
        t.textContent = m; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
    } else {
        console.log("Toast:", m);
    }
}

// TV Mode Logic
function openTVMode() {
    window.open(window.location.pathname + '?mode=tv', '_blank');
}

// Initialization Check
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'tv') {
        document.body.classList.add('tv-mode');

        // Mock a user to bypass null checks (TV User)
        currentUser = { id: 'TV', name: '戰情看板', role: 'admin' };

        // Hide sidebar and other pages implicitly via CSS, show dashboard
        showPage('dashboard-page');

        // Auto Refresh every 60s
        updateTVDate();
        setInterval(() => {
            updateDashboard();
            updateTVDate();
        }, 60000);

        showToast('📺 已進入戰情模式 (60秒自動更新)');
    } else {
        if (checkLogin()) showPage('home-page');
    }
});

function updateTVDate() {
    const el = document.getElementById('tv-date-header');
    if (!el) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const weekday = now.toLocaleDateString('zh-TW', { weekday: 'long' });

    el.textContent = `${dateStr} ${weekday}`;
}
