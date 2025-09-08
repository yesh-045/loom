"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Presentation, 
  CreditCard, 
  SpellCheck, 
  Paintbrush, 
  Image, 
  Atom, 
  Headphones
} from 'lucide-react';

interface ComponentType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  contentType: 'quiz' | 'ppt' | 'flashcards' | 'spelling' | 'canvas' | 'image' | 'physics' | 'speech' | 'speech-training';
}

interface ComponentToolbarProps {
  onComponentSelect: (contentType: string, defaultContent: string) => void;
  className?: string;
}

const componentTypes: ComponentType[] = [
  {
    id: 'quiz',
    name: 'Quiz',
    icon: BookOpen,
    description: 'Create interactive quiz',
    contentType: 'quiz'
  },
  {
    id: 'ppt',
    name: 'Slides',
    icon: Presentation,
    description: 'Generate presentation slides',
    contentType: 'ppt'
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: CreditCard,
    description: 'Create study flashcards',
    contentType: 'flashcards'
  },
  {
    id: 'spelling',
    name: 'Spelling',
    icon: SpellCheck,
    description: 'Generate spelling quiz',
    contentType: 'spelling'
  },
  {
    id: 'canvas',
    name: 'Draw',
    icon: Paintbrush,
    description: 'Open drawing canvas',
    contentType: 'canvas'
  },
  {
    id: 'image',
    name: 'Image',
    icon: Image,
    description: 'Upload and process image',
    contentType: 'image'
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: Atom,
    description: 'Create physics simulation',
    contentType: 'physics'
  },
  {
    id: 'speech',
    name: 'Speech Training',
    icon: Headphones,
    description: 'Interactive speech practice',
    contentType: 'speech-training'
  }
];

// Default content templates for each component type
const getDefaultContent = (contentType: string): string => {
  switch (contentType) {
    case 'quiz':
      return JSON.stringify({
        questions: [
          {
            questionText: "What is the fundamental unit of electric charge?",
            choices: [
              { text: "Coulomb", isCorrect: false },
              { text: "Elementary charge (e)", isCorrect: true },
              { text: "Ampere", isCorrect: false },
              { text: "Volt", isCorrect: false }
            ]
          },
          {
            questionText: "According to Einstein's theory of relativity, what happens to time as you approach the speed of light?",
            choices: [
              { text: "Time speeds up", isCorrect: false },
              { text: "Time slows down", isCorrect: true },
              { text: "Time remains constant", isCorrect: false },
              { text: "Time reverses", isCorrect: false }
            ]
          },
          {
            questionText: "What is the most abundant element in the universe?",
            choices: [
              { text: "Oxygen", isCorrect: false },
              { text: "Carbon", isCorrect: false },
              { text: "Hydrogen", isCorrect: true },
              { text: "Helium", isCorrect: false }
            ]
          },
          {
            questionText: "Which programming paradigm emphasizes immutability and pure functions?",
            choices: [
              { text: "Object-Oriented Programming", isCorrect: false },
              { text: "Procedural Programming", isCorrect: false },
              { text: "Functional Programming", isCorrect: true },
              { text: "Assembly Programming", isCorrect: false }
            ]
          },
          {
            questionText: "What is the time complexity of binary search on a sorted array?",
            choices: [
              { text: "O(n)", isCorrect: false },
              { text: "O(log n)", isCorrect: true },
              { text: "O(n²)", isCorrect: false },
              { text: "O(1)", isCorrect: false }
            ]
          }
        ]
      });
    
    case 'ppt':
      return JSON.stringify({
        slides: [
          {
            type: "Header & Subheader Slide",
            content: {
              title: "Machine Learning Fundamentals",
              subtitle: "Understanding AI and Neural Networks"
            }
          },
          {
            type: "Enumeration Slide",
            content: {
              title: "Types of Machine Learning",
              bullets: [
                "Supervised Learning - Learning from labeled data",
                "Unsupervised Learning - Finding patterns in unlabeled data", 
                "Reinforcement Learning - Learning through trial and error",
                "Deep Learning - Neural networks with multiple layers",
                "Transfer Learning - Using pre-trained models"
              ]
            }
          },
          {
            type: "Definition Slide",
            content: {
              term: "Neural Network",
              definition: "A computational model inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information through weighted connections and activation functions."
            }
          },
          {
            type: "Paragraph Slide",
            content: {
              paragraph: "Machine learning has revolutionized numerous industries, from healthcare diagnostics to autonomous vehicles. By enabling computers to learn patterns from data without explicit programming, ML algorithms can make predictions, classify information, and discover insights that would be impossible for humans to detect manually. The field continues to evolve rapidly with advances in computational power and algorithmic sophistication."
            }
          },
          {
            type: "Comparison Slide",
            content: {
              title: "Traditional Programming vs Machine Learning",
              comparisonItems: [
                {
                  header: "Traditional Programming",
                  points: [
                    "Explicit rules and logic",
                    "Deterministic outcomes",
                    "Human-coded algorithms",
                    "Limited adaptability"
                  ]
                },
                {
                  header: "Machine Learning", 
                  points: [
                    "Learns from data patterns",
                    "Probabilistic predictions",
                    "Self-improving algorithms",
                    "Adaptable to new data"
                  ]
                }
              ]
            }
          }
        ]
      });
    
    case 'flashcards':
      return JSON.stringify({
        flashcards: [
          {
            front: "Algorithm Complexity",
            back: "A measure of the computational resources (time and space) required by an algorithm as a function of input size, typically expressed using Big O notation"
          },
          {
            front: "Quantum Entanglement",
            back: "A quantum mechanical phenomenon where particles become interconnected and instantaneously affect each other's state regardless of distance"
          },
          {
            front: "CRISPR-Cas9",
            back: "A revolutionary gene-editing technology that allows precise modification of DNA sequences in living cells"
          },
          {
            front: "Machine Learning",
            back: "A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed"
          },
          {
            front: "Blockchain",
            back: "A distributed ledger technology that maintains a continuously growing list of records linked and secured using cryptography"
          },
          {
            front: "Neural Plasticity",
            back: "The brain's ability to reorganize itself by forming new neural connections throughout life in response to learning or injury"
          },
          {
            front: "Photosynthesis",
            back: "The process by which plants convert light energy into chemical energy, producing glucose and oxygen from carbon dioxide and water"
          },
          {
            front: "Relativity Theory",
            back: "Einstein's theory describing the relationship between space, time, and gravity, revolutionizing our understanding of the universe"
          }
        ]
      });
    
    case 'spelling':
      return JSON.stringify({
        words: [
          {
            word: "algorithm",
            definition: "A step-by-step procedure for calculations, data processing, and automated reasoning tasks",
            difficulty: "hard"
          },
          {
            word: "photosynthesis",
            definition: "The process by which plants convert light energy into chemical energy",
            difficulty: "hard"
          },
          {
            word: "entrepreneurship",
            definition: "The activity of setting up a business taking on financial risks in hope of profit",
            difficulty: "hard"
          },
          {
            word: "conscientiousness",
            definition: "The quality of wishing to do what is right, especially to do one's work or duty well",
            difficulty: "expert"
          },
          {
            word: "electromagnetic",
            definition: "Relating to the interrelation of electric currents or fields and magnetic fields",
            difficulty: "hard"
          },
          {
            word: "biotechnology",
            definition: "The exploitation of biological processes for industrial purposes",
            difficulty: "hard"
          },
          {
            word: "neuroplasticity",
            definition: "The ability of neural networks in the brain to change through growth and reorganization",
            difficulty: "expert"
          },
          {
            word: "sustainability",
            definition: "Meeting our own needs without compromising future generations' ability to meet theirs",
            difficulty: "medium"
          }
        ]
      });
    
    case 'canvas':
      return JSON.stringify({
        canvasData: {
          width: 1200,
          height: 800,
          tools: ["pen", "pencil", "eraser", "shapes", "text", "highlighter"],
          defaultTool: "pen",
          backgroundColor: "#ffffff",
          gridEnabled: true,
          snapToGrid: false,
          layers: ["background", "drawing", "annotations"],
          brushSettings: {
            size: 3,
            opacity: 1.0,
            color: "#000000"
          },
          features: [
            "Multi-layer drawing support",
            "Vector and raster graphics",
            "Real-time collaboration",
            "Mathematical equation rendering",
            "Scientific diagram templates",
            "Export to multiple formats"
          ]
        }
      });
    
    case 'image':
      return JSON.stringify({
        imageData: {
          url: "",
          alt: "Educational content image",
          caption: "Advanced image processing and analysis capabilities",
          metadata: {
            supportedFormats: ["JPEG", "PNG", "WebP", "SVG", "GIF"],
            maxSize: "10MB",
            features: [
              "AI-powered image analysis",
              "Optical Character Recognition (OCR)",
              "Mathematical equation extraction",
              "Scientific diagram interpretation",
              "Multi-language text detection",
              "Accessibility description generation"
            ]
          },
          processingOptions: {
            enhanceQuality: true,
            extractText: true,
            detectObjects: true,
            generateDescription: true
          }
        }
      });
    
    case 'physics':
      return JSON.stringify({
        simulation: {
          type: "orbital_mechanics",
          title: "Planetary Orbital Simulation",
          description: "Simulate gravitational interactions between celestial bodies",
          parameters: {
            gravitational_constant: 6.674e-11,
            time_step: 0.01,
            scale_factor: 1e9
          },
          celestial_bodies: [
            {
              name: "Star",
              mass: 1.989e30,
              position: { x: 0, y: 0 },
              velocity: { x: 0, y: 0 },
              radius: 696340000,
              color: "#FFD700"
            },
            {
              name: "Planet A",
              mass: 5.972e24,
              position: { x: 149597870700, y: 0 },
              velocity: { x: 0, y: 29780 },
              radius: 6371000,
              color: "#4F94CD"
            },
            {
              name: "Planet B",
              mass: 6.417e23,
              position: { x: 227939200000, y: 0 },
              velocity: { x: 0, y: 24007 },
              radius: 3389500,
              color: "#CD5C5C"
            }
          ],
          physics_properties: {
            conservation_of_energy: true,
            conservation_of_momentum: true,
            relativistic_effects: false,
            tidal_forces: false
          }
        }
      });
    

    case 'speech-training':
      return JSON.stringify({
        exercises: [
          {
            id: '1',
            text: 'The quick brown fox jumps over the lazy dog',
            difficulty: 'beginner',
            category: 'Pronunciation Basics',
            targetWords: ['quick', 'brown', 'jumps', 'lazy'],
            phonetics: '/ðə kwɪk braʊn fɒks dʒʌmps ˈoʊvər ðə ˈleɪzi dɒg/'
          },
          {
            id: '2',
            text: 'Artificial intelligence enhances educational experiences',
            difficulty: 'intermediate',
            category: 'Technology Terms',
            targetWords: ['artificial', 'intelligence', 'enhances', 'educational'],
            phonetics: '/ˌɑrtəˈfɪʃəl ɪnˈtɛlədʒəns ɪnˈhænsəz ˌɛdʒəˈkeɪʃənəl ɪkˈspɪriənsəz/'
          },
          {
            id: '3',
            text: 'Bionanotechnology revolutionizes pharmaceutical manufacturing',
            difficulty: 'advanced',
            category: 'Scientific Terminology',
            targetWords: ['bionanotechnology', 'revolutionizes', 'pharmaceutical', 'manufacturing'],
            phonetics: '/ˌbaɪoʊˌnænoʊtɛkˈnɑlədʒi rɛvəˈluʃəˌnaɪzəz ˌfɑrməˈsutɪkəl ˌmænjəˈfæktʃərɪŋ/'
          }
        ],
        mode: 'pronunciation'
      });

    default:
      return JSON.stringify({});
  }
};

const ComponentToolbar: React.FC<ComponentToolbarProps> = ({ 
  onComponentSelect, 
  className = "" 
}) => {
  const handleComponentClick = (component: ComponentType): void => {
    const defaultContent = getDefaultContent(component.contentType);
    onComponentSelect(component.contentType, defaultContent);
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Quick Component Creator
      </h3>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {componentTypes.map((component) => {
          const IconComponent = component.icon;
          return (
            <Button
              key={component.id}
              variant="outline"
              size="sm"
              onClick={() => handleComponentClick(component)}
              className="flex flex-col items-center p-2 h-auto hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title={component.description}
            >
              <IconComponent className="w-4 h-4 mb-1" />
              <span className="text-xs">{component.name}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Click any button to instantly create a component with sample content
      </p>
    </div>
  );
};

export default ComponentToolbar;
