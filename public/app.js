const API_URL = "/api"; // Vercel rewrite route

// State
let token = localStorage.getItem('token') || null;
let currentUser = null;

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const toastEl = document.getElementById('toast');
const navLinks = document.querySelectorAll('.nav-links a');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('page-title');

// Initialize
async function init() {
    if (token) {
        await fetchCurrentUser();
        if (currentUser) {
            showPage('dashboard');
            loadDashboardData();
        } else {
            showPage('login');
        }
    } else {
        showPage('login');
    }
}

// UI Helpers
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (page === 'login') {
        loginPage.classList.add('active');
    } else if (page === 'dashboard') {
        dashboardPage.classList.add('active');
    }
}

function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function switchView(targetId, title) {
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    pageTitle.textContent = title;
}

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const title = link.textContent;
        switchView(targetId, title);
        
        if (targetId === 'view-dashboard') loadDashboardData();
        if (targetId === 'view-saisie') loadFormOptions();
        if (targetId === 'view-liste') loadMilitants();
    });
});

// API Calls
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Unauthorized
        logout();
        throw new Error("Session expirée");
    }
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur serveur");
    }
    
    return response.json();
}

// Auth
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        
        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        
        if (!response.ok) throw new Error("Identifiants incorrects");
        
        const data = await response.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        
        await fetchCurrentUser();
        showPage('dashboard');
        loadDashboardData();
        showToast("Connexion réussie");
    } catch (err) {
        showToast(err.message, 'error');
    }
});

async function fetchCurrentUser() {
    try {
        currentUser = await apiCall('/users/me');
        document.getElementById('current-username').textContent = currentUser.username;
        document.getElementById('current-role').textContent = currentUser.role;
    } catch (err) {
        currentUser = null;
        token = null;
        localStorage.removeItem('token');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    showPage('login');
}
logoutBtn.addEventListener('click', logout);


// Dashboard Data
async function loadDashboardData() {
    try {
        const stats = await apiCall('/stats');
        document.getElementById('stat-militants').textContent = stats.militants;
        document.getElementById('stat-sections').textContent = stats.sections;
        document.getElementById('stat-cellules').textContent = stats.cellules;
    } catch (err) {
        console.error(err);
    }
}

// Form Options
async function loadFormOptions() {
    try {
        const sections = await apiCall('/sections');
        const cellules = await apiCall('/cellules');
        
        const sectionSelect = document.getElementById('m_section');
        sectionSelect.innerHTML = '<option value="">Sélectionnez une section</option>';
        sections.forEach(s => {
            sectionSelect.innerHTML += `<option value="${s.code_section}">${s.nom_section}</option>`;
        });
        
        const celluleSelect = document.getElementById('m_cellule');
        celluleSelect.innerHTML = '<option value="">Sélectionnez une cellule</option>';
        cellules.forEach(c => {
            celluleSelect.innerHTML += `<option value="${c.code_cellule}" data-section="${c.code_section}">${c.nom_cellule}</option>`;
        });
        
        // Basic filtering of cellules based on section
        sectionSelect.addEventListener('change', (e) => {
            const selectedSection = e.target.value;
            Array.from(celluleSelect.options).forEach(opt => {
                if (opt.value === "") return;
                if (selectedSection === "" || opt.getAttribute('data-section') === selectedSection) {
                    opt.style.display = 'block';
                } else {
                    opt.style.display = 'none';
                }
            });
            celluleSelect.value = "";
        });
        
    } catch (err) {
        console.error(err);
    }
}

// Submit Militant
document.getElementById('militant-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const militant = {
        code_militant: document.getElementById('m_code').value,
        nom: document.getElementById('m_nom').value,
        prenoms: document.getElementById('m_prenoms').value,
        sexe: document.getElementById('m_sexe').value,
        code_section: document.getElementById('m_section').value,
        code_cellule: document.getElementById('m_cellule').value
    };
    
    try {
        await apiCall('/militants', {
            method: 'POST',
            body: JSON.stringify(militant)
        });
        showToast("Militant ajouté avec succès");
        e.target.reset();
        loadDashboardData();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// List Militants
async function loadMilitants() {
    try {
        const militants = await apiCall('/militants');
        const tbody = document.getElementById('militants-tbody');
        tbody.innerHTML = '';
        
        militants.forEach(m => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${m.code_militant}</strong></td>
                    <td>${m.nom}</td>
                    <td>${m.prenoms || '-'}</td>
                    <td><span class="badge" style="background:#e2e8f0; color:#333;">${m.code_section}</span></td>
                    <td>${m.code_cellule}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('refresh-list-btn').addEventListener('click', loadMilitants);

// Start
init();
