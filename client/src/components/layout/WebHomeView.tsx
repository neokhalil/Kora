import React, { useState } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Mic, Image } from 'lucide-react';

interface WebHomeViewProps {
  recentQuestions: RecentQuestion[];
}

const WebHomeView: React.FC<WebHomeViewProps> = ({ recentQuestions }) => {
  const [question, setQuestion] = useState('');
  
  // Pour correspondre exactement à la maquette
  const recentTopics = [
    { id: '1', title: 'Soustraction posée' },
    { id: '2', title: 'Conjugaison au présent' }
  ];
  
  const olderTopics = [
    { id: '3', title: 'Les groupes nominaux' },
    { id: '4', title: 'Les adjectifs' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      console.log('Question posée:', question);
      // Ici, nous pourrions appeler une API ou rediriger vers la page du chat
      setQuestion('');
    }
  };

  return (
    <div className="web-home-container">
      <div className="flex flex-col">
        {/* Colonne de gauche - liste des sujets récents */}
        <div className="web-topics-list">
          <div className="mb-8">
            <h2>Hier</h2>
            <ul>
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
            <h2>Il y a 7 jours</h2>
            <ul>
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
        <div className="flex-1">
          <div>
            <h1 className="web-welcome-title">Hello Ibrahima</h1>
            <p className="web-welcome-subtitle">Comment puis-je t'aider aujourd'hui?</p>
            
            {/* Zone de question avec boutons */}
            <div>
              <form onSubmit={handleSubmit}>
                <div className="web-question-box">
                  <input 
                    type="text" 
                    placeholder="Pose ta question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="rounded-full"
                    aria-label="Télécharger une image"
                  >
                    <Image className="h-5 w-5" />
                  </button>
                  <button 
                    type="button"
                    className="rounded-full"
                    aria-label="Enregistrer audio"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button 
                    type="submit"
                    className="send-button"
                    aria-label="Envoyer"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <p className="web-question-footer">
                KORA, ton assistant IA pour réviser et faire tes exercices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebHomeView;