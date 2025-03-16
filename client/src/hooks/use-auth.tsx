import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  remainingUsage: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null);

  // Fonction pour charger l'utilisateur connecté
  const loadUser = async () => {
    try {
      setIsLoading(true);
      // Récupérer le token stocké
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Appeler l'API pour obtenir les informations de l'utilisateur
      const response = await apiRequest<{ isAuthenticated: boolean; user: User }>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.isAuthenticated && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Supprimer le token s'il n'est plus valide
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      // Supprimer le token en cas d'erreur
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'utilisateur au chargement du composant
  useEffect(() => {
    loadUser();
  }, []);

  // Fonction de connexion
  const login = async (token: string) => {
    localStorage.setItem('auth_token', token);
    await loadUser();
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Appeler l'API de déconnexion
      await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours supprimer le token et réinitialiser l'état d'authentification
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      setRemainingUsage(null);
    }
  };

  // Fournir le contexte d'authentification
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        remainingUsage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}