import { Question } from '../types';

// Questions for each course
const QuizQuestions: Record<string, Question[]> = {
  'green-chemistry': [
    {
      id: 1,
      text: "What is the primary advantage of using bio-based materials in EV batteries?",
      options: [
        "Increased weight",
        "Reduced environmental impact",
        "Higher toxicity",
        "Increased cost"
      ],
      correctAnswer: 1
    },
    {
      id: 2,
      text: "Which natural material has been explored as an alternative electrolyte in batteries?",
      options: [
        "Neem oil",
        "Coconut water",
        "Saltwater",
        "Cow dung"
      ],
      correctAnswer: 2
    },
    {
      id: 3,
      text: "How can AI help improve EV battery recycling?",
      options: [
        "By identifying valuable materials",
        "By increasing battery weight",
        "By making batteries more expensive",
        "By reducing cost"
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      text: "Which is a major challenge in setting up rural battery recycling units?",
      options: [
        "Lack of manpower",
        "High infrastructure cost",
        "Low electricity usage",
        "Excess government support"
      ],
      correctAnswer: 1
    },
    {
      id: 5,
      text: "Which element is critical in lithium-ion battery production?",
      options: [
        "Copper",
        "Lithium",
        "Zinc",
        "Iron"
      ],
      correctAnswer: 1
    },
    {
      id: 6,
      text: "Which method can be used to prevent lithium-ion battery fires?",
      options: [
        "Using natural coolants",
        "Increasing charge voltage",
        "Storing at high temperatures",
        "Reducing electrolyte quality"
      ],
      correctAnswer: 0
    },
    {
      id: 7,
      text: "What is a key benefit of biodegradable battery casing?",
      options: [
        "Longer battery life",
        "Easy recycling",
        "Increased pollution",
        "High cost"
      ],
      correctAnswer: 1
    },
    {
      id: 8,
      text: "Which renewable energy sources might be used for charging EV batteries in rural areas?",
      options: [
        "Solar",
        "Hydro",
        "Geothermal",
        "All of the above"
      ],
      correctAnswer: 3
    },
    {
      id: 9,
      text: "What role can blockchain play in battery management?",
      options: [
        "Tracking battery lifecycle",
        "Reducing battery capacity",
        "Increasing charging time",
        "Replacing battery materials"
      ],
      correctAnswer: 0
    },
    {
      id: 10,
      text: "What is the major environmental concern with lithium-ion batteries?",
      options: [
        "Water contamination",
        "E-waste problem",
        "Soil pollution",
        "None of the above"
      ],
      correctAnswer: 0
    },
    {
      id: 11,
      text: "Which technology can be used to detect battery failures?",
      options: [
        "AI-based monitoring",
        "Thermal imaging",
        "Vibration sensors",
        "All of the above"
      ],
      correctAnswer: 3
    },
    {
      id: 12,
      text: "How can recycled EV batteries be used effectively?",
      options: [
        "Surfactant",
        "Water-based electrolytes",
        "Grid energy storage",
        "Reducing coolant usage"
      ],
      correctAnswer: 2
    },
    {
      id: 13,
      text: "Which of the following is a non-toxic battery electrolyte?",
      options: [
        "Sulfuric acid",
        "Lithium hexafluorophosphate",
        "Sodium-ion",
        "None of the above"
      ],
      correctAnswer: 2
    },
    {
      id: 14,
      text: "What is the biggest advantage of multi-recycling in battery management?",
      options: [
        "Prolonged lifespan",
        "Increased cost",
        "More waste generation",
        "None of the above"
      ],
      correctAnswer: 0
    },
    {
      id: 15,
      text: "How can machine learning help in battery recycling?",
      options: [
        "Identifying reusable materials",
        "Sorting battery components",
        "Predicting failures",
        "All of the above"
      ],
      correctAnswer: 3
    }
  ],
  // Keep other existing course questions
  'organic-food-production': [
    // ... existing organic food production questions
  ],
  'food-analysis': [
    // ... existing food analysis questions
  ],
  'ev-battery-management': [
    // ... existing EV battery management questions
  ]
};

export default QuizQuestions;