import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";

// Import Tailwind CSS
import "./index.css";

// Contrôle des thèmes (clair/sombre) - doit être importé en premier pour priorité maximale
import "./styles/components/theme-control.css"; // Contrôle du thème et désactivation du mode sombre auto

// Settings ITCSS (variables globales et breakpoints)
import "./styles/settings/variables.css"; // Variables CSS globales
import "./styles/settings/breakpoints.css"; // Breakpoints standardisés pour responsive design

// Import des fichiers CSS originaux pour maintenir la compatibilité
import "./styles/text.css"; // Styles de texte simples
import "./styles/animations.css"; // Animations pour l'interface utilisateur
import "./styles/web-home.css"; // Styles spécifiques pour la vue web de la page d'accueil
import "./styles/mathjax.css"; // Styles pour MathJax et la coloration syntaxique
import "./styles/content-renderer.css"; // Styles pour le nouveau ContentRenderer
import "./styles/mobile-fixes.css"; // Corrections spécifiques pour mobile avec maths et code
import "./styles/header-fix.css"; // Solution définitive pour le header fixe

// Nouvelle architecture ITCSS (coexistence avec les anciens styles pendant la migration)
import "./styles/main.css"; // Fichier principal avec settings, generic, elements, objects et utilities
import "./styles/components/math.css"; // ITCSS: Styles pour le rendu mathématique
import "./styles/components/code.css"; // ITCSS: Styles pour les blocs de code
import "./styles/components/layout.css"; // ITCSS: Styles pour le layout (header, sidebar)
import "./styles/components/chat.css"; // ITCSS: Styles pour l'interface de chat
import "./styles/components/forms.css"; // ITCSS: Styles pour les formulaires
import "./styles/components/messages.css"; // ITCSS: Styles pour les messages et conversations
import "./styles/components/typography.css"; // ITCSS: Styles pour la typographie et les textes
import "./styles/components/welcome.css"; // ITCSS: Styles pour l'écran de bienvenue

// Fix spécifique pour desktop (doit être importé en dernier pour priorité maximale)
import "./styles/components/welcome-desktop-fix.css"; // Solution pour l'écran de bienvenue en version desktop

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
