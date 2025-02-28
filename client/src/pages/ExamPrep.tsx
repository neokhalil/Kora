import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const examCourses = [
  { 
    id: 1, 
    title: 'Préparation au Brevet', 
    description: 'Révisions complètes pour le Brevet des collèges', 
    progress: 65,
    modules: 12,
    completedModules: 8
  },
  { 
    id: 2, 
    title: 'Préparation au Bac Français', 
    description: 'Méthodologie et exercices pour l\'épreuve anticipée', 
    progress: 40,
    modules: 15,
    completedModules: 6
  },
  { 
    id: 3, 
    title: 'Préparation au Bac Maths', 
    description: 'Exercices et corrigés pour les épreuves de mathématiques', 
    progress: 20,
    modules: 18,
    completedModules: 4
  },
  { 
    id: 4, 
    title: 'Préparation au Concours', 
    description: 'Méthodologie et entraînements aux concours d\'entrée', 
    progress: 10,
    modules: 20,
    completedModules: 2
  }
];

const ExamPrep = () => {
  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Préparation aux examens</h1>
        <p className="text-gray-600 mt-2">
          Des parcours d'apprentissage complets pour réussir tes examens
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {examCourses.map(course => (
          <Card key={course.id} className="hover:shadow-md transition cursor-pointer">
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <p className="text-sm text-gray-600">{course.description}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm text-gray-600">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2 mb-4" />
              <div className="text-sm text-gray-600">
                {course.completedModules}/{course.modules} modules complétés
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Conseils pour réussir</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Organiser son temps</h3>
              <p className="text-sm text-gray-600">
                Créez un planning de révision réaliste et tenez-vous y. Prévoyez des pauses régulières.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Varier les méthodes</h3>
              <p className="text-sm text-gray-600">
                Utilisez différentes techniques d'apprentissage: fiches, mind-mapping, exercices pratiques...
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Entraînez-vous</h3>
              <p className="text-sm text-gray-600">
                Faites des examens blancs en condition réelle pour vous habituer à la gestion du temps.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Prendre soin de soi</h3>
              <p className="text-sm text-gray-600">
                Dormez suffisamment et mangez équilibré pendant les périodes de révision intense.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamPrep;
