import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const HomeworkHelp = () => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    try {
      // Here you would submit the question to the API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Submitted homework question:', question);
      setQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Aide aux Devoirs</h1>
        <p className="text-gray-600 mt-2">
          Pose tes questions et obtiens de l'aide pour tes devoirs
        </p>
      </div>

      <Card className="max-w-xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Pose ta question</CardTitle>
          <CardDescription>
            Explique ton problème et obtiens une réponse détaillée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Par exemple: Comment résoudre cette équation: 3x² + 5x - 2 = 0?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mb-4 min-h-[150px]"
            />
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={!question.trim() || isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma question'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Matières populaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Mathématiques', 'Français', 'Histoire-Géo', 'Physique-Chimie', 'SVT', 'Langues'].map(subject => (
            <Card key={subject} className="hover:shadow-md transition cursor-pointer">
              <CardContent className="p-4 text-center">
                {subject}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeworkHelp;
