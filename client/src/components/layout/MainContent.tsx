import React from 'react';
import { Link } from 'wouter';
import { RecentQuestion } from '@/lib/types';
import { ArrowRight, Clock, BookOpen, CheckCircle, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MainContentProps {
  recentQuestions: RecentQuestion[];
}

const MainContent: React.FC<MainContentProps> = ({ recentQuestions }) => {
  return (
    <div className="p-4 md:p-6">
      {/* Hero Section */}
      <section className="mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Bienvenue sur Kora</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Votre plateforme éducative d'aide aux devoirs et de préparation aux examens.
              Posez vos questions, suivez des leçons interactives et préparez-vous pour vos examens.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>
                Poser une question
              </Button>
              <Button variant="outline">
                Explorer les leçons
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Nos services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border border-gray-200">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <BookOpen className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Aide aux devoirs</h3>
              <p className="text-gray-600 mb-4 text-sm flex-1">
                Recevez de l'aide pour vos devoirs et exercices dans toutes les matières
              </p>
              <Link href="/aide-aux-devoirs">
                <Button variant="link" className="p-0 justify-start">
                  En savoir plus <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-5 border border-gray-200">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Préparation aux examens</h3>
              <p className="text-gray-600 mb-4 text-sm flex-1">
                Préparez-vous efficacement pour vos examens avec nos conseils et exercices
              </p>
              <Link href="/preparation-examens">
                <Button variant="link" className="p-0 justify-start">
                  En savoir plus <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-5 border border-gray-200">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <Users className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Leçons interactives</h3>
              <p className="text-gray-600 mb-4 text-sm flex-1">
                Apprenez à votre rythme avec nos leçons interactives et notre contenu pédagogique
              </p>
              <Link href="/lecons-interactives">
                <Button variant="link" className="p-0 justify-start">
                  En savoir plus <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Questions Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Questions récentes</h2>
          <Link href="/aide-aux-devoirs">
            <Button variant="link">
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentQuestions.map((question) => (
            <Link key={question.id} href={`/questions/${question.id}`}>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                <h3 className="font-medium mb-2">{question.title}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{question.timeAgo}</span>
                </div>
              </div>
            </Link>
          ))}
          {recentQuestions.length === 0 && (
            <div className="text-center p-6 text-gray-500">
              <p>Aucune question récente</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MainContent;