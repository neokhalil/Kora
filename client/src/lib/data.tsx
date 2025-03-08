import * as React from 'react';
import { BrainCircuit, BookOpen, FileQuestion, History, Settings, Sparkles } from 'lucide-react';
import { NavItem, DiscussionTopic } from './types';

export const navItems: NavItem[] = [
  {
    label: 'Aide aux devoirs',
    path: '/',
    icon: <BookOpen className="h-5 w-5" />
  }
];

// Ajouter plus tard si nécessaire
export const additionalModels = [];

export const discussionTopics: DiscussionTopic[] = [
  {
    id: 'equations',
    title: 'Les équations'
  },
  {
    id: 'racines-carrees',
    title: 'Les racines carrées'
  },
  {
    id: 'techniques-dissertation',
    title: 'Techniques de dissertation'
  },
  {
    id: 'history',
    title: 'Histoire contemporaine'
  },
  {
    id: 'grammar',
    title: 'Grammaire française'
  }
];