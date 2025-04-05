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
  const [isVisible, setIsVisible] = useState(false); // Par défaut, la bannière est cachée
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  
  // Log pour vérifier le chargement du composant
  console.log('InstallPWAPrompt chargé, isVisible:', isVisible);
  
  // Vérifier si l'application est déjà en mode standalone (PWA installée)
  const isInStandaloneMode = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true // iOS Safari
    );
  };
  
  // Détection des dispositifs
  useEffect(() => {
    const checkDevice = () => {
      // Vérifier si c'est iOS (sans utiliser MSStream qui n'est pas standard)
      const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(/Windows Phone/.test(navigator.userAgent));
      
      // Vérifier si c'est Android
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      
      // Logs pour le debug
      console.log('Détection dispositif:', {
        userAgent: navigator.userAgent,
        isAppleDevice,
        isAndroidDevice,
        isMobile: /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent),
        isStandalone: isInStandaloneMode()
      });
      
      // Détection correcte pour appareils mobiles
      setIsIOS(isAppleDevice);
      setIsAndroid(isAndroidDevice);
      
      // Si l'application est déjà installée en PWA, ne pas afficher la bannière
      if (isInStandaloneMode()) {
        console.log('Application détectée comme PWA installée, bannière cachée');
        setIsVisible(false);
        return;
      }
      
      // Vérifier si l'utilisateur a déjà refusé la bannière
      const hasUserDismissed = localStorage.getItem('pwa-dismissed');
      if (hasUserDismissed) {
        console.log('Bannière masquée car déjà refusée par utilisateur');
        setIsVisible(false);
        return;
      }
      
      // Afficher uniquement sur mobile quand l'app n'est pas installée
      const isMobileDevice = /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isMobileDevice && !isInStandaloneMode()) {
        console.log('Conditions réunies pour afficher la bannière');
        setIsVisible(true);
      } else {
        console.log('Conditions non réunies pour la bannière');
        setIsVisible(false);
      }
    };
    
    checkDevice();
  }, []);

  // Capturer l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher Chrome 67+ de montrer automatiquement sa bannière
      e.preventDefault();
      
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Si l'app est déjà en mode standalone, ne pas afficher la bannière
      if (isInStandaloneMode()) {
        console.log('Application en mode standalone, pas de bannière');
        return;
      }
      
      // Vérifier si on a déjà ignoré cette invite
      const hasUserDismissed = localStorage.getItem('pwa-dismissed');
      
      // Logs pour debug
      console.log('Événement beforeinstallprompt reçu:', {
        deferredPrompt: !!e,
        isIOS,
        hasUserDismissed: !!hasUserDismissed,
        isStandalone: isInStandaloneMode()
      });
      
      // Afficher la bannière seulement si l'app n'est pas installée et pas refusée avant
      if (!hasUserDismissed && !isInStandaloneMode()) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Media query pour détecter les changements de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // L'application est maintenant en mode standalone
        console.log('Application maintenant en mode standalone, masquer bannière');
        setIsVisible(false);
      }
    };
    
    // S'abonner aux changements de mode d'affichage
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, [isIOS]);

  // Gérer le clic sur le bouton d'installation
  const handleInstallClick = async () => {
    // Si l'application est déjà installée en PWA, cacher la bannière
    if (isInStandaloneMode()) {
      console.log('Application déjà installée en PWA, bannière cachée');
      setIsVisible(false);
      return;
    }
    
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
          // Cacher la bannière une fois installée et effacer la clé du localStorage
          setIsVisible(false);
          localStorage.removeItem('pwa-dismissed'); // Réinitialiser pour que l'utilisateur ne voie pas la bannière à nouveau
        } else {
          console.log('Utilisateur a refusé l\'installation');
          // Stocker le choix de l'utilisateur
          localStorage.setItem('pwa-dismissed', 'true');
          setIsVisible(false);
        }
        
        // On ne peut utiliser deferredPrompt qu'une fois
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
      }
    } else {
      console.log('Aucun événement prompt disponible, impossible d\'installer');
    }
  };

  // Gérer le clic sur le bouton de fermeture
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', 'true');
    console.log('Bannière fermée par l\'utilisateur');
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

      {/* Guide d'installation pour iOS - vérifier si l'app n'est pas déjà installée */}
      {isIOS && showIOSGuide && !isInStandaloneMode() && (
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
              setShowIOSGuide(false);
              setIsVisible(false);
              localStorage.setItem('pwa-dismissed', 'true'); // Mémoriser que l'utilisateur a fermé le guide
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