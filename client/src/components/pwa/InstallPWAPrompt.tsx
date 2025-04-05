import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus, ArrowRight, Info } from 'lucide-react';
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

// Clé de localStorage pour mémoriser le choix de l'utilisateur concernant la bannière
const PWA_DISMISSED_KEY = 'kora-pwa-dismissed';

// Déterminer si nous sommes en mode développement
const isDev = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ fixedPositionTop = 56 }) => {
  // États du composant
  const [isVisible, setIsVisible] = useState(false); // Par défaut invisible, sera activé si les conditions sont remplies
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false); // Désactivé par défaut, même en développement
  
  // Fonction utilitaire - Détection des appareils mobiles
  const detectMobileDevice = () => {
    // 1. Détection par User-Agent (la plus fiable)
    const byUserAgent = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // 2. Détection par taille d'écran (complémentaire)
    const byScreenSize = window.innerWidth <= 768;
    
    // 3. Détection par points tactiles (si disponible)
    const hasTouchPoints = window.navigator.maxTouchPoints > 0;
    
    // 4. Option forcée pour le debug
    const forceValue = localStorage.getItem('kora-force-mobile');
    
    if (forceValue === 'true') return true;
    if (forceValue === 'false') return false;
    
    // Combinaison logique des méthodes
    return byUserAgent || (byScreenSize && hasTouchPoints);
  };
  
  // Fonction utilitaire - Détection du mode PWA installé
  const detectPWAInstalled = () => {
    // 1. Méthode standard pour la plupart des navigateurs
    const byDisplayMode = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // 2. Méthode spécifique pour iOS Safari
    const byIOSStandalone = 'standalone' in window.navigator && 
                           (window.navigator as any).standalone === true;
    
    // 3. Option forcée pour le debug
    const forceValue = localStorage.getItem('kora-force-pwa');
    
    if (forceValue === 'true') return true;
    if (forceValue === 'false') return false;
    
    return byDisplayMode || byIOSStandalone;
  };
  
  // Initialisation - Détection principale exécutée une seule fois
  useEffect(() => {
    // 1. Détecter le type d'appareil
    const mobileDevice = detectMobileDevice();
    setIsMobile(mobileDevice);
    
    // Détecter spécifiquement iOS et Android
    const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                         !(/Windows Phone/.test(navigator.userAgent));
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    
    setIsIOS(isAppleDevice);
    setIsAndroid(isAndroidDevice);
    
    // 2. Détecter si l'application est installée en PWA
    const pwaInstalled = detectPWAInstalled();
    setIsStandalone(pwaInstalled);
    
    // 3. Vérifier si l'utilisateur a précédemment rejeté la bannière
    const dismissed = localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
    
    // 4. DÉCISION FINALE: Afficher la bannière uniquement si...
    //    - C'est un mobile
    //    - L'app n'est PAS installée en mode PWA
    //    - L'utilisateur n'a PAS précédemment rejeté la bannière
    const shouldShowBanner = mobileDevice && !pwaInstalled && !dismissed;
    
    // Logs détaillés pour débogage
    console.group('PWA Install Banner - Détection');
    console.log('Type d\'appareil:', {
      mobile: mobileDevice,
      iOS: isAppleDevice,
      android: isAndroidDevice,
      userAgent: navigator.userAgent,
    });
    console.log('État PWA:', {
      isInstalled: pwaInstalled,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      iOSStandalone: 'standalone' in window.navigator ? (window.navigator as any).standalone : 'non-iOS'
    });
    console.log('Préférences utilisateur:', {
      dismissed: dismissed,
      dismissKey: localStorage.getItem(PWA_DISMISSED_KEY)
    });
    console.log('Décision finale:', {
      afficherBannière: shouldShowBanner
    });
    console.groupEnd();
    
    // Appliquer la décision
    setIsVisible(shouldShowBanner);
    
    // 5. Écouter les changements de mode d'affichage (si l'utilisateur installe l'app)
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // L'application vient d'être installée et est maintenant en mode standalone
        console.log('Application installée, passage en mode standalone détecté');
        setIsStandalone(true);
        setIsVisible(false);
      }
    };
    
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener('change', handleDisplayModeChange);
      return () => displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    }
  }, []);
  
  // Gestion de l'événement beforeinstallprompt (pour Chrome/Android)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('Événement beforeinstallprompt capturé ✅');
      e.preventDefault();
      
      // Stocker l'événement pour pouvoir déclencher l'invite plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Vérifier à nouveau les conditions d'affichage
      const pwaInstalled = detectPWAInstalled();
      const dismissed = localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
      
      // Si les conditions sont remplies, afficher la bannière
      if (isMobile && !pwaInstalled && !dismissed) {
        console.log('Bannière activée suite à l\'événement beforeinstallprompt');
        setIsVisible(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isMobile]); // Dépend uniquement de isMobile qui est défini dans le premier useEffect

  // Gérer le clic sur le bouton d'installation
  const handleInstallClick = async () => {
    // Vérifier si l'application est déjà installée
    if (detectPWAInstalled()) {
      console.log('Application déjà installée en PWA, bannière cachée');
      setIsVisible(false);
      return;
    }
    
    if (isIOS) {
      // Sur iOS, montrer le guide d'installation (pas d'API d'installation)
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      // Sur Android/Chrome, utiliser l'API d'installation
      try {
        // Déclencher la boîte de dialogue d'installation
        await deferredPrompt.prompt();
        
        // Obtenir le résultat du choix de l'utilisateur
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ Installation acceptée par l\'utilisateur');
          setIsVisible(false);
          // Réinitialiser pour que la bannière n'apparaisse plus après installation
          localStorage.removeItem(PWA_DISMISSED_KEY);
        } else {
          console.log('❌ Installation refusée par l\'utilisateur');
          // Mémoriser que l'utilisateur a refusé l'installation
          localStorage.setItem(PWA_DISMISSED_KEY, 'true');
          setIsVisible(false);
        }
        
        // L'événement deferredPrompt ne peut être utilisé qu'une seule fois
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
      }
    } else {
      console.log('Aucun événement d\'installation disponible');
      // Fallback pour iOS sans prompt événement
      if (isIOS) {
        setShowIOSGuide(true);
      }
    }
  };

  // Gérer le clic sur le bouton de fermeture
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    console.log('Bannière fermée par l\'utilisateur, préférence enregistrée');
  };
  
  // Fonction pour réinitialiser les préférences (pour le debug)
  const resetPreferences = () => {
    localStorage.removeItem(PWA_DISMISSED_KEY);
    localStorage.removeItem('kora-force-mobile');
    localStorage.removeItem('kora-force-pwa');
    setIsVisible(isMobile && !isStandalone);
    console.log('Préférences PWA réinitialisées');
  };

  // Si la bannière ne doit pas être visible et qu'on n'est pas en mode debug, ne rien afficher
  if (!isVisible && !debugVisible) return null;

  return (
    <>
      {/* Bannière d'installation principale avec position personnalisée */}
      {isVisible && (
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
      )}

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
              localStorage.setItem(PWA_DISMISSED_KEY, 'true'); // Utiliser la constante définie en haut
            }}
          >
            J'ai compris
          </button>
        </div>
      )}
      
      {/* Panneau de débogage - visible uniquement en développement */}
      {debugVisible && (
        <div className="pwa-debug-panel">
          <div className="debug-header">
            <h4>PWA Debug Panel</h4>
            <button onClick={() => setDebugVisible(false)} className="debug-close">
              <X size={14} />
            </button>
          </div>
          
          <div className="debug-content">
            <p>Mobile: <span className={isMobile ? 'true' : 'false'}>{String(isMobile)}</span></p>
            <p>iOS: <span className={isIOS ? 'true' : 'false'}>{String(isIOS)}</span></p>
            <p>Android: <span className={isAndroid ? 'true' : 'false'}>{String(isAndroid)}</span></p>
            <p>Standalone: <span className={isStandalone ? 'true' : 'false'}>{String(isStandalone)}</span></p>
            <p>Banner Visible: <span className={isVisible ? 'true' : 'false'}>{String(isVisible)}</span></p>
            <p>Dismissed: <span className={localStorage.getItem(PWA_DISMISSED_KEY) === 'true' ? 'true' : 'false'}>
              {localStorage.getItem(PWA_DISMISSED_KEY) === 'true' ? 'true' : 'false'}
            </span></p>
          </div>
          
          <div className="debug-actions">
            <button 
              className="debug-btn" 
              onClick={() => {
                localStorage.setItem('kora-force-mobile', 'true');
                setIsMobile(true);
                setIsVisible(true && !isStandalone && localStorage.getItem(PWA_DISMISSED_KEY) !== 'true');
              }}
            >
              Force Mobile: ON
            </button>
            <button 
              className="debug-btn" 
              onClick={() => {
                localStorage.setItem('kora-force-mobile', 'false');
                setIsMobile(detectMobileDevice());
                setIsVisible(false);
              }}
            >
              Force Mobile: OFF
            </button>
            <button 
              className="debug-btn reset" 
              onClick={resetPreferences}
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWAPrompt;