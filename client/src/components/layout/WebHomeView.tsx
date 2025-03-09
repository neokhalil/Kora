import React from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebHomeViewProps {
  recentQuestions: RecentQuestion[];
}

const WebHomeView: React.FC<WebHomeViewProps> = ({ recentQuestions }) => {
  // Pour correspondre exactement à la maquette
  const recentTopics = [
    { id: '1', title: 'Soustraction posée' },
    { id: '2', title: 'Conjugaison au présent' }
  ];
  
  const olderTopics = [
    { id: '3', title: 'Les groupes nominaux' },
    { id: '4', title: 'Les adjectifs' }
  ];

  return (
    <div className="web-home-container p-4 md:p-8 max-w-screen-xl mx-auto">
      <div className="flex flex-col md:flex-row">
        {/* Colonne de gauche - liste des sujets récents */}
        <div className="w-full md:w-64 md:min-w-64 md:pr-8 md:border-r border-gray-200 web-topics-list">
          <div className="mb-8">
            <h2 className="font-medium mb-3">Hier</h2>
            <ul className="space-y-3">
              {recentTopics.map(topic => (
                <li key={topic.id}>
                  <Link href={`/topics/${topic.id}`}>
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="font-medium mb-3">Il y a 7 jours</h2>
            <ul className="space-y-3">
              {olderTopics.map(topic => (
                <li key={topic.id}>
                  <Link href={`/topics/${topic.id}`}>
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Contenu principal - partie centrale avec message de bienvenue */}
        <div className="flex-1 md:px-10 pt-8 md:pt-0">
          <div className="md:text-left">
            <h1 className="web-welcome-title mb-4">Hello Ibrahima</h1>
            <p className="web-welcome-subtitle">Comment puis-je t'aider aujourd'hui?</p>
            
            {/* Zone de question avec boutons */}
            <div className="max-w-2xl md:mx-0 mt-10">
              <div>
                <div className="web-question-box">
                  <input 
                    type="text" 
                    placeholder="Pose ta question" 
                  />
                  <div className="flex space-x-2">
                    <button 
                      className="rounded-full hover:bg-gray-100 p-2"
                      aria-label="Télécharger une image"
                    >
                      <Image className="h-5 w-5 text-gray-500" />
                    </button>
                    <button 
                      className="rounded-full hover:bg-gray-100 p-2"
                      aria-label="Enregistrer audio"
                    >
                      <Mic className="h-5 w-5 text-gray-500" />
                    </button>
                    <button 
                      className="send-button"
                      aria-label="Envoyer"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="web-question-footer mt-2">
                  KORA, ton assistant IA pour réviser et faire tes exercices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebHomeView;