import { useEffect, useState } from 'react';
import WebHomeView from '@/components/layout/WebHomeView';
import ChatAssistant from '@/pages/ChatAssistant';
import { RecentQuestion } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';

const Home = () => {
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile(); // Détecte si l'appareil est mobile
  
  useEffect(() => {
    const fetchRecentQuestions = async () => {
      try {
        const response = await apiRequest<RecentQuestion[]>('/api/questions/recent');
        setRecentQuestions(response);
      } catch (error) {
        console.error('Failed to fetch recent questions:', error);
        // Use fallback data if offline
        setRecentQuestions([
          {
            id: '1',
            title: 'Comment résoudre une équation du second degré?',
            timeAgo: 'Il y a 2 heures'
          },
          {
            id: '2',
            title: 'Quelles sont les étapes pour analyser un poème?',
            timeAgo: 'Il y a 5 heures'
          },
          {
            id: '3',
            title: 'Comment calculer la dérivée d\'une fonction?',
            timeAgo: 'Hier'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentQuestions();
  }, []);

  // Utiliser le composant adapté selon le type d'appareil
  // Version mobile = ChatAssistant, Version web = WebHomeView
  return isMobile ? <ChatAssistant /> : <WebHomeView recentQuestions={recentQuestions} />;
};

export default Home;
