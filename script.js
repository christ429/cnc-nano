// --- 1. ENREGISTREMENT DU SERVICE WORKER (POUR LE MODE HORS-LIGNE) ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Mode hors-ligne activé !"))
    .catch(err => console.log("Erreur Service Worker :", err));
}

// --- 2. VARIABLES GLOBALES ---
let tppCible = 0;
let startTime = null;

// --- 3. INITIALISATION AU CHARGEMENT ---
window.onload = () => {
    loadData();
    
    // Écouteurs d'événements (Boutons et Inputs)
    document.getElementById('btn-start').addEventListener('click', lancerSerie);
    document.getElementById('check').addEventListener('change', toggleReprise);
    
    // Sauvegarde auto sur chaque changement
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', save);
    });

    // Comparaison en temps réel quand on saisit la prod
    document.getElementById('real-qty').addEventListener('input', comparer);
};

// --- 4. HORLOGE ET MISE À JOUR DYNAMIQUE (Toutes les secondes) ---
setInterval(() => {
    const d = new Date();
    document.getElementById('clock').innerText = 
        d.getHours().toString().padStart(2, '0') + ":" + 
        d.getMinutes().toString().padStart(2, '0');
    
    if (startTime) {
        updateChronoDisplay();
        comparer(); // Recalcule le delta car le temps avance
    }
}, 1000);

// --- 5. FONCTIONS DE CALCUL ---

function lancerSerie() {
    const tAlloue = parseFloat(document.getElementById('time').value);
    const setup = parseFloat(document.getElementById('setup').value) || 0;
    const qTotale = parseFloat(document.getElementById('qte').value);
    
    if (!qTotale || !tAlloue) return alert("Saisis la Quantité et le Temps !");

    // Fixer l'heure de départ précise
    startTime = new Date();
    
    // Calcul cadence cible (Temps par pièce)
    tppCible = (tAlloue - setup) / qTotale;

    // Affichage Cadence Cible
    const min = Math.floor(tppCible);
    const sec = Math.round((tppCible - min) * 60);
    document.getElementById('res-tpp').innerText = `${min}m${sec.toString().padStart(2, '0')}s`;

    // Calcul Fin Estimée
    const isReprise = document.getElementById('check').checked;
    const fait = isReprise ? (parseFloat(document.getElementById('done').value) || 0) : 0;
    const reste = qTotale - fait;
    
    const finDate = new Date();
    finDate.setMinutes(finDate.getMinutes() + (reste * tppCible));

    document.getElementById('res-main').innerText = 
        finDate.getHours().toString().padStart(2, '0') + ":" + 
        finDate.getMinutes().toString().padStart(2, '0');
    document.getElementById('res-obj').innerText = reste;

    // Afficher les blocs de résultats
    document.getElementById('results').style.display = "block";
    document.getElementById('bilan-section').style.display = "block";
    
    save();
}

function updateChronoDisplay() {
    const diffMs = new Date() - startTime;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const sStr = startTime.getHours().toString().padStart(2, '0') + ":" + 
                 startTime.getMinutes().toString().padStart(2, '0');
    
    // Ligne demandée : Début enregistré | Temps réel écoulé
    document.getElementById('start-info').innerText = `Début: ${sStr} | Réel: ${h}h ${m.toString().padStart(2, '0')}m`;
}

function comparer() {
    const qR = parseFloat(document.getElementById('real-qty').value);
    if (!qR || qR <= 0 || !startTime || tppCible === 0) return;
    
    const tpsEcouleMin = (new Date() - startTime) / 60000;
    
    // Cadence réelle (m s)
    const realTpp = tpsEcouleMin / qR;
    const rMin = Math.floor(realTpp);
    const rSec = Math.round((realTpp - rMin) * 60);
    document.getElementById('real-cadence').innerText = `${rMin}m${rSec.toString().padStart(2, '0')}s`;
    
    // Delta Minutes & Pourcentage (%)
    const tpsTheorique = qR * tppCible;
    const delta = Math.round(tpsTheorique - tpsEcouleMin);
    let pourcent = 0;
    if (tpsTheorique > 0) {
        pourcent = Math.round((delta / tpsTheorique) * 100);
    }

    const dEl = document.getElementById('real-delta');
    if (delta >= 0) {
        dEl.innerText = `+${delta} min (+${pourcent}%)`;
        dEl.style.color = "var(--green)";
    } else {
        dEl.innerText = `${delta} min (${pourcent}%)`;
        dEl.style.color = "var(--red)";
    }
}

function toggleReprise() {
    const isChecked = document.getElementById('check').checked;
    document.getElementById('done-div').classList.toggle('hidden', !isChecked);
    save();
}

// --- 6. SAUVEGARDE (LocalStorage) ---

function save() {
    const data = {
        r: document.getElementById('ref').value,
        s: document.getElementById('setup').value,
        q: document.getElementById('qte').value,
        t: document.getElementById('time').value,
        d: document.getElementById('done').value,
        c: document.getElementById('check').checked,
        st: startTime ? startTime.getTime() : null,
        tpp: tppCible
    };
    localStorage.setItem('cnc_nano_v42', JSON.stringify(data));
}

function loadData() {
    const s = JSON.parse(localStorage.getItem('cnc_nano_v42'));
    if (s) {
        document.getElementById('ref').value = s.r || "";
        document.getElementById('setup').value = s.s || 0;
        document.getElementById('qte').value = s.q || "";
        document.getElementById('time').value = s.t || "";
        document.getElementById('done').value = s.d || 0;
        document.getElementById('check').checked = s.c || false;
        if (s.st) {
            startTime = new Date(s.st);
            tppCible = s.tpp || 0;
            document.getElementById('results').style.display = "block";
            document.getElementById('bilan-section').style.display = "block";
        }
        toggleReprise();
    }
}