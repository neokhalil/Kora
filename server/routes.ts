import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage"; // Rename to avoid conflict with multer storage
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import { generateTutoringResponse, generateReExplanation, generateChallengeProblem, processImageQuery } from './openai';
import { handleAudioTranscription } from './whisper';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure file upload storage
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configure multer for image uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename with original extension
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });
  
  // File filter to only allow image files
  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  };
  
  const upload = multer({ 
    storage: multerStorage, 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
  });
  // Create a shared conversation history map for all types of interactions
  const userConversations = new Map<string, { role: 'user' | 'assistant', content: string }[]>();
  
  // Add image processing endpoint
  app.post('/api/image-analysis', upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      // Read the uploaded file
      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      
      // Get optional parameters
      const { subject = 'general', query = '', sessionId = 'default' } = req.body;
      
      // Process the image with OpenAI
      const response = await processImageQuery(imageBase64, query, subject);
      
      // Store conversation history in the shared map for use with WebSocket
      if (!userConversations.has(sessionId)) {
        userConversations.set(sessionId, []);
      }
      
      // Get the conversation history
      const conversationHistory = userConversations.get(sessionId) || [];
      
      // Add the current interaction to history
      conversationHistory.push({ 
        role: 'user', 
        content: query || "Analyse cette image s'il te plaît" 
      });
      
      conversationHistory.push({ 
        role: 'assistant', 
        content: response 
      });
      
      // Limit conversation history to last 10 messages
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, 2); // Remove oldest Q&A pair
      }
      
      // Update the map
      userConversations.set(sessionId, conversationHistory);
      
      // Return the response with conversation ID
      res.json({
        content: response,
        timestamp: new Date().toISOString(),
        sessionId
      });
      
      // Clean up - remove the temporary file
      fs.unlinkSync(imagePath);
      
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ message: 'Failed to process image' });
    }
  });
  
  // Questions API endpoints
  app.get('/api/questions/recent', async (req: Request, res: Response) => {
    try {
      const recentQuestions = await dbStorage.getRecentQuestions();
      res.json(recentQuestions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recent questions' });
    }
  });

  app.post('/api/questions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const newQuestion = await dbStorage.createQuestion(validatedData);
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
      const question = await dbStorage.getQuestion(parseInt(req.params.id));
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
      const topics = await dbStorage.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topics' });
    }
  });

  app.get('/api/topics/:id', async (req: Request, res: Response) => {
    try {
      const topic = await dbStorage.getTopic(parseInt(req.params.id));
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topic' });
    }
  });
  
  // AI Tutoring API Endpoints
  app.post('/api/tutoring/ask', async (req: Request, res: Response) => {
    try {
      const { question, messages } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      // Convert messages to the format expected by OpenAI
      const formattedMessages = messages && Array.isArray(messages) 
        ? messages.map(msg => ({ 
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const, 
            content: msg.content 
          }))
        : [];
      
      const response = await generateTutoringResponse(question, formattedMessages);
      
      res.json({ 
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in tutoring request:', error);
      res.status(500).json({ message: 'Failed to generate tutoring response' });
    }
  });
  
  app.post('/api/tutoring/reexplain', async (req: Request, res: Response) => {
    try {
      const { originalQuestion, originalExplanation } = req.body;
      
      if (!originalQuestion || !originalExplanation) {
        return res.status(400).json({ message: 'Original question and explanation are required' });
      }
      
      const response = await generateReExplanation(originalQuestion, originalExplanation);
      
      res.json({ 
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in re-explanation request:', error);
      res.status(500).json({ message: 'Failed to generate re-explanation' });
    }
  });
  
  app.post('/api/tutoring/challenge', async (req: Request, res: Response) => {
    try {
      const { originalQuestion, explanation } = req.body;
      
      if (!originalQuestion || !explanation) {
        return res.status(400).json({ message: 'Original question and explanation are required' });
      }
      
      const response = await generateChallengeProblem(originalQuestion, explanation);
      
      res.json({ 
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in challenge problem request:', error);
      res.status(500).json({ message: 'Failed to generate challenge problem' });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Track session ID for this connection
    let sessionId = 'default';

    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: "Bonjour ! Je suis Kora, ton assistant éducatif. Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date().toISOString(),
      sessionId
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Update session ID if provided
        if (data.sessionId) {
          sessionId = data.sessionId;
        }
        
        // Ensure this user has conversation history
        if (!userConversations.has(sessionId)) {
          userConversations.set(sessionId, []);
        }
        
        // Get conversation history for this session
        const conversationHistory = userConversations.get(sessionId) || [];

        // Process the message based on content
        if (data.type === 'chat') {
          // Let client know we're processing the request
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'status',
              status: 'thinking',
              timestamp: new Date().toISOString()
            }));
          }
          
          try {
            // Store user message
            conversationHistory.push({ role: 'user', content: data.content });
            userConversations.set(sessionId, conversationHistory);
            
            // Generate AI response
            const aiResponse = await generateTutoringResponse(data.content, conversationHistory);
            
            // Store AI response
            conversationHistory.push({ role: 'assistant', content: aiResponse });
            
            // Limit conversation history to last 10 messages to prevent token limits
            if (conversationHistory.length > 10) {
              conversationHistory.splice(0, 2); // Remove oldest Q&A pair
            }
            
            // Update the shared history
            userConversations.set(sessionId, conversationHistory);
            
            // Send response to client
            if (ws.readyState === WebSocket.OPEN) {
              const response = {
                type: 'chat',
                content: aiResponse,
                messageId: Date.now().toString(), // Unique ID for this message
                timestamp: new Date().toISOString(),
                allowActions: true, // Enable re-explain and challenge buttons
                sessionId
              };
              
              ws.send(JSON.stringify(response));
            }
          } catch (error) {
            console.error('Error generating AI response:', error);
            
            // Fallback response if AI fails
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat',
                content: "Je suis désolé, j'ai rencontré un problème en traitant ta question. Pourrais-tu reformuler ou essayer plus tard?",
                timestamp: new Date().toISOString()
              }));
            }
          }
        } else if (data.type === 'reexplain') {
          // Handle re-explanation request
          try {
            // Get the conversation history
            const recentMessages = [...conversationHistory];
            let originalQuestion = "Question originale non trouvée";
            let originalExplanation = "Explication originale non trouvée";
            
            // Find the latest user message
            for (let i = recentMessages.length - 1; i >= 0; i--) {
              if (recentMessages[i].role === 'user') {
                originalQuestion = recentMessages[i].content;
                // Look for the next assistant message after this user message
                for (let j = i + 1; j < recentMessages.length; j++) {
                  if (recentMessages[j].role === 'assistant') {
                    originalExplanation = recentMessages[j].content;
                    break;
                  }
                }
                break;
              }
            }
            
            console.log('Re-explaining based on recent context:', { 
              sessionId,
              originalQuestion, 
              originalExplanationLength: originalExplanation.length,
              historyLength: conversationHistory.length 
            });
            
            // Generate alternative explanation
            const alternativeExplanation = await generateReExplanation(
              originalQuestion, 
              originalExplanation
            );
            
            // Add to conversation history
            conversationHistory.push({ 
              role: 'assistant', 
              content: alternativeExplanation 
            });
            
            // Update shared history
            userConversations.set(sessionId, conversationHistory);
            
            // Send response to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat',
                content: alternativeExplanation,
                isReExplanation: true,
                timestamp: new Date().toISOString(),
                sessionId
              }));
            }
          } catch (error) {
            console.error('Error generating re-explanation:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: "Désolé, je n'ai pas pu générer une explication alternative. Veuillez réessayer.",
                timestamp: new Date().toISOString()
              }));
            }
          }
        } else if (data.type === 'challenge') {
          // Handle challenge request
          try {
            // Get the conversation history
            const recentMessages = [...conversationHistory];
            let originalQuestion = "Question non trouvée";
            let explanation = "Explication non trouvée";
            
            // Find the latest user message and corresponding assistant response
            for (let i = recentMessages.length - 1; i >= 0; i--) {
              if (recentMessages[i].role === 'user') {
                originalQuestion = recentMessages[i].content;
                // Look for the next assistant message after this user message
                for (let j = i + 1; j < recentMessages.length; j++) {
                  if (recentMessages[j].role === 'assistant') {
                    explanation = recentMessages[j].content;
                    break;
                  }
                }
                break;
              }
            }
            
            console.log('Generating challenge based on recent context:', { 
              sessionId,
              originalQuestion, 
              explanationLength: explanation.length,
              historyLength: conversationHistory.length 
            });
            
            // Generate challenge problem
            const challengeProblem = await generateChallengeProblem(originalQuestion, explanation);
            
            // Add to conversation history
            conversationHistory.push({ 
              role: 'assistant', 
              content: challengeProblem 
            });
            
            // Update shared history
            userConversations.set(sessionId, conversationHistory);
            
            // Send response to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'chat',
                content: challengeProblem,
                isChallenge: true,
                timestamp: new Date().toISOString(),
                sessionId
              }));
            }
          } catch (error) {
            console.error('Error generating challenge problem:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: "Désolé, je n'ai pas pu générer un problème de défi. Veuillez réessayer.",
                timestamp: new Date().toISOString()
              }));
            }
          }
        } else if (data.type === 'load_history') {
          // Send the current conversation history to the client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'history',
              history: conversationHistory,
              timestamp: new Date().toISOString(),
              sessionId
            }));
          }
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
      // Note: We don't remove the conversation history when client disconnects
      // to allow it to be used across sessions
    });
  });

  return httpServer;
}
