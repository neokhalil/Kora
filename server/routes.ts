import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Questions API endpoints
  app.get('/api/questions/recent', async (req: Request, res: Response) => {
    try {
      const recentQuestions = await storage.getRecentQuestions();
      res.json(recentQuestions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recent questions' });
    }
  });

  app.post('/api/questions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const newQuestion = await storage.createQuestion(validatedData);
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid question data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create question' });
      }
    }
  });

  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    try {
      const question = await storage.getQuestion(parseInt(req.params.id));
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch question' });
    }
  });

  // Discussion topics API endpoints
  app.get('/api/topics', async (req: Request, res: Response) => {
    try {
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topics' });
    }
  });

  app.get('/api/topics/:id', async (req: Request, res: Response) => {
    try {
      const topic = await storage.getTopic(parseInt(req.params.id));
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topic' });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: "Bonjour ! Je suis Kora, ton assistant éducatif. Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date().toISOString()
    }));

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        // Process the message based on content
        if (data.type === 'chat') {
          // Simulate a response
          setTimeout(() => {
            // Only send if client is still connected
            if (ws.readyState === WebSocket.OPEN) {
              // Check if message contains certain keywords for education-related content
              const content = data.content.toLowerCase();
              let response;

              if (content.includes('équation') || content.includes('mathématique') || 
                  content.includes('algèbre') || content.includes('2x')) {
                // Math response
                response = {
                  type: 'chat',
                  content: "D'accord ! Si tu as une équation comme 2x + 3 = 11, on peut la résoudre ensemble.\n\nPour isoler x, voici comment faire :\n\n1. D'abord, soustrais 3 des deux côtés :\n2x + 3 - 3 = 11 - 3\nCe qui donne : 2x = 8\n\n2. Ensuite, divise les deux côtés par 2 :\n2x / 2 = 8 / 2\nCe qui donne : x = 4\n\nDonc, la solution est x = 4. Si tu as une autre équation ou une question, n'hésite pas à demander !",
                  includeSteps: true,
                  timestamp: new Date().toISOString()
                };
              } else if (content.includes('français') || content.includes('littérature') || 
                          content.includes('grammaire') || content.includes('dissertation')) {
                // French/literature response
                response = {
                  type: 'chat',
                  content: "Pour rédiger une bonne dissertation en français, il faut suivre une structure claire :\n\n1. Introduction : présenter le sujet et la problématique\n2. Développement : organiser plusieurs parties avec des arguments et exemples\n3. Conclusion : synthétiser et ouvrir sur une réflexion plus large\n\nJe peux t'aider à structurer ta réflexion si tu me donnes plus de détails sur ton sujet.",
                  timestamp: new Date().toISOString()
                };
              } else {
                // General response
                response = {
                  type: 'chat',
                  content: "Je peux t'aider avec ça. Pourrais-tu me donner plus de détails sur ta question ? Je peux t'aider avec des équations, des problèmes de géométrie, des analyses de textes, etc.",
                  timestamp: new Date().toISOString()
                };
              }

              ws.send(JSON.stringify(response));
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        
        // Send error message if client is still connected
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: "Désolé, je n'ai pas compris ta demande. Peux-tu réessayer ?",
            timestamp: new Date().toISOString()
          }));
        }
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
