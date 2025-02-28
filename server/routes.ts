import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";

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

  return httpServer;
}
