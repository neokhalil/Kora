import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus, ArrowRight } from 'lucide-react';
import '@/styles/pwa-install.css';

// Propriété pour accepter positionTop en option
interface InstallPWAPromptProps {
  fixedPositionTop?: number;
}

// Interface pour l'événement BeforeInstallPrompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ fixedPositionTop = 56 }) => {
  // États du composant
  const [isVisible, setIsVisible] = useState(false); // Par défaut, la bannière est masquée
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Log pour vérifier le chargement du composant
  console.log('InstallPWAPrompt chargé');
  
  // Détecter si nous sommes en mode standalone (PWA installée)
  const checkIfStandalone = () => {
    // Vérifier si l'app est installée (mode standalone)
    const isInStandaloneMode = 
      (window.matchMedia('(display-mode: standalone)').matches) || // Chrome, Edge
      (window.matchMedia('(display-mode: fullscreen)').matches) || // Samsung Internet
      (window.matchMedia('(display-mode: minimal-ui)').matches) || // Chrome Mobile
      (window.navigator as any).standalone === true; // iOS Safari
    
    console.log('Mode standalone détecté:', isInStandaloneMode);
    setIsStandalone(isInStandaloneMode);
    return isInStandaloneMode;
  };
  
  // Détection des dispositifs
  useEffect(() => {
    const checkDevice = () => {
      // Vérifier si c'est iOS (sans utiliser MSStream qui n'est pas standard)
      const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(/Windows Phone/.test(navigator.userAgent));
      
      // Vérifier si c'est Android
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      
      // Vérifier si c'est en mode standalone (app installée)
      const inStandaloneMode = checkIfStandalone();
      
      // Logs pour le debug
      console.log('Détection dispositif:', {
        userAgent: navigator.userAgent,
        isAppleDevice,
        isAndroidDevice,
        inStandaloneMode,
        isMobile: /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
      });
      
      // Détection correcte pour appareils mobiles
      setIsIOS(isAppleDevice);
      setIsAndroid(isAndroidDevice);
    };
    
    checkDevice();
    
    // Ajouter un écouteur pour détecter les changements de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkIfStandalone();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Capturer l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher Chrome 67+ de montrer automatiquement sa bannière
      e.preventDefault();
      
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Vérifier si on a déjà ignoré cette invite
      const hasUserDismissed = localStorage.getItem('pwa-dismissed');
      
      console.log('Event beforeinstallprompt détecté');
      
      // Ne pas montrer la bannière si:
      // 1. L'app est déjà installée en mode standalone
      // 2. L'utilisateur a déjà ignoré la bannière
      if (!checkIfStandalone() && !hasUserDismissed) {
        console.log('Affichage de la bannière sur Android');
        setIsVisible(true);
      } else {
        console.log('Bannière masquée car app déjà installée ou invite refusée');
      }
    };
    
    // Sur iOS, afficher la bannière si:
    // 1. C'est iOS
    // 2. On n'est pas déjà en mode standalone
    // 3. L'utilisateur n'a pas ignoré l'invite
    const checkIOSInstall = () => {
      // Vérifier si on est en mode standalone sur iOS
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isIOS && !isIOSStandalone) {
        const hasUserDismissed = localStorage.getItem('pwa-dismissed');
        if (!hasUserDismissed) {
          console.log('Affichage de la bannière sur iOS');
          setIsVisible(true);
        } else {
          console.log('Bannière iOS masquée car invite refusée');
        }
      } else if (isIOS && isIOSStandalone) {
        console.log('Bannière iOS masquée car déjà installée');
      }
    };
    
    // Ajouter l'écouteur pour l'événement beforeinstallprompt (Android)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Vérification initiale
    const isAlreadyInstalledManually = localStorage.getItem('pwa-installed') === 'true';
    const hasUserDismissed = localStorage.getItem('pwa-dismissed') === 'true';
    
    // Si l'app est déjà installée (détecté par le mode standalone ou marqué comme installé)
    if (checkIfStandalone() || isAlreadyInstalledManually) {
      console.log('Bannière masquée car app déjà installée');
      setIsVisible(false);
    } 
    // Si l'utilisateur a déjà refusé l'invitation
    else if (hasUserDismissed) {
      console.log('Bannière masquée car invite refusée par utilisateur');
      setIsVisible(false);
    }
    // Sinon, afficher la bannière selon la plateforme
    else {
      if (isIOS) {
        checkIOSInstall();
      }
      // Pour Android, l'événement beforeinstallprompt gère l'affichage
      // La bannière ne s'affiche que si l'événement est déclenché
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isIOS, deferredPrompt]);

  // Gérer le clic sur le bouton d'installation
  const handleInstallClick = async () => {
    if (isIOS) {
      // Pour iOS, montrer le guide d'installation
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      // Pour Android et autres, utiliser l'API
      try {
        // Afficher la boîte de dialogue d'installation
        await deferredPrompt.prompt();
        
        // Vérifier ce que l'utilisateur a choisi
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('Utilisateur a accepté l\'installation de l\'application');
          // Marquer comme installé dans localStorage
          localStorage.setItem('pwa-installed', 'true');
          // Cacher la bannière une fois installée
          setIsVisible(false);
          // Mettre à jour le statut standalone
          setIsStandalone(true);
          
          // Vérifier le mode standalone après un court délai
          // (permet au navigateur de mettre à jour son état)
          setTimeout(() => {
            checkIfStandalone();
          }, 1000);
        } else {
          console.log('Utilisateur a refusé l\'installation');
          // Stocker le choix de l'utilisateur
          localStorage.setItem('pwa-dismissed', 'true');
        }
        
        // On ne peut utiliser deferredPrompt qu'une fois
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
      }
    }
  };

  // Gérer le clic sur le bouton de fermeture
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // Si la bannière ne doit pas être visible, ne rien afficher
  if (!isVisible) return null;

  return (
    <>
      {/* Bannière d'installation principale avec position personnalisée */}
      <div 
        className="pwa-install-banner" 
        style={{ top: `${fixedPositionTop}px` }}
      >
        <div className="banner-content">
          <div className="banner-icon">
            <Download size={16} />
          </div>
          <div className="banner-text">
            Installer Kora sur votre téléphone
          </div>
        </div>
        
        <div className="banner-actions">
          <button 
            className="install-button"
            onClick={handleInstallClick}
          >
            Installer
          </button>
          <button 
            className="dismiss-button"
            onClick={handleDismiss}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Guide d'installation pour iOS */}
      {isIOS && showIOSGuide && (
        <div className="ios-install-guide">
          <div className="guide-header">
            <h3>Comment installer Kora</h3>
            <button onClick={() => setShowIOSGuide(false)} className="dismiss-button">
              <X size={18} />
            </button>
          </div>
          
          <div className="guide-steps">
            <p>
              1. Appuie sur l'icône <Share size={16} className="ios-icon" />
            </p>
            <p>
              2. Fais défiler et appuie sur <Plus size={16} className="ios-icon" /> "Sur l'écran d'accueil"
            </p>
            <p>
              3. Confirme en appuyant sur "Ajouter" <ArrowRight size={16} className="ios-icon" />
            </p>
          </div>
          
          <button 
            className="guide-close-btn"
            onClick={() => {
              // Marquer comme installé dans localStorage pour iOS
              localStorage.setItem('pwa-installed', 'true');
              setShowIOSGuide(false);
              setIsVisible(false);
            }}
          >
            J'ai compris
          </button>
        </div>
      )}
    </>
  );
};

export default InstallPWAPrompt;