import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        }
      }
    };
  }
}

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  locale?: string;
}

/**
 * Composant pour l'authentification avec Google Identity Services
 */
export default function GoogleAuthButton({
  onSuccess,
  text = "signin_with",
  theme = "outline",
  size = "large",
  shape = "rectangular",
  width,
  locale = "fr"
}: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // Fonction de rappel pour gérer la réponse d'authentification Google
  const handleCredentialResponse = async (response: any) => {
    // Vérifier que nous avons reçu un jeton d'identité
    if (response.credential) {
      try {
        // Envoyer le jeton d'identité au serveur pour vérification et création de session
        const result = await apiRequest('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ credential: response.credential }),
        });
        
        // Si la requête a réussi, appeler le callback de succès
        if (result && onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Erreur lors de l\'authentification Google:', error);
      }
    }
  };

  // Initialiser le bouton Google Sign-In lors du montage du composant
  useEffect(() => {
    // Vérifier que le SDK Google est chargé
    if (!window.google) {
      // Charger le SDK Google Sign-In
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = initializeGoogleSignIn;
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  // Fonction d'initialisation du bouton Google Sign-In
  const initializeGoogleSignIn = () => {
    if (window.google && window.google.accounts && buttonRef.current) {
      // Configuration Google Sign-In
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      // Rendu du bouton Google Sign-In
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme,
        size,
        text,
        shape,
        width,
        locale,
      });
    }
  };

  // Rendu du conteneur pour le bouton Google Sign-In
  return (
    <div className="flex justify-center items-center">
      <div ref={buttonRef} className="google-signin-button"></div>
    </div>
  );
}