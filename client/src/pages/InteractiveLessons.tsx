import { useState } from 'react';
import { Book, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const lessons = {
  math: [
    { id: 1, title: 'Les fonctions', level: 'Seconde', duration: '45 min' },
    { id: 2, title: 'Les équations du second degré', level: 'Première', duration: '60 min' },
    { id: 3, title: 'Les suites numériques', level: 'Terminale', duration: '55 min' },
    { id: 4, title: 'Les limites de fonctions', level: 'Terminale', duration: '70 min' }
  ],
  french: [
    { id: 5, title: 'L\'analyse de texte', level: 'Seconde', duration: '50 min' },
    { id: 6, title: 'La dissertation', level: 'Première', duration: '65 min' },
    { id: 7, title: 'Le commentaire composé', level: 'Terminale', duration: '75 min' }
  ],
  history: [
    { id: 8, title: 'La Révolution française', level: 'Seconde', duration: '60 min' },
    { id: 9, title: 'La Première Guerre mondiale', level: 'Première', duration: '70 min' },
    { id: 10, title: 'La Guerre froide', level: 'Terminale', duration: '65 min' }
  ],
};

const InteractiveLessons = () => {
  const [activeTab, setActiveTab] = useState('math');

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <Book className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Leçons interactives</h1>
        <p className="text-gray-600 mt-2">
          Apprends à ton rythme avec nos leçons interactives
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="math" onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="math">Mathématiques</TabsTrigger>
            <TabsTrigger value="french">Français</TabsTrigger>
            <TabsTrigger value="history">Histoire</TabsTrigger>
          </TabsList>
          
          <TabsContent value="math" className="mt-4">
            <div className="grid gap-4">
              {lessons.math.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="french" className="mt-4">
            <div className="grid gap-4">
              {lessons.french.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <div className="grid gap-4">
              {lessons.history.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Leçons recommandées pour toi</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <LessonCard 
              lesson={{
                id: 11,
                title: 'Les probabilités conditionnelles',
                level: 'Terminale',
                duration: '55 min'
              }}
              featured
            />
            <LessonCard 
              lesson={{
                id: 12,
                title: 'Le roman au XIXe siècle',
                level: 'Première',
                duration: '60 min'
              }}
              featured
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface Lesson {
  id: number;
  title: string;
  level: string;
  duration: string;
}

interface LessonCardProps {
  lesson: Lesson;
  featured?: boolean;
}

const LessonCard = ({ lesson, featured = false }: LessonCardProps) => {
  return (
    <Card className={`hover:shadow-md transition ${featured ? 'border-secondary border-2' : ''}`}>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <h3 className="font-medium">{lesson.title}</h3>
          <div className="text-sm text-gray-600 mt-1">
            <span>{lesson.level}</span>
            <span className="mx-2">•</span>
            <span>{lesson.duration}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default InteractiveLessons;
