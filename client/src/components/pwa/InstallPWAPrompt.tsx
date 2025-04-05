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
  const [isVisible, setIsVisible] = useState(true); // Défaut : visible, sera ajusté dans useEffect
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Logs pour debug
  console.log('InstallPWAPrompt rendu, état bannière:', isVisible);
  
  // Détection PWA/Standalone
  const checkStandaloneMode = () => {
    // Détection multi-méthodes pour couvrir tous les navigateurs
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: fullscreen)').matches || 
      window.matchMedia('(display-mode: minimal-ui)').matches || 
      (window.navigator as any).standalone === true || // iOS Safari spécifique
      // Vérifier l'URL pour les PWA (pas de barre d'adresse visible)
      window.location.href.includes('homescreen') ||
      document.referrer.includes('android-app://');
    
    console.log('Vérification mode standalone:', standalone);
    setIsStandalone(standalone);
    return standalone;
  };
  
  // Initialisation et détection
  useEffect(() => {
    const detectDevice = () => {
      // Détecter iOS
      const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(/Windows Phone/.test(navigator.userAgent));
      
      // Détecter Android
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      
      // Détecter mobile en général
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Mettre à jour les états
      setIsIOS(isAppleDevice);
      setIsAndroid(isAndroidDevice);
      setIsMobile(isMobileDevice);
      
      // Logs détaillés pour debug
      console.log('Détection appareil:', {
        userAgent: navigator.userAgent,
        isIOS: isAppleDevice,
        isAndroid: isAndroidDevice,
        isMobile: isMobileDevice
      });
      
      return { isAppleDevice, isAndroidDevice, isMobileDevice };
    };
    
    // Bannière uniquement pour mobiles
    const { isMobileDevice } = detectDevice();
    
    if (!isMobileDevice) {
      console.log('Appareil non mobile, bannière masquée');
      setIsVisible(false);
      return;
    }
    
    // Vérifier si c'est une PWA déjà installée
    const isPWA = checkStandaloneMode();
    if (isPWA) {
      console.log('C\'est une PWA installée, bannière masquée');
      setIsVisible(false);
      return;
    }
    
    // Si l'utilisateur a rejeté la bannière précédemment
    const hasRejected = localStorage.getItem('pwa-dismissed');
    if (hasRejected) {
      console.log('Bannière précédemment rejetée, non affichée');
      setIsVisible(false);
      return;
    }
    
    // Si on arrive ici, on est sur mobile, pas en PWA, et pas rejeté → afficher
    console.log('Conditions ok pour afficher la bannière');
    setIsVisible(true);
    
    // Détecter les changements de mode d'affichage
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        console.log('Passage en mode standalone détecté');
        setIsVisible(false);
      }
    };
    
    if (standaloneMediaQuery.addEventListener) {
      standaloneMediaQuery.addEventListener('change', handleMediaChange);
    }
    
    return () => {
      if (standaloneMediaQuery.removeEventListener) {
        standaloneMediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);
  
  // Gestionnaire pour beforeinstallprompt (spécifique Android/Chrome)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('Événement beforeinstallprompt capturé');
      e.preventDefault();
      
      // Stocker l'événement pour l'installer plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Si déjà en PWA ou rejeté avant, ne pas montrer
      if (isStandalone || localStorage.getItem('pwa-dismissed')) {
        return;
      }
      
      // Si on est sur mobile et l'événement est capturé, on peut installer
      if (isMobile) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile, isStandalone]);

  // Gérer le clic sur le bouton d'installation
  const handleInstallClick = async () => {
    // Si l'application est déjà installée en PWA, cacher la bannière
    if (isStandalone) {
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
      // Pour iOS sans événement, afficher le guide d'installation
      if (isIOS) {
        setShowIOSGuide(true);
      }
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
      {isIOS && showIOSGuide && !isStandalone && (
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