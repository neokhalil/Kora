import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("pending").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  title: true,
  content: true,
  userId: true,
});

// Academic Fields table
export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
});

export const insertFieldSchema = createInsertSchema(fields).pick({
  name: true,
  description: true,
  iconName: true,
});

// Topics table
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fieldId: integer("field_id").references(() => fields.id),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  title: true,
  description: true,
  fieldId: true,
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  level: text("level").notNull(),
  duration: text("duration").notNull(),
  topicId: integer("topic_id").references(() => topics.id),
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  title: true,
  content: true,
  level: true,
  duration: true,
  topicId: true,
});

// Interactions table - stores user-AI conversations
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  topicId: integer("topic_id").references(() => topics.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("text"), // "text", "image", "voice"
  imageUrl: text("image_url"), // URL to uploaded image if type is "image"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  starred: boolean("starred").default(false),
  metadata: jsonb("metadata").default({}), // For storing additional data
});

export const insertInteractionSchema = createInsertSchema(interactions).pick({
  userId: true,
  topicId: true,
  question: true,
  answer: true,
  type: true,
  imageUrl: true,
  starred: true,
  metadata: true,
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: varchar("type", { length: 20 }).default("user").notNull(), // "user", "system", "ai"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  type: true,
});

// InteractionTags junction table
export const interactionTags = pgTable("interaction_tags", {
  id: serial("id").primaryKey(),
  interactionId: integer("interaction_id").references(() => interactions.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

export const insertInteractionTagSchema = createInsertSchema(interactionTags).pick({
  interactionId: true,
  tagId: true,
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  interactions: many(interactions),
  questions: many(questions),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  field: one(fields, {
    fields: [topics.fieldId],
    references: [fields.id],
  }),
  interactions: many(interactions),
  lessons: many(lessons),
}));

export const fieldsRelations = relations(fields, ({ many }) => ({
  topics: many(topics),
}));

export const interactionsRelations = relations(interactions, ({ one, many }) => ({
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [interactions.topicId],
    references: [topics.id],
  }),
  tags: many(interactionTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  interactions: many(interactionTags),
}));

export const interactionTagsRelations = relations(interactionTags, ({ one }) => ({
  interaction: one(interactions, {
    fields: [interactionTags.interactionId],
    references: [interactions.id],
  }),
  tag: one(tags, {
    fields: [interactionTags.tagId],
    references: [tags.id],
  }),
}));

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export type InsertField = z.infer<typeof insertFieldSchema>;
export type Field = typeof fields.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertInteractionTag = z.infer<typeof insertInteractionTagSchema>;
export type InteractionTag = typeof interactionTags.$inferSelect;
