import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";

// Import Tailwind CSS
import "./index.css";

// Import des fichiers CSS originaux pour maintenir la compatibilité
import "./styles/text.css"; // Styles de texte simples
import "./styles/animations.css"; // Animations pour l'interface utilisateur
import "./styles/web-home.css"; // Styles spécifiques pour la vue web de la page d'accueil
import "./styles/mathjax.css"; // Styles pour MathJax et la coloration syntaxique
import "./styles/content-renderer.css"; // Styles pour le nouveau ContentRenderer
import "./styles/mobile-fixes.css"; // Corrections spécifiques pour mobile avec maths et code
import "./styles/header-fix.css"; // Solution définitive pour le header fixe

// Début d'intégration de la nouvelle architecture CSS (tests progressifs)
import "./styles/components/math.css"; // ITCSS: Styles pour le rendu mathématique

// Appliquer les corrections de viewport mobile
if (typeof window !== 'undefined') {
  setupMobileViewportFix();
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
