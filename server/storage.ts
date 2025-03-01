import { 
  users, type User, type InsertUser,
  questions, type Question, type InsertQuestion,
  topics, type Topic, type InsertTopic,
  lessons, type Lesson, type InsertLesson,
  fields, type Field, type InsertField,
  interactions, type Interaction, type InsertInteraction,
  tags, type Tag, type InsertTag,
  interactionTags, type InteractionTag, type InsertInteractionTag
} from "@shared/schema";
import { RecentQuestion } from "@/lib/types";

export interface HistoryFilterOptions {
  type?: 'text' | 'image' | 'voice' | 'all';
  fieldId?: number;
  topicId?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  tag?: string;
  starred?: boolean;
  limit?: number;
  offset?: number;
  userId?: number; // Ajouté pour filtrer par userId dans les méthodes de filtre spécifiques
}

export interface FieldWithCount {
  id: number;
  name: string;
  description: string | null;
  iconName: string | null;
  interactionCount: number;
}

export interface TopicWithCount {
  id: number;
  title: string;
  description: string | null;
  fieldId: number | null;
  interactionCount: number;
}

export interface TagWithCount {
  id: number;
  name: string;
  type: string;
  interactionCount: number;
}

export interface InteractionWithDetails extends Interaction {
  topic: Topic;
  field: Field;
  tags: Tag[];
}

export interface InteractionInsight {
  topicId: number;
  topicTitle: string;
  fieldId: number;
  fieldName: string;
  count: number;
  lastInteractionDate: Date;
}

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
  getTopicsByField(fieldId: number): Promise<Topic[]>;
  getTopicsWithCount(): Promise<TopicWithCount[]>;
  
  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByTopic(topicId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Field operations
  getField(id: number): Promise<Field | undefined>;
  getAllFields(): Promise<Field[]>;
  createField(field: InsertField): Promise<Field>;
  getFieldsWithInteractionCounts(): Promise<FieldWithCount[]>;
  
  // Interaction operations
  getInteraction(id: number): Promise<Interaction | undefined>;
  getInteractionWithDetails(id: number): Promise<InteractionWithDetails | undefined>;
  getInteractionsByUser(userId: number, options?: HistoryFilterOptions): Promise<Interaction[]>;
  getInteractionsByTopic(topicId: number, options?: HistoryFilterOptions): Promise<Interaction[]>;
  getInteractionsByField(fieldId: number, options?: HistoryFilterOptions): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: number, updates: Partial<Interaction>): Promise<Interaction | undefined>;
  deleteInteraction(id: number): Promise<boolean>;
  
  // Tag operations
  getTag(id: number): Promise<Tag | undefined>;
  getAllTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getTagsByInteraction(interactionId: number): Promise<Tag[]>;
  getTagsWithCount(): Promise<TagWithCount[]>;
  
  // InteractionTag operations
  addTagToInteraction(interactionId: number, tagId: number): Promise<InteractionTag>;
  removeTagFromInteraction(interactionId: number, tagId: number): Promise<boolean>;
  
  // Learning History insights
  getFrequentTopics(userId: number, limit?: number): Promise<InteractionInsight[]>;
  getRecentInteractions(userId: number, limit?: number): Promise<InteractionWithDetails[]>;
  searchInteractions(userId: number, query: string): Promise<InteractionWithDetails[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private topics: Map<number, Topic>;
  private lessons: Map<number, Lesson>;
  private fields: Map<number, Field>;
  private interactions: Map<number, Interaction>;
  private tags: Map<number, Tag>;
  private interactionTags: Map<number, InteractionTag>;
  
  private userCurrentId: number;
  private questionCurrentId: number;
  private topicCurrentId: number;
  private lessonCurrentId: number;
  private fieldCurrentId: number;
  private interactionCurrentId: number;
  private tagCurrentId: number;
  private interactionTagCurrentId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.topics = new Map();
    this.lessons = new Map();
    this.fields = new Map();
    this.interactions = new Map();
    this.tags = new Map();
    this.interactionTags = new Map();
    
    this.userCurrentId = 1;
    this.questionCurrentId = 1;
    this.topicCurrentId = 1;
    this.lessonCurrentId = 1;
    this.fieldCurrentId = 1;
    this.interactionCurrentId = 1;
    this.tagCurrentId = 1;
    this.interactionTagCurrentId = 1;
    
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
  
  // Field operations
  async getField(id: number): Promise<Field | undefined> {
    return this.fields.get(id);
  }
  
  async getAllFields(): Promise<Field[]> {
    return Array.from(this.fields.values());
  }
  
  async createField(insertField: InsertField): Promise<Field> {
    const id = this.fieldCurrentId++;
    const field: Field = {
      ...insertField,
      id,
      description: insertField.description || null,
      iconName: insertField.iconName || null
    };
    this.fields.set(id, field);
    return field;
  }
  
  async getFieldsWithInteractionCounts(): Promise<FieldWithCount[]> {
    const fields = await this.getAllFields();
    const result: FieldWithCount[] = [];
    
    for (const field of fields) {
      const topics = await this.getTopicsByField(field.id);
      let count = 0;
      
      for (const topic of topics) {
        const interactions = await this.getInteractionsByTopic(topic.id);
        count += interactions.length;
      }
      
      result.push({
        ...field,
        interactionCount: count
      });
    }
    
    return result;
  }
  
  // Topic operations
  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }
  
  async getTopicsByField(fieldId: number): Promise<Topic[]> {
    return Array.from(this.topics.values())
      .filter(topic => topic.fieldId === fieldId);
  }
  
  async getTopicsWithCount(): Promise<TopicWithCount[]> {
    const topics = await this.getAllTopics();
    const result: TopicWithCount[] = [];
    
    for (const topic of topics) {
      const interactions = await this.getInteractionsByTopic(topic.id);
      
      result.push({
        ...topic,
        interactionCount: interactions.length
      });
    }
    
    return result;
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.topicCurrentId++;
    const topic: Topic = { 
      ...insertTopic, 
      id,
      description: insertTopic.description || null,
      fieldId: insertTopic.fieldId || null
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
  
  // Interaction operations
  async getInteraction(id: number): Promise<Interaction | undefined> {
    return this.interactions.get(id);
  }
  
  async getInteractionWithDetails(id: number): Promise<InteractionWithDetails | undefined> {
    const interaction = await this.getInteraction(id);
    if (!interaction) return undefined;
    
    const topic = await this.getTopic(interaction.topicId || 0) || { 
      id: 0, 
      title: 'Sans catégorie', 
      description: null, 
      fieldId: 0
    };
    
    const field = topic.fieldId ? await this.getField(topic.fieldId) || {
      id: 0,
      name: 'Sans domaine',
      description: null,
      iconName: null
    } : {
      id: 0,
      name: 'Sans domaine',
      description: null,
      iconName: null
    };
    
    const tags = await this.getTagsByInteraction(interaction.id);
    
    return {
      ...interaction,
      topic,
      field,
      tags
    };
  }
  
  async getInteractionsByUser(userId: number, options: HistoryFilterOptions = {}): Promise<Interaction[]> {
    let interactions = Array.from(this.interactions.values())
      .filter(interaction => interaction.userId === userId);
    
    return this.applyHistoryFilters(interactions, options);
  }
  
  async getInteractionsByTopic(topicId: number, options: HistoryFilterOptions = {}): Promise<Interaction[]> {
    console.log(`Fetching interactions for topicId: ${topicId}`);
    
    // Filtrer les interactions par topicId
    let interactions = Array.from(this.interactions.values())
      .filter(interaction => interaction.topicId === topicId);
    
    console.log(`Found ${interactions.length} interactions for topic ${topicId} before filters`);
    
    // Si userId est spécifié dans les options, appliquer ce filtre également
    if (options.userId) {
      interactions = interactions.filter(i => i.userId === options.userId);
      console.log(`After userId filter: ${interactions.length} interactions`);
    }
    
    // Appliquer les autres filtres
    const result = this.applyHistoryFilters(interactions, options);
    console.log(`Final result after all filters: ${result.length} interactions`);
    
    return result;
  }
  
  async getInteractionsByField(fieldId: number, options: HistoryFilterOptions = {}): Promise<Interaction[]> {
    console.log(`Fetching interactions for fieldId: ${fieldId}`);
    
    // Récupérer les sujets liés à ce domaine
    const topics = await this.getTopicsByField(fieldId);
    const topicIds = topics.map(t => t.id);
    
    console.log(`Topics for fieldId ${fieldId}:`, topicIds);
    
    // Filtrer les interactions par topicId qui appartiennent à ce domaine
    let interactions = Array.from(this.interactions.values())
      .filter(interaction => {
        const match = interaction.topicId && topicIds.includes(interaction.topicId);
        if (match) {
          console.log(`Matching interaction ${interaction.id} with topicId ${interaction.topicId}`);
        }
        return match;
      });
    
    console.log(`Found ${interactions.length} interactions for field ${fieldId} before filters`);
    
    // Si userId est spécifié dans les options, appliquer ce filtre également
    if (options.userId) {
      interactions = interactions.filter(i => i.userId === options.userId);
      console.log(`After userId filter: ${interactions.length} interactions`);
    }
    
    // Appliquer les autres filtres
    const result = this.applyHistoryFilters(interactions, options);
    console.log(`Final result after all filters: ${result.length} interactions`);
    
    return result;
  }
  
  private applyHistoryFilters(interactions: Interaction[], options: HistoryFilterOptions): Interaction[] {
    let filtered = [...interactions];
    
    // Apply type filter
    if (options.type && options.type !== 'all') {
      filtered = filtered.filter(i => i.type === options.type);
    }
    
    // Apply date range filters
    if (options.startDate) {
      filtered = filtered.filter(i => new Date(i.createdAt) >= options.startDate!);
    }
    
    if (options.endDate) {
      filtered = filtered.filter(i => new Date(i.createdAt) <= options.endDate!);
    }
    
    // Apply starred filter
    if (options.starred !== undefined) {
      filtered = filtered.filter(i => i.starred === options.starred);
    }
    
    // Apply search term
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.question.toLowerCase().includes(term) || 
        i.answer.toLowerCase().includes(term)
      );
    }
    
    // Apply tag filter
    if (options.tag) {
      // This is more complex and would require checking the interactionTags map
      // For simplicity in this in-memory implementation, we'll skip this filter for now
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    if (options.offset !== undefined && options.limit !== undefined) {
      filtered = filtered.slice(options.offset, options.offset + options.limit);
    } else if (options.limit !== undefined) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const id = this.interactionCurrentId++;
    const now = new Date();
    
    const interaction: Interaction = {
      id,
      userId: insertInteraction.userId || null,
      topicId: insertInteraction.topicId || null,
      question: insertInteraction.question,
      answer: insertInteraction.answer,
      type: insertInteraction.type || 'text', // default to 'text' type
      imageUrl: insertInteraction.imageUrl || null,
      createdAt: now,
      updatedAt: now,
      starred: insertInteraction.starred || false,
      metadata: insertInteraction.metadata || {}
    };
    
    this.interactions.set(id, interaction);
    return interaction;
  }
  
  async updateInteraction(id: number, updates: Partial<Interaction>): Promise<Interaction | undefined> {
    const interaction = this.interactions.get(id);
    if (!interaction) return undefined;
    
    const updated: Interaction = {
      ...interaction,
      ...updates,
      id, // Ensure the ID doesn't change
      updatedAt: new Date() // Update the updatedAt timestamp
    };
    
    this.interactions.set(id, updated);
    return updated;
  }
  
  async deleteInteraction(id: number): Promise<boolean> {
    // First, delete associated interaction tags
    const interactionTagsToDelete = Array.from(this.interactionTags.values())
      .filter(it => it.interactionId === id);
      
    for (const it of interactionTagsToDelete) {
      this.interactionTags.delete(it.id);
    }
    
    // Then delete the interaction
    return this.interactions.delete(id);
  }
  
  // Tag operations
  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }
  
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagCurrentId++;
    const now = new Date();
    
    const tag: Tag = {
      id,
      name: insertTag.name,
      type: insertTag.type || 'user', // default to 'user' type
      createdAt: now
    };
    
    this.tags.set(id, tag);
    return tag;
  }
  
  async getTagsByInteraction(interactionId: number): Promise<Tag[]> {
    const interactionTagEntries = Array.from(this.interactionTags.values())
      .filter(it => it.interactionId === interactionId);
      
    const tagIds = interactionTagEntries.map(it => it.tagId);
    
    return Array.from(this.tags.values())
      .filter(tag => tagIds.includes(tag.id));
  }
  
  async getTagsWithCount(): Promise<TagWithCount[]> {
    const tags = await this.getAllTags();
    const result: TagWithCount[] = [];
    
    for (const tag of tags) {
      const count = Array.from(this.interactionTags.values())
        .filter(it => it.tagId === tag.id)
        .length;
        
      result.push({
        ...tag,
        interactionCount: count
      });
    }
    
    return result;
  }
  
  // InteractionTag operations
  async addTagToInteraction(interactionId: number, tagId: number): Promise<InteractionTag> {
    const id = this.interactionTagCurrentId++;
    
    const interactionTag: InteractionTag = {
      id,
      interactionId,
      tagId
    };
    
    this.interactionTags.set(id, interactionTag);
    return interactionTag;
  }
  
  async removeTagFromInteraction(interactionId: number, tagId: number): Promise<boolean> {
    const interactionTag = Array.from(this.interactionTags.values())
      .find(it => it.interactionId === interactionId && it.tagId === tagId);
      
    if (!interactionTag) return false;
    
    return this.interactionTags.delete(interactionTag.id);
  }
  
  // Learning History insights
  async getFrequentTopics(userId: number, limit: number = 5): Promise<InteractionInsight[]> {
    const userInteractions = await this.getInteractionsByUser(userId);
    
    const topicCounter: Record<number, { count: number, lastDate: Date }> = {};
    
    for (const interaction of userInteractions) {
      if (!interaction.topicId) continue;
      
      if (!topicCounter[interaction.topicId]) {
        topicCounter[interaction.topicId] = { 
          count: 0, 
          lastDate: new Date(interaction.createdAt) 
        };
      }
      
      topicCounter[interaction.topicId].count++;
      
      const interactionDate = new Date(interaction.createdAt);
      if (interactionDate > topicCounter[interaction.topicId].lastDate) {
        topicCounter[interaction.topicId].lastDate = interactionDate;
      }
    }
    
    const insights: InteractionInsight[] = [];
    
    for (const [topicIdStr, data] of Object.entries(topicCounter)) {
      const topicId = parseInt(topicIdStr);
      const topic = await this.getTopic(topicId);
      if (!topic) continue;
      
      const field = topic.fieldId ? await this.getField(topic.fieldId) : null;
      
      insights.push({
        topicId,
        topicTitle: topic.title,
        fieldId: field?.id || 0,
        fieldName: field?.name || 'Sans domaine',
        count: data.count,
        lastInteractionDate: data.lastDate
      });
    }
    
    // Sort by count (descending) and then take the top 'limit' entries
    insights.sort((a, b) => b.count - a.count);
    return insights.slice(0, limit);
  }
  
  async getRecentInteractions(userId: number, limit: number = 10): Promise<InteractionWithDetails[]> {
    const interactions = await this.getInteractionsByUser(userId, { limit });
    
    const result: InteractionWithDetails[] = [];
    
    for (const interaction of interactions) {
      const interactionWithDetails = await this.getInteractionWithDetails(interaction.id);
      if (interactionWithDetails) {
        result.push(interactionWithDetails);
      }
    }
    
    return result;
  }
  
  async searchInteractions(userId: number, query: string): Promise<InteractionWithDetails[]> {
    const interactions = await this.getInteractionsByUser(userId, { searchTerm: query });
    
    const result: InteractionWithDetails[] = [];
    
    for (const interaction of interactions) {
      const interactionWithDetails = await this.getInteractionWithDetails(interaction.id);
      if (interactionWithDetails) {
        result.push(interactionWithDetails);
      }
    }
    
    return result;
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
    
    // Sample fields
    const fields = [
      { name: 'Mathématiques', description: 'Algèbre, Géométrie, Calcul', iconName: 'calculator' },
      { name: 'Sciences du Langage', description: 'Grammaire, Littérature, Expression écrite', iconName: 'book' },
      { name: 'Sciences Naturelles', description: 'Physique, Chimie, Biologie', iconName: 'microscope' },
      { name: 'Sciences Humaines', description: 'Histoire, Géographie, Économie', iconName: 'globe' }
    ];
    
    const createdFields: Field[] = [];
    fields.forEach(field => {
      const newField: Field = {
        id: this.fieldCurrentId++,
        name: field.name,
        description: field.description,
        iconName: field.iconName
      };
      this.fields.set(newField.id, newField);
      createdFields.push(newField);
    });
    
    // Sample topics
    const topics = [
      { title: 'Algèbre', description: 'Équations, Polynômes, Fonctions', fieldId: 1 },
      { title: 'Géométrie', description: 'Figures, Théorèmes, Trigonométrie', fieldId: 1 },
      { title: 'Grammaire', description: 'Syntaxe, Conjugaison, Orthographe', fieldId: 2 },
      { title: 'Littérature', description: 'Analyse, Mouvements littéraires, Auteurs', fieldId: 2 },
      { title: 'Physique', description: 'Mécanique, Électricité, Optique', fieldId: 3 },
      { title: 'Chimie', description: 'Réactions, Éléments, Molécules', fieldId: 3 },
      { title: 'Histoire', description: 'Périodes, Événements, Personnages', fieldId: 4 },
      { title: 'Géographie', description: 'Cartographie, Démographie, Environnement', fieldId: 4 }
    ];
    
    const createdTopics: Topic[] = [];
    topics.forEach(topic => {
      const newTopic: Topic = {
        id: this.topicCurrentId++,
        title: topic.title,
        description: topic.description,
        fieldId: topic.fieldId
      };
      this.topics.set(newTopic.id, newTopic);
      createdTopics.push(newTopic);
    });
    
    // Sample tags
    const tags = [
      { name: 'Important', type: 'user' },
      { name: 'À réviser', type: 'user' },
      { name: 'Compris', type: 'user' },
      { name: 'Examen', type: 'user' },
      { name: 'Formule', type: 'system' },
      { name: 'Définition', type: 'system' },
      { name: 'Exemple', type: 'system' },
      { name: 'Théorème', type: 'system' }
    ];
    
    const createdTags: Tag[] = [];
    tags.forEach(tag => {
      const now = new Date();
      const newTag: Tag = {
        id: this.tagCurrentId++,
        name: tag.name,
        type: tag.type,
        createdAt: now
      };
      this.tags.set(newTag.id, newTag);
      createdTags.push(newTag);
    });
    
    // Sample questions (keep existing)
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
    
    // Sample lessons (adjusted to match new topic IDs)
    const lessons = [
      {
        title: 'Les équations du second degré',
        content: 'Contenu de la leçon sur les équations du second degré',
        level: 'Intermédiaire',
        duration: '45 minutes',
        topicId: 1 // Algèbre
      },
      {
        title: 'Les figures de style',
        content: 'Contenu de la leçon sur les figures de style en poésie',
        level: 'Débutant',
        duration: '30 minutes',
        topicId: 4 // Littérature
      },
      {
        title: 'Les lois de Newton',
        content: 'Contenu de la leçon sur les trois lois de Newton',
        level: 'Avancé',
        duration: '60 minutes',
        topicId: 5 // Physique
      }
    ];
    
    lessons.forEach(lesson => {
      const newLesson: Lesson = {
        id: this.lessonCurrentId++,
        ...lesson
      };
      this.lessons.set(newLesson.id, newLesson);
    });
    
    // Sample interactions
    const interactions = [
      {
        userId: user1.id,
        topicId: 1, // Algèbre
        question: "Comment résoudre une équation du second degré ?",
        answer: "Pour résoudre une équation du second degré de la forme ax² + bx + c = 0, tu peux utiliser la formule du discriminant : Δ = b² - 4ac. Puis : Si Δ > 0, il y a deux solutions : x1 = (-b - √Δ) / 2a et x2 = (-b + √Δ) / 2a. Si Δ = 0, il y a une solution double : x = -b / 2a. Si Δ < 0, il n'y a pas de solution réelle.",
        type: "text",
        starred: true
      },
      {
        userId: user1.id,
        topicId: 2, // Géométrie
        question: "Comment calculer l'aire d'un triangle ?",
        answer: "L'aire d'un triangle peut être calculée de plusieurs façons : 1) Avec la base et la hauteur : A = (b × h) / 2, où b est la base et h la hauteur. 2) Avec les trois côtés (formule de Héron) : A = √(s(s-a)(s-b)(s-c)), où s = (a+b+c)/2 est le demi-périmètre. 3) Avec deux côtés et l'angle entre eux : A = (1/2) × a × b × sin(C).",
        type: "text",
        starred: false
      },
      {
        userId: user1.id,
        topicId: 4, // Littérature
        question: "Quelles sont les principales figures de style en littérature ?",
        answer: "Les principales figures de style incluent : la métaphore (comparaison implicite), la comparaison (avec 'comme'), la personnification (attribuer des caractéristiques humaines à un objet), l'hyperbole (exagération), la métonymie (désigner par un terme proche), l'allitération (répétition de consonnes), l'assonance (répétition de voyelles), et l'oxymore (association de termes contradictoires).",
        type: "text",
        starred: true
      },
      {
        userId: user1.id,
        topicId: 7, // Histoire
        question: "Quelles sont les causes principales de la Révolution française ?",
        answer: "Les causes principales de la Révolution française incluent : 1) Une crise financière et fiscale de l'État. 2) Les inégalités sociales du système des trois ordres (clergé, noblesse, tiers état). 3) L'influence des idées des Lumières prônant l'égalité et la liberté. 4) Une crise agricole et économique aggravant les conditions de vie. 5) L'exemple de la révolution américaine. Ces facteurs ont culminé avec la convocation des États généraux en 1789.",
        type: "text",
        starred: false
      },
      {
        userId: user1.id,
        topicId: 5, // Physique
        question: "Comment fonctionne la loi de la gravitation universelle ?",
        answer: "La loi de la gravitation universelle de Newton établit que deux corps s'attirent avec une force proportionnelle au produit de leurs masses et inversement proportionnelle au carré de la distance qui les sépare. Elle s'exprime par la formule : F = G × (m₁ × m₂) / r², où F est la force d'attraction, G est la constante gravitationnelle universelle, m₁ et m₂ sont les masses des deux corps, et r est la distance entre leurs centres.",
        type: "text",
        starred: true
      }
    ];
    
    // Create sample interactions with different timestamps
    interactions.forEach((interaction, index) => {
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - index * 2); // Each interaction created 2 days apart
      
      const newInteraction: Interaction = {
        id: this.interactionCurrentId++,
        ...interaction,
        createdAt,
        updatedAt: createdAt,
        imageUrl: null,
        metadata: {}
      };
      
      this.interactions.set(newInteraction.id, newInteraction);
      
      // Add some sample tags to the interactions
      if (index % 2 === 0) {
        this.addTagToInteraction(newInteraction.id, 1); // Tag "Important"
      }
      
      if (index % 3 === 0) {
        this.addTagToInteraction(newInteraction.id, 3); // Tag "Compris"
      }
      
      // Add specialized tags based on topic
      if (interaction.topicId === 1 || interaction.topicId === 2) {
        this.addTagToInteraction(newInteraction.id, 5); // Tag "Formule"
      } else if (interaction.topicId === 4) {
        this.addTagToInteraction(newInteraction.id, 6); // Tag "Définition"
      } else if (interaction.topicId === 5) {
        this.addTagToInteraction(newInteraction.id, 8); // Tag "Théorème"
      }
    });
  }
}

export const storage = new MemStorage();
