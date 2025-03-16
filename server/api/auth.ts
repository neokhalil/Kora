import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Initialiser le client OAuth Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Générer un token JWT
export const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET || 'your-jwt-secret';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
};

// Vérifier un token JWT
export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET || 'your-jwt-secret';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Middleware pour vérifier l'authentification
export const authMiddleware = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (payload && typeof payload === 'object' && 'sub' in payload) {
      // Ajouter l'ID utilisateur à la requête
      (req as any).userId = payload.sub;
      next();
    } else {
      res.status(401).json({ error: 'Token invalide' });
    }
  } else {
    res.status(401).json({ error: 'Authentification requise' });
  }
};

// Limite d'utilisation sans authentification
export const ANONYMOUS_USAGE_LIMIT = 3;

// Middleware pour limiter l'utilisation ou exiger l'authentification
export const limitUsageMiddleware = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  // Si l'utilisateur est authentifié, autoriser l'accès
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (payload && typeof payload === 'object' && 'sub' in payload) {
      (req as any).userId = payload.sub;
      return next();
    }
  }
  
  // Vérifier le nombre d'utilisations anonymes
  const anonymousUsage = req.session?.anonymousUsage || 0;
  
  if (anonymousUsage >= ANONYMOUS_USAGE_LIMIT) {
    return res.status(403).json({ 
      error: 'Limite d\'utilisation anonyme atteinte', 
      requiresAuth: true 
    });
  }
  
  // Incrémenter le compteur d'utilisation anonyme
  if (req.session) {
    req.session.anonymousUsage = anonymousUsage + 1;
  }
  next();
};

// Gérer l'authentification Google
export const handleGoogleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    
    // Vérifier le jeton d'identité Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // Obtenir les informations de l'utilisateur depuis le payload
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ error: 'Jeton d\'identité invalide' });
    }
    
    const { sub, email, name, picture } = payload;
    
    // Vérifier si l'utilisateur existe déjà
    let user = await db.query.users.findFirst({
      where: eq(users.email, email as string),
    });
    
    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      const newUsers = await db.insert(users).values({
        email: email as string,
        name: name as string,
        image: picture,
        username: email?.split('@')[0] || `user_${Date.now()}`,
      }).returning();
      
      user = newUsers[0];
    }
    
    // Générer un token JWT pour l'utilisateur
    const token = generateToken(user.id as string);
    
    // Effacer le compteur d'utilisation anonyme
    if (req.session) {
      req.session.anonymousUsage = 0;
    }
    
    // Renvoyer le jeton et les informations utilisateur
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Erreur d\'authentification Google:', error);
    res.status(500).json({ error: 'Erreur lors de l\'authentification' });
  }
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId as string),
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Renvoyer les informations de l'utilisateur (sans le mot de passe)
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Déconnexion
export const handleLogout = (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Déconnecté avec succès' });
    });
  } else {
    res.json({ message: 'Déconnecté avec succès' });
  }
};