import { 
  users, type User, type InsertUser,
  questions, type Question, type InsertQuestion,
  topics, type Topic, type InsertTopic,
  lessons, type Lesson, type InsertLesson
} from "@shared/schema";
import { RecentQuestion } from "@/lib/types";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question operations
  getQuestion(id: number): Promise<Question | undefined>;
  getRecentQuestions(): Promise<RecentQuestion[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Topic operations
  getTopic(id: number): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByTopic(topicId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private topics: Map<number, Topic>;
  private lessons: Map<number, Lesson>;
  
  private userCurrentId: number;
  private questionCurrentId: number;
  private topicCurrentId: number;
  private lessonCurrentId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.topics = new Map();
    this.lessons = new Map();
    
    this.userCurrentId = 1;
    this.questionCurrentId = 1;
    this.topicCurrentId = 1;
    this.lessonCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getRecentQuestions(): Promise<RecentQuestion[]> {
    const allQuestions = Array.from(this.questions.values());
    // Sort by createdAt in descending order (newest first)
    allQuestions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Take only the first 5 questions
    const recentQuestions = allQuestions.slice(0, 5);
    
    return recentQuestions.map(q => ({
      id: q.id.toString(),
      title: q.title,
      timeAgo: this.getTimeAgo(q.createdAt)
    }));
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionCurrentId++;
    const now = new Date();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: now,
      status: 'pending',
      userId: insertQuestion.userId || null
    };
    this.questions.set(id, question);
    return question;
  }
  
  // Topic operations
  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.topicCurrentId++;
    const topic: Topic = { 
      ...insertTopic, 
      id,
      description: insertTopic.description || null
    };
    this.topics.set(id, topic);
    return topic;
  }
  
  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  
  async getLessonsByTopic(topicId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.topicId === topicId);
  }
  
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonCurrentId++;
    const lesson: Lesson = { 
      ...insertLesson, 
      id,
      topicId: insertLesson.topicId || null
    };
    this.lessons.set(id, lesson);
    return lesson;
  }
  
  // Helper method to generate human-readable time difference
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 172800) {
      return 'Hier';
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  }
  
  // Initialize with sample data for development
  private initializeSampleData() {
    // Sample users
    const user1: User = {
      id: this.userCurrentId++,
      username: 'eleve123',
      password: 'password123',
      displayName: 'Marie Dupont',
      avatar: null
    };
    this.users.set(user1.id, user1);
    
    // Sample topics
    const topics = [
      { title: 'Mathématiques', description: 'Algèbre, Géométrie, Calcul' },
      { title: 'Français', description: 'Grammaire, Littérature, Expression écrite' },
      { title: 'Sciences', description: 'Physique, Chimie, Biologie' },
      { title: 'Histoire-Géographie', description: 'Histoire mondiale, Géographie humaine et physique' }
    ];
    
    topics.forEach(topic => {
      const newTopic: Topic = {
        id: this.topicCurrentId++,
        ...topic
      };
      this.topics.set(newTopic.id, newTopic);
    });
    
    // Sample questions
    const questions = [
      { 
        title: 'Comment résoudre une équation du second degré?', 
        content: 'Je dois résoudre x² - 5x + 6 = 0 mais je ne sais pas comment procéder.', 
        userId: user1.id 
      },
      { 
        title: 'Quelles sont les étapes pour analyser un poème?', 
        content: 'Je dois analyser un poème de Victor Hugo pour demain, quelles sont les étapes à suivre?', 
        userId: user1.id 
      },
      { 
        title: 'Comment calculer la dérivée d\'une fonction?', 
        content: 'Je ne comprends pas comment calculer la dérivée de f(x) = x³ + 2x² - 5x + 3', 
        userId: user1.id 
      }
    ];
    
    // Create sample questions with different timestamps for testing
    const now = new Date();
    
    questions.forEach((q, index) => {
      const createdAt = new Date(now);
      createdAt.setHours(now.getHours() - (index * 3)); // Each question created 3 hours apart
      
      const newQuestion: Question = {
        id: this.questionCurrentId++,
        ...q,
        createdAt,
        status: 'pending'
      };
      this.questions.set(newQuestion.id, newQuestion);
    });
    
    // Sample lessons
    const lessons = [
      {
        title: 'Les équations du second degré',
        content: 'Contenu de la leçon sur les équations du second degré',
        level: 'Intermédiaire',
        duration: '45 minutes',
        topicId: 1 // Mathématiques
      },
      {
        title: 'Les figures de style',
        content: 'Contenu de la leçon sur les figures de style en poésie',
        level: 'Débutant',
        duration: '30 minutes',
        topicId: 2 // Français
      },
      {
        title: 'Les lois de Newton',
        content: 'Contenu de la leçon sur les trois lois de Newton',
        level: 'Avancé',
        duration: '60 minutes',
        topicId: 3 // Sciences
      }
    ];
    
    lessons.forEach(lesson => {
      const newLesson: Lesson = {
        id: this.lessonCurrentId++,
        ...lesson
      };
      this.lessons.set(newLesson.id, newLesson);
    });
  }
}

export const storage = new MemStorage();
