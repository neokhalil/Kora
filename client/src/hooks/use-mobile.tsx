import * as React from "react"

// Augmenter la breakpoint à 991px pour s'assurer que nous avons suffisamment d'espace pour le design desktop
const MOBILE_BREAKPOINT = 991

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(true)

  React.useEffect(() => {
    // Fonction pour vérifier la taille de l'écran
    const checkScreenSize = () => {
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isNarrow)
      console.log("Screen width:", window.innerWidth, "isMobile:", isNarrow)
    }
    
    // Vérifier immédiatement au chargement
    checkScreenSize()
    
    // Ajouter un écouteur pour les changements de taille
    window.addEventListener("resize", checkScreenSize)
    
    // Nettoyer l'écouteur lors du démontage
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return isMobile
}
