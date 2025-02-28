import * as React from 'react';
import { Brain, Target, Book, MessageSquare, TestTube } from 'lucide-react';
import { NavItem, DiscussionTopic } from './types';

export const navItems: NavItem[] = [
  {
    label: 'Accueil',
    path: '/',
    icon: <Book className="text-primary mr-3 h-5 w-5" />
  },
  {
    label: 'Aide aux Devoirs',
    path: '/aide-aux-devoirs',
    icon: <Brain className="text-primary mr-3 h-5 w-5" />
  },
  {
    label: 'Préparation aux examens',
    path: '/preparation-examens',
    icon: <Target className="text-primary mr-3 h-5 w-5" />
  },
  {
    label: 'Leçons interactives',
    path: '/lecons-interactives',
    icon: <Book className="text-primary mr-3 h-5 w-5" />
  },
  {
    label: 'Assistant Kora',
    path: '/chat-assistant',
    icon: <MessageSquare className="text-primary mr-3 h-5 w-5" />
  },
  {
    label: 'Test Page',
    path: '/test',
    icon: <TestTube className="text-primary mr-3 h-5 w-5" />
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
  }
];