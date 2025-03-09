import React from 'react';
import { Link, useLocation } from 'wouter';
import { Book, Search } from 'lucide-react';

// Composant de navigation latérale fixe pour les écrans larges
const SideNavigation = () => {
  const [location] = useLocation();
  
  // Liste des éléments de menu - synchronisés avec SideMenu.tsx
  const menuItems = [
    { 
      id: 'studies-help', 
      title: 'Aide aux études', 
      icon: <Book className="h-5 w-5" />, 
      href: '/chat-assistant' 
    },
    {
      id: 'homework-help',
      title: 'Aide aux devoirs',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>,
      href: '/homework-help'
    },
    {
      id: 'exam-prep',
      title: 'Préparation aux examens',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      href: '/exam-prep'
    },
    {
      id: 'interactive-lessons',
      title: 'Leçons interactives',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>,
      href: '/interactive-lessons'
    },
    {
      id: 'learning-history',
      title: 'Historique d\'apprentissage',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      href: '/learning-history'
    }
  ];

  return (
    <aside className="hidden md:flex flex-col h-full w-64 bg-white border-r border-gray-200 pt-16 fixed top-0 left-0 z-10">
      {/* Zone de recherche */}
      <div className="px-4 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher"
            className="block w-full pl-10 pr-3 py-2 rounded-full text-sm bg-gray-100 focus:outline-none"
            aria-label="Rechercher"
          />
        </div>
      </div>
      
      {/* Liste des éléments de menu */}
      <nav className="flex-1 px-4 mt-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                  isActive 
                    ? 'bg-gray-100 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Pied avec options utilisateur */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="ml-3 text-sm font-medium">Mon profil</span>
          <button 
            className="ml-auto rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Paramètres"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideNavigation;