export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface DiscussionTopic {
  id: string;
  title: string;
}

export interface RecentQuestion {
  id: string;
  title: string;
  timeAgo: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'answered';
  userId: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}
