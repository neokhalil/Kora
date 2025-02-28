import { useEffect, useState } from 'react';
import MainContent from '@/components/layout/MainContent';
import { RecentQuestion } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

const Home = () => {
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentQuestions = async () => {
      try {
        const response = await apiRequest('GET', '/api/questions/recent');
        const data = await response.json();
        setRecentQuestions(data);
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

  return (
    <MainContent recentQuestions={recentQuestions} />
  );
};

export default Home;
