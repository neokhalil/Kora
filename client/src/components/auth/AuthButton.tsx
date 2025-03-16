import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import GoogleAuthButton from './GoogleAuthButton';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';

/**
 * Composant de bouton d'authentification qui affiche soit un bouton de connexion,
 * soit les informations de l'utilisateur connecté avec un bouton de déconnexion
 */
const AuthButton: React.FC = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { toast } = useToast();

  const handleGoogleAuthSuccess = () => {
    toast({
      title: "Connexion réussie",
      description: "Vous êtes maintenant connecté à votre compte",
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de votre compte",
    });
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline" size="sm" className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
        Chargement...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'Utilisateur'} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-sm font-medium hidden md:inline-block">
            {user.name || user.email}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-1 hidden md:inline-block">Déconnexion</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <GoogleAuthButton 
        onSuccess={handleGoogleAuthSuccess}
        text="signin_with"
        shape="pill"
        theme="filled_blue"
      />
    </div>
  );
};

export default AuthButton;