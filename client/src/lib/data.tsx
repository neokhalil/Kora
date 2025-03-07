import * as React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { NavItem, DiscussionTopic } from './types';

export const navItems: NavItem[] = [
  {
    label: 'Aide aux Devoirs',
    path: '/',
    icon: <Brain className="h-5 w-5 mr-2" />
  }
];

// Ajouter plus tard si nécessaire
export const additionalModels = [
  {
    label: 'Kora Avancé',
    path: '/advanced',
    icon: <Sparkles className="h-5 w-5 mr-2" />
  }
];

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