# ⚙️ CNC NANO PRO v4.2
> Ton assistant de production d'atelier, directement sur ton S23.

---

### 🖥️ Aperçu de l'Interface

<div align="center">
  <img src="https://raw.githubusercontent.com/[TON_PSEUDO]/cnc-nano/main/icon.png" width="100" alt="Icon CNC NANO">
</div>

---

### 📱 Installation sur S23 (PWA)

Pour que l'application s'ouvre en **Plein Écran** et fonctionne **Hors-ligne** (sans internet) à l'atelier, suis ces étapes :

1.  **Ouvrir Chrome** : Va sur ton lien GitHub Pages : `https://[TON_PSEUDO].github.io/cnc-nano/`.
2.  **Menu (3 points)** : Clique sur les trois petits points en haut à droite.
3.  **Installer** : Choisis l'option **"Installer l'application"** (ou "Ajouter à l'écran d'accueil").
4.  **Terminé !** : Une icône avec la fraise bleue apparaît sur ton bureau. En cliquant dessus, l'app s'ouvre comme une vraie application indigène.

---

### 🚀 Fonctionnalités Clés

- **`Target Fin`** : Calcul précis de l'heure de fin théorique de ta série.
- **`Bilan Réel`** : Saisis tes pièces produites et vois instantanément ton **Delta** (avance/retard) en minutes.
- **`Performance (%)`** : Un indicateur d'efficacité en pourcentage (`+12%` en vert / `-8%` en rouge) pour savoir où tu en es.
- **`Chrono Actif`** : Affiche l'heure de début et le temps écoulé (`2h 15m`) depuis le lancement.
- **`Sauvegarde Auto`** : Tes données de commande ne s'effacent pas, même si tu fermes l'application.

---

### 🧮 Logique de Calcul (Mémo)

Si tu as un doute sur les calculs, voici les formules utilisées :

1.  **TPP Cible (Temps Par Pièce)** :
    ```text
    (Temps Alloué Total - Temps Montage/Setup) / Quantité Totale
    ```
2.  **Delta (Avance/Retard)** :
    ```text
    (Pièces Réalisées * TPP Cible) - Temps Écoulé
    ```
    *Un Delta positif (Vert) signifie que tu es en avance.*

---

### 📝 Notes de Version (Changelog)

| Version | Changements Majeurs |
| :--- | :--- |
| **v4.2** | Intégration PWA (Plein Écran, Hors-ligne via sw.js) & Icône stylisée. |
| **v4.1** | Ajout du calcul du % d'efficacité et couleur pour le Delta. |
| **v4.0** | Version de base avec TPP Cible, Fin Estimée et Bilan Réel. |

---

###### *Développé avec ❤️ pour l'usinage.*
