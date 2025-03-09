import React, { useState } from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { MessageSquare, Image, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainContentProps {
  recentQuestions: RecentQuestion[];
}

const MainContent: React.FC<MainContentProps> = ({ recentQuestions }) => {
  const [inputValue, setInputValue] = useState('');
  const username = 'Ibrahima'; // À remplacer par les données réelles de l'utilisateur quand disponible

  // Liste des discussions récentes basée sur l'image
  const recentTopics = [
    { id: 'hier', title: 'Hier', items: [
      { id: '1', name: 'Soustraction posée' },
      { id: '2', name: 'Conjugaison au présent' }
    ]},
    { id: 'jours7', title: 'Il y a 7 jours', items: [
      { id: '3', name: 'Les groupes nominaux' },
      { id: '4', name: 'Les adjectifs' }
    ]}
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar - Recent Conversations */}
      <div className="w-[185px] border-r border-gray-200 h-full overflow-y-auto hidden md:block">
        <div className="p-4">
          {recentTopics.map((topic) => (
            <div key={topic.id} className="mb-6">
              <h3 className="text-sm font-medium mb-2">{topic.title}</h3>
              <ul className="space-y-2">
                {topic.items.map((item) => (
                  <li key={item.id}>
                    <Link href={`/chat/${item.id}`} className="text-sm text-gray-600 hover:text-gray-900 block py-1">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Welcome Message */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-bold mb-3">Hello {username}</h1>
          <p className="text-gray-500 text-center mb-6">Comment puis-je t'aider aujourd'hui?</p>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-white border rounded-full shadow-sm flex items-center p-1">
            <input
              type="text"
              placeholder="Pose ta question"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-2 outline-none text-sm"
            />
            <div className="flex items-center pr-2">
              <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Joindre une image">
                <Image className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Enregistrer audio">
                <Mic className="h-5 w-5 text-gray-500" />
              </button>
              <button 
                className={`p-2 rounded-full ${inputValue.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}
                disabled={!inputValue.trim()}
                aria-label="Envoyer"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            KORA, ton assistant IA pour réviser et faire tes exercices.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;