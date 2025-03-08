import * as React from 'react';
import { Brain, Sparkles, Grid, Folder, User } from 'lucide-react';
import { NavItem, DiscussionTopic } from './types';

export const navItems: NavItem[] = [
  {
    label: 'ChatGPT',
    path: '/chatgpt',
    icon: <Brain className="h-5 w-5" />
  },
  {
    label: 'Olivia',
    path: '/olivia',
    icon: <User className="h-5 w-5" />
  },
  {
    label: '11 more',
    path: '/more',
    icon: <User className="h-5 w-5" />
  },
  {
    label: 'Explore GPTs',
    path: '/explore',
    icon: <Grid className="h-5 w-5" />
  },
  {
    label: 'Kora',
    path: '/',
    icon: <Folder className="h-5 w-5" />
  }
];

// Ajouter plus tard si nécessaire
export const additionalModels = [
  {
    label: 'Kora Avancé',
    path: '/advanced',
    icon: <Sparkles className="h-5 w-5" />
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