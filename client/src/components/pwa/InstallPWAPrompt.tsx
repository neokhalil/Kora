import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus, ArrowRight } from 'lucide-react';
import '@/styles/pwa-install.css';

// Interface pour l'événement BeforeInstallPrompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt: React.FC = () => {
  // États du composant
  const [isVisible, setIsVisible] = useState(true); // Forcer l'affichage pour tester
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  
  // Log pour vérifier le chargement du composant
  console.log('InstallPWAPrompt chargé, isVisible:', isVisible);
  
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
        isMobile: /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
      });
      
      // Pour le test, simuler iOS sur tous les appareils mobiles
      if (/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
        setIsIOS(true);
        setIsAndroid(false);
      } else {
        setIsIOS(isAppleDevice);
        setIsAndroid(isAndroidDevice);
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
      
      // Vérifier si on a déjà ignoré cette invite
      const hasUserDismissed = localStorage.getItem('pwa-dismissed');
      
      // Activer la bannière si l'événement beforeinstallprompt est déclenché
      // (Android/Chrome) ou si c'est iOS
      console.log('Activation de la bannière, conditions:', {
        deferredPrompt: !!deferredPrompt,
        isIOS,
        hasUserDismissed: !!hasUserDismissed
      });
      
      // Rendre la bannière visible quelle que soit la condition
      setIsVisible(true);
      
      // Le code original qui sera restauré plus tard
      // if ((deferredPrompt || isIOS) && !hasUserDismissed) {
      //   setIsVisible(true);
      // }
    };
    
    // Détecter iOS Stand-alone mode
    const isInStandaloneMode = () => 
      'standalone' in window.navigator && (window.navigator as any).standalone;
    
    // Sur iOS, afficher la bannière si:
    // 1. C'est iOS
    // 2. On n'est pas déjà en mode standalone
    // 3. L'utilisateur n'a pas ignoré l'invite
    const checkIOSInstall = () => {
      if (isIOS && !isInStandaloneMode()) {
        const hasUserDismissed = localStorage.getItem('pwa-dismissed');
        if (!hasUserDismissed) {
          setIsVisible(true);
        }
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Vérifier spécifiquement pour iOS et forcer l'affichage pour le test
    console.log('Vérification iOS:', isIOS);
    
    // Forcer l'affichage pour le test, que ce soit iOS ou non
    setIsVisible(true);
    
    // Simulation pour le test
    if (navigator.userAgent.toLowerCase().includes('mobile')) {
      console.log('Appareil mobile détecté:', navigator.userAgent);
      // Simuler un appareil iOS pour le test
      setIsIOS(true);
    }
    
    if (isIOS) {
      checkIOSInstall();
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
          // Cacher la bannière une fois installée
          setIsVisible(false);
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
      {/* Bannière d'installation principale */}
      <div className="pwa-install-banner">
        <div className="banner-content">
          <div className="banner-icon">
            <Download size={16} />
          </div>
          <div className="banner-text">
            {isIOS ? 'Installer Kora sur iPhone' : 'Ajouter Kora à l\'écran d\'accueil'}
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