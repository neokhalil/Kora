import * as React from 'react';
import { BrainCircuit, BookOpen, FileQuestion, History, Settings, Sparkles } from 'lucide-react';
import { NavItem, DiscussionTopic } from './types';

export const navItems: NavItem[] = [
  {
    label: 'Aide aux études',
    path: '/',
    icon: <BrainCircuit className="h-5 w-5" />
  },
  {
    label: 'Préparation aux Examens',
    path: '/exam-prep',
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    label: 'Leçons Interactives',
    path: '/lessons',
    icon: <FileQuestion className="h-5 w-5" />
  },
  {
    label: 'Historique d\'Apprentissage',
    path: '/history',
    icon: <History className="h-5 w-5" />
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