export interface User {
  id: string;
  nmId: string;
  email: string;
  teamname: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    nmId: string,
    email: string,
    password: string,
    teamname: string
  ) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  section?: string;
  marks?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  courseId: number;
}

export interface TestAnswer {
  questionId: number;
  selectedOption: number;
  timeTaken: number; // Time taken in seconds
  isCorrect: boolean;
}

export interface TestAttempt {
  id: string;
  userId: string;
  courseId: string;
  startTime: Date;
  endTime: Date;
  totalTime: number; // Total time taken in seconds
  answers: TestAnswer[];
  score: number;
  maxScore: number;
  completed: boolean;
}

export interface TestProfile {
  userId: string;
  attempts: TestAttempt[];
  lastAttemptDate?: Date;
  averageScore?: number;
  totalAttempts: number;
}
