// --- 1. ENREGISTREMENT DU SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Mode hors-ligne activé !"))
    .catch(err => console.log("Erreur Service Worker :", err));
}

// --- 2. VARIABLES GLOBALES ---
let tppCible = 0;
let startTime = null;
let piecesInitiales = 0;
let piecesAuDebutDuPoste = 0;
let setupInitial = 0;
let currentShiftName = "";

// --- 3. INITIALISATION ---
window.onload = () => {
    loadData();
    document.getElementById('btn-start').addEventListener('click', lancerSerie);
    document.getElementById('check').addEventListener('change', toggleReprise);
    
    document.getElementById('real-qty').addEventListener('input', () => {
        if (startTime) {
            comparer();
            save();
        }
    });

    document.querySelectorAll('.grid-input input').forEach(input => {
        input.addEventListener('input', save);
    });
};

// --- 4. HORLOGE ET MISE À JOUR ---
setInterval(() => {
    const d = new Date();
    const hours = d.getHours();
    
    // Calcul du numéro de semaine
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    // Formatage de la date
    const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dateEl = document.getElementById('date-info');
    if (dateEl) dateEl.innerText = `Semaine ${weekNum} | ${dateStr}`;

    let shift = "";
    if (hours >= 5 && hours < 13) shift = "MATIN (5h-13h)";
    else if (hours >= 13 && hours < 21) shift = "APREM (13h-21h)";
    else shift = "NUIT (21h-5h)";

    if (currentShiftName !== "" && currentShiftName !== shift) {
        piecesAuDebutDuPoste = parseFloat(document.getElementById('real-qty').value) || 0;
    }
    currentShiftName = shift;

    document.getElementById('clock').innerText = d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
    const sBadge = document.getElementById('shift-badge');
    if (sBadge) sBadge.innerText = shift;
    
    if (startTime) {
        updateChronoDisplay();
        comparer(); 
    }
}, 1000);

// --- 5. LOGIQUE DE CALCUL ---

function step(id, val) {
    const el = document.getElementById(id);
    let current = parseFloat(el.value) || 0;
    el.value = Math.max(0, current + val);
    
    // Déclencher les calculs et la sauvegarde
    if (startTime) comparer();
    save();
}

function lancerSerie() {
    const tCycle = parseFloat(document.getElementById('time').value) || 0;
    const setup = parseFloat(document.getElementById('setup').value) || 0;
    const qTotale = parseFloat(document.getElementById('qte').value) || 0;
    
    if (qTotale <= 0 || tCycle <= 0) return alert("Saisis la Quantité et le Temps Cycle !");

    startTime = new Date();
    setupInitial = setup;
    tppCible = tCycle;

    const isReprise = document.getElementById('check').checked;
    piecesInitiales = isReprise ? (parseFloat(document.getElementById('done').value) || 0) : 0;
    piecesAuDebutDuPoste = piecesInitiales;

    document.getElementById('results').style.display = "block";
    document.getElementById('bilan-section').style.display = "block";
    
    comparer();
    save();
}

function updateChronoDisplay() {
    const diffMs = new Date() - startTime;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const sStr = startTime.getHours().toString().padStart(2, '0') + ":" + startTime.getMinutes().toString().padStart(2, '0');
    document.getElementById('start-info').innerText = `Début: ${sStr} | Réel: ${h}h ${m.toString().padStart(2, '0')}m`;
}

function comparer() {
    const qR = parseFloat(document.getElementById('real-qty').value) || 0;
    const qTotale = parseFloat(document.getElementById('qte').value) || 0;
    const tCycle = tppCible;
    const setup = setupInitial;

    if (!startTime || tCycle <= 0) return;
    
    const isReprise = document.getElementById('check').checked;
    const tpsEcouleMin = (new Date() - startTime) / 60000;
    const prodSession = Math.max(0, qR - piecesInitiales);
    const setupEffectif = isReprise ? 0 : setup;

    // 1. Calcul du Delta (Avance / Retard)
    let tpsTheoriqueTravailFait = 0;
    if (prodSession > 0) {
        // On a fini le montage + fait des pièces
        tpsTheoriqueTravailFait = setupEffectif + (prodSession * tCycle);
    } else {
        // On est encore dans le montage : le delta est neutre tant qu'on ne dépasse pas le setup
        tpsTheoriqueTravailFait = Math.min(tpsEcouleMin, setupEffectif);
    }
    
    const delta = Math.round(tpsTheoriqueTravailFait - tpsEcouleMin);
    const dEl = document.getElementById('real-delta');
    dEl.innerText = (delta >= 0 ? "+" : "") + delta + " min";
    dEl.style.color = delta >= 0 ? "var(--green)" : "var(--red)";

    // 2. Heure Objectif (Lancement + Montage + Total Production)
    const qteAFaireSérie = qTotale - piecesInitiales;
    const tempsTotalVouluMinutes = setupEffectif + (qteAFaireSérie * tCycle);
    const targetDate = new Date(startTime.getTime() + (tempsTotalVouluMinutes * 60000));
    
    document.getElementById('res-target-time').innerText = 
        targetDate.getHours().toString().padStart(2, '0') + ":" + 
        targetDate.getMinutes().toString().padStart(2, '0');

    // 3. Fin Estimée Réelle (Objectif - Delta)
    const finDate = new Date(targetDate.getTime() - (delta * 60000));

    document.getElementById('res-main').innerText = 
        finDate.getHours().toString().padStart(2, '0') + ":" + 
        finDate.getMinutes().toString().padStart(2, '0');

    // 4. Cadence réelle
    if (prodSession > 0) {
        // Le temps de production pure = Temps écoulé - temps de montage réel (si fini)
        const tpsProdReel = Math.max(1, tpsEcouleMin - setupEffectif);
        const realTpp = tpsProdReel / prodSession;
        const rMin = Math.floor(realTpp);
        const rSec = Math.round((realTpp - rMin) * 60);
        document.getElementById('real-cadence').innerText = `${rMin}m${rSec.toString().padStart(2, '0')}s`;
    } else {
        document.getElementById('real-cadence').innerText = "--";
    }

    // 5. Mise à jour Shift & Stats
    document.getElementById('res-tpp').innerText = `${Math.floor(tCycle)}m${Math.round((tCycle%1)*60).toString().padStart(2,'0')}s`;
    document.getElementById('res-obj').innerText = qTotale - piecesInitiales;
    updateShiftStatus(finDate);
}

function updateShiftStatus(finDate) {
    const now = new Date();
    let shiftEndHour = 13;
    if (now.getHours() >= 13 && now.getHours() < 21) shiftEndHour = 21;
    if (now.getHours() >= 21 || now.getHours() < 5) shiftEndHour = 5;

    document.getElementById('res-shift-time').innerText = shiftEndHour.toString().padStart(2, '0') + ":00";

    const shiftEndDate = new Date();
    if (shiftEndHour === 5 && now.getHours() >= 21) shiftEndDate.setDate(shiftEndDate.getDate() + 1);
    shiftEndDate.setHours(shiftEndHour, 0, 0, 0);

    const statusEl = document.getElementById('shift-end-status');
    if (finDate <= shiftEndDate) {
        statusEl.innerText = "✓ SE TERMINE DURANT TON POSTE";
        statusEl.style.color = "white";
    } else {
        const diffMs = finDate - shiftEndDate;
        const minsRestants = Math.round(diffMs / 60000);
        const piecesRestantes = Math.ceil(minsRestants / (tppCible || 1));
        statusEl.innerText = `⚠ DÉBORDE DE ${Math.floor(minsRestants/60)}h${minsRestants%60}m (${piecesRestantes} pcs)`;
        statusEl.style.color = "#ffccd5";
    }

    const qR = parseFloat(document.getElementById('real-qty').value) || 0;
    document.getElementById('shift-prod').innerText = Math.max(0, qR - piecesAuDebutDuPoste);
}

function toggleReprise() {
    const isChecked = document.getElementById('check').checked;
    document.getElementById('done-div').classList.toggle('hidden', !isChecked);
    save();
}

function save() {
    const data = {
        r: document.getElementById('ref').value,
        s: document.getElementById('setup').value,
        q: document.getElementById('qte').value,
        t: document.getElementById('time').value,
        d: document.getElementById('done').value,
        c: document.getElementById('check').checked,
        st: startTime ? startTime.getTime() : null,
        tpp: tppCible,
        pi: piecesInitiales,
        pdp: piecesAuDebutDuPoste,
        si: setupInitial
    };
    localStorage.setItem('cnc_nano_v42', JSON.stringify(data));
}

function loadData() {
    const s = JSON.parse(localStorage.getItem('cnc_nano_v42'));
    if (s) {
        document.getElementById('ref').value = s.r || "";
        document.getElementById('setup').value = s.s || 0;
        document.getElementById('qte').value = s.q || "";
        document.getElementById('time').value = s.t || 0;
        document.getElementById('done').value = s.d || 0;
        document.getElementById('check').checked = s.c || false;
        if (s.st) {
            startTime = new Date(s.st);
            tppCible = s.tpp || 0;
            piecesInitiales = s.pi || 0;
            piecesAuDebutDuPoste = s.pdp || s.pi || 0;
            setupInitial = s.si || 0;
            document.getElementById('results').style.display = "block";
            document.getElementById('bilan-section').style.display = "block";
        }
        toggleReprise();
    }
}