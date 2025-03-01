import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage, HistoryFilterOptions, InteractionWithDetails, InteractionInsight, FieldWithCount, TopicWithCount, TagWithCount } from "./storage"; // Rename to avoid conflict with multer storage
import { z } from "zod";
import { insertQuestionSchema, insertInteractionSchema, insertTagSchema, insertInteractionTagSchema, insertFieldSchema, insertTopicSchema } from "@shared/schema";
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
  const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  };
  
  // File filter for audio files
  const audioFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept audio files
    const validAudioTypes = [
      'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 
      'audio/webm', 'audio/x-m4a', 'audio/mp3'
    ];
    
    if (validAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  };
  
  // Multer config for image uploads
  const upload = multer({ 
    storage: multerStorage, 
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
  });
  
  // Multer config for audio uploads - using memory storage for improved reliability
  // Audio will be stored in memory as a buffer to avoid file system issues
  const audioUpload = multer({
    storage: multer.memoryStorage(), // Use memory storage instead of disk
    fileFilter: audioFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit for audio
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

  // Endpoint for audio transcription with Whisper API
  app.post('/api/transcribe', audioUpload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
      }

      // Get language from query parameters or body, default to French
      const language = req.body.language || 'fr';
      
      // Get optional session ID for context tracking
      const sessionId = req.body.sessionId || 'default';
      
      // Check for debug information
      let debugInfo = {};
      if (req.body.debugInfo) {
        try {
          debugInfo = JSON.parse(req.body.debugInfo);
          console.log('Debug info received from client:', debugInfo);
        } catch (e) {
          console.warn('Failed to parse debug info:', e);
        }
      }
      
      // Log file information
      console.log(`Processing audio transcription request:`, {
        filename: req.file.originalname,
        language,
        mimetype: req.file.mimetype,
        size: req.file.size,
        // Include other useful info
        ...debugInfo
      });
      
      // Process the audio file with Whisper API
      const transcriptionResult = await handleAudioTranscription(req.file, { 
        language
      });
      
      // Store in conversation context if we have a valid session ID
      if (sessionId !== 'default') {
        // Ensure this user has conversation history
        if (!userConversations.has(sessionId)) {
          userConversations.set(sessionId, []);
        }
        
        // Get the conversation history
        const conversationHistory = userConversations.get(sessionId) || [];
        
        // Add the current interaction to history
        if (transcriptionResult.text) {
          conversationHistory.push({ 
            role: 'user', 
            content: transcriptionResult.text
          });
          
          // Update the map
          userConversations.set(sessionId, conversationHistory);
        }
      }
      
      // Log successful transcription
      console.log('Transcription completed successfully:', {
        textLength: transcriptionResult.text.length,
        language: transcriptionResult.language
      });
      
      // Return the transcription result
      res.json({
        text: transcriptionResult.text,
        duration: transcriptionResult.duration,
        language: transcriptionResult.language,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error processing audio transcription:', error);
      
      // Return a more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      res.status(500).json({ 
        message: 'Failed to transcribe audio',
        error: errorMessage,
        details: errorStack
      });
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
  
  // Learning History API Routes
  
  // Fields endpoints
  app.get('/api/fields', async (req: Request, res: Response) => {
    try {
      const fields = await dbStorage.getAllFields();
      res.json(fields);
    } catch (error) {
      console.error('Error fetching fields:', error);
      res.status(500).json({ message: 'Failed to fetch academic fields' });
    }
  });
  
  app.get('/api/fields/with-counts', async (req: Request, res: Response) => {
    try {
      const fields = await dbStorage.getFieldsWithInteractionCounts();
      res.json(fields);
    } catch (error) {
      console.error('Error fetching fields with counts:', error);
      res.status(500).json({ message: 'Failed to fetch fields with interaction counts' });
    }
  });
  
  app.get('/api/fields/:id', async (req: Request, res: Response) => {
    try {
      const field = await dbStorage.getField(parseInt(req.params.id));
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      res.json(field);
    } catch (error) {
      console.error('Error fetching field:', error);
      res.status(500).json({ message: 'Failed to fetch field' });
    }
  });
  
  app.post('/api/fields', async (req: Request, res: Response) => {
    try {
      const validatedData = insertFieldSchema.parse(req.body);
      const newField = await dbStorage.createField(validatedData);
      res.status(201).json(newField);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid field data', errors: error.errors });
      } else {
        console.error('Error creating field:', error);
        res.status(500).json({ message: 'Failed to create field' });
      }
    }
  });
  
  // Topics with field filter endpoints
  app.get('/api/topics/by-field/:fieldId', async (req: Request, res: Response) => {
    try {
      const topics = await dbStorage.getTopicsByField(parseInt(req.params.fieldId));
      res.json(topics);
    } catch (error) {
      console.error('Error fetching topics by field:', error);
      res.status(500).json({ message: 'Failed to fetch topics by field' });
    }
  });
  
  app.get('/api/topics/with-counts', async (req: Request, res: Response) => {
    try {
      const topics = await dbStorage.getTopicsWithCount();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching topics with counts:', error);
      res.status(500).json({ message: 'Failed to fetch topics with interaction counts' });
    }
  });
  
  app.post('/api/topics', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTopicSchema.parse(req.body);
      const newTopic = await dbStorage.createTopic(validatedData);
      res.status(201).json(newTopic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid topic data', errors: error.errors });
      } else {
        console.error('Error creating topic:', error);
        res.status(500).json({ message: 'Failed to create topic' });
      }
    }
  });
  
  // Interactions endpoints
  app.get('/api/interactions', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Extract filter parameters from query
      const filters: HistoryFilterOptions = {};
      
      if (req.query.type && ['text', 'image', 'voice', 'all'].includes(req.query.type as string)) {
        filters.type = req.query.type as 'text' | 'image' | 'voice' | 'all';
      }
      
      if (req.query.fieldId) {
        filters.fieldId = parseInt(req.query.fieldId as string);
      }
      
      if (req.query.topicId) {
        filters.topicId = parseInt(req.query.topicId as string);
      }
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      
      if (req.query.searchTerm) {
        filters.searchTerm = req.query.searchTerm as string;
      }
      
      if (req.query.tag) {
        filters.tag = req.query.tag as string;
      }
      
      if (req.query.starred) {
        filters.starred = req.query.starred === 'true';
      }
      
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string);
      }
      
      const interactions = await dbStorage.getInteractionsByUser(userId, filters);
      res.json(interactions);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      res.status(500).json({ message: 'Failed to fetch interactions' });
    }
  });
  
  app.get('/api/interactions/:id', async (req: Request, res: Response) => {
    try {
      const interaction = await dbStorage.getInteractionWithDetails(parseInt(req.params.id));
      if (!interaction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }
      res.json(interaction);
    } catch (error) {
      console.error('Error fetching interaction:', error);
      res.status(500).json({ message: 'Failed to fetch interaction details' });
    }
  });
  
  app.post('/api/interactions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const newInteraction = await dbStorage.createInteraction(validatedData);
      res.status(201).json(newInteraction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid interaction data', errors: error.errors });
      } else {
        console.error('Error creating interaction:', error);
        res.status(500).json({ message: 'Failed to create interaction' });
      }
    }
  });
  
  app.patch('/api/interactions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Only allow certain fields to be updated
      const allowedUpdates = ['starred', 'topicId', 'metadata'];
      const filteredUpdates: Record<string, any> = {};
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }
      
      const updatedInteraction = await dbStorage.updateInteraction(id, filteredUpdates);
      
      if (!updatedInteraction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }
      
      res.json(updatedInteraction);
    } catch (error) {
      console.error('Error updating interaction:', error);
      res.status(500).json({ message: 'Failed to update interaction' });
    }
  });
  
  app.delete('/api/interactions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await dbStorage.deleteInteraction(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Interaction not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      res.status(500).json({ message: 'Failed to delete interaction' });
    }
  });
  
  // Tags endpoints
  app.get('/api/tags', async (req: Request, res: Response) => {
    try {
      const tags = await dbStorage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });
  
  app.get('/api/tags/with-counts', async (req: Request, res: Response) => {
    try {
      const tags = await dbStorage.getTagsWithCount();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags with counts:', error);
      res.status(500).json({ message: 'Failed to fetch tags with counts' });
    }
  });
  
  app.get('/api/interactions/:id/tags', async (req: Request, res: Response) => {
    try {
      const interactionId = parseInt(req.params.id);
      const tags = await dbStorage.getTagsByInteraction(interactionId);
      res.json(tags);
    } catch (error) {
      console.error('Error fetching interaction tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags for interaction' });
    }
  });
  
  app.post('/api/tags', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const newTag = await dbStorage.createTag(validatedData);
      res.status(201).json(newTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid tag data', errors: error.errors });
      } else {
        console.error('Error creating tag:', error);
        res.status(500).json({ message: 'Failed to create tag' });
      }
    }
  });
  
  app.post('/api/interactions/:id/tags', async (req: Request, res: Response) => {
    try {
      const interactionId = parseInt(req.params.id);
      const { tagId } = req.body;
      
      if (!tagId) {
        return res.status(400).json({ message: 'Tag ID is required' });
      }
      
      const interactionTag = await dbStorage.addTagToInteraction(interactionId, tagId);
      res.status(201).json(interactionTag);
    } catch (error) {
      console.error('Error adding tag to interaction:', error);
      res.status(500).json({ message: 'Failed to add tag to interaction' });
    }
  });
  
  app.delete('/api/interactions/:interactionId/tags/:tagId', async (req: Request, res: Response) => {
    try {
      const interactionId = parseInt(req.params.interactionId);
      const tagId = parseInt(req.params.tagId);
      
      const success = await dbStorage.removeTagFromInteraction(interactionId, tagId);
      
      if (!success) {
        return res.status(404).json({ message: 'Tag not found for this interaction' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error removing tag from interaction:', error);
      res.status(500).json({ message: 'Failed to remove tag from interaction' });
    }
  });
  
  // Learning history insights endpoints
  app.get('/api/insights/frequent-topics', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const insights = await dbStorage.getFrequentTopics(userId, limit);
      res.json(insights);
    } catch (error) {
      console.error('Error fetching frequent topics insights:', error);
      res.status(500).json({ message: 'Failed to fetch frequent topics insights' });
    }
  });
  
  app.get('/api/insights/recent-interactions', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const recentInteractions = await dbStorage.getRecentInteractions(userId, limit);
      res.json(recentInteractions);
    } catch (error) {
      console.error('Error fetching recent interactions:', error);
      res.status(500).json({ message: 'Failed to fetch recent interactions' });
    }
  });
  
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const query = req.query.q as string;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const searchResults = await dbStorage.searchInteractions(userId, query);
      res.json(searchResults);
    } catch (error) {
      console.error('Error searching interactions:', error);
      res.status(500).json({ message: 'Failed to search interactions' });
    }
  });

  return httpServer;
}
