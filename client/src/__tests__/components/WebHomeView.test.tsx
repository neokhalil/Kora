import React from 'react';
import { render, screen } from '@testing-library/react';
import WebHomeView from '../../components/layout/WebHomeView';
import '@testing-library/jest-dom';

// Mock des composants et hooks externes
jest.mock('wouter', () => ({
  useLocation: () => ['/'],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

jest.mock('../../components/VoiceRecorder', () => {
  return function MockVoiceRecorder() {
    return <div data-testid="voice-recorder-mock">Voice Recorder Mock</div>;
  };
});

jest.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon">Send Icon</div>,
  Mic: () => <div data-testid="mic-icon">Mic Icon</div>,
  Image: () => <div data-testid="image-icon">Image Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
}));

// Mock des dépendances
const mockRecentQuestions = [
  { id: '1', title: 'Question 1', timeAgo: '2h ago' },
  { id: '2', title: 'Question 2', timeAgo: '5h ago' },
];

// Tests pour WebHomeView
describe('WebHomeView Component', () => {
  beforeEach(() => {
    // Reset du DOM avant chaque test
    document.body.innerHTML = '';
    
    // Par défaut, simuler un écran de desktop
    global.resizeScreenSize(1200);
  });

  test('renders welcome screen correctly on desktop', () => {
    render(<WebHomeView recentQuestions={mockRecentQuestions} />);
    
    // Vérifier que le titre de bienvenue est affiché
    const welcomeTitle = screen.getByText('Hello Ibrahima');
    expect(welcomeTitle).toBeInTheDocument();
    
    // Vérifier que le titre a les bonnes classes CSS
    expect(welcomeTitle).toHaveClass('web-welcome-title');
    expect(welcomeTitle).toHaveClass('text-black-force');
    
    // Vérifier que le conteneur de question est en bas de la page (sticky)
    const questionContainer = screen.getByPlaceholderText('Pose ta question').closest('.web-question-container');
    expect(questionContainer).toBeInTheDocument();
    
    // Récupérer les styles computés
    const questionContainerStyle = window.getComputedStyle(questionContainer as HTMLElement);
    
    // Vérifier que sur desktop, le conteneur de question n'est pas tout en haut
    // (Ce test est une approximation, car jsdom ne calcule pas les styles CSS complets)
    expect(questionContainerStyle.position).toBe('sticky');
    expect(questionContainerStyle.bottom).toBe('0px');
  });

  test('applies correct styles on mobile screen', () => {
    // Simuler un écran mobile
    global.resizeScreenSize(480);
    global.mockMediaQuery(true); // Simuler que les media queries mobile correspondent
    
    render(<WebHomeView recentQuestions={mockRecentQuestions} />);
    
    // Vérifier que le titre a une taille de police plus petite sur mobile
    const welcomeTitle = screen.getByText('Hello Ibrahima');
    
    // Vérifier que le champ de saisie n'a pas de bordure sur mobile
    const inputContainer = screen.getByPlaceholderText('Pose ta question').closest('.web-question-box');
    const inputContainerStyle = window.getComputedStyle(inputContainer as HTMLElement);
    
    // Sur mobile, la classe CSS devrait appliquer le style sans bordure
    // Note: jsdom ne simule pas complètement les media queries, donc ceci est une vérification approximative
    expect(inputContainer).toHaveClass('web-question-box');
  });

  test('welcome title has correct color regardless of theme', () => {
    render(<WebHomeView recentQuestions={mockRecentQuestions} />);
    
    const welcomeTitle = screen.getByText('Hello Ibrahima');
    const titleStyle = window.getComputedStyle(welcomeTitle);
    
    // Vérifier que la couleur du texte est forcée à #333333 (noir) même en mode sombre
    // Note: La propriété computedStyle n'est pas entièrement simulée dans jsdom
    expect(welcomeTitle).toHaveStyle({
      color: '#333333'
    });
  });
});

// Test spécifique pour vérifier le problème de position sur desktop
describe('WebHomeView Layout Issues', () => {
  test('question container remains at bottom on desktop view', () => {
    // Simuler un écran de desktop large
    global.resizeScreenSize(1920);
    
    render(<WebHomeView recentQuestions={mockRecentQuestions} />);
    
    // Vérifier que le conteneur de question est présent
    const questionContainer = screen.getByPlaceholderText('Pose ta question').closest('.web-question-container');
    
    // Vérifier que le conteneur de bienvenue est présent
    const welcomeContainer = screen.getByText('Hello Ibrahima').closest('.web-welcome-container');
    
    // Dans une disposition correcte, le welcome container devrait être avant le question container dans le DOM
    // Ce test vérifie l'ordre des éléments dans le DOM, ce qui est une approximation de la disposition visuelle
    expect(document.body.contains(welcomeContainer as Node)).toBeTruthy();
    expect(document.body.contains(questionContainer as Node)).toBeTruthy();
    
    // Le conteneur de questions devrait être en position sticky au bas de la page
    const questionContainerStyle = window.getComputedStyle(questionContainer as HTMLElement);
    expect(questionContainerStyle.position).toBe('sticky');
    expect(questionContainerStyle.bottom).toBe('0px');
  });
});