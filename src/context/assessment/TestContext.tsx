import React, { createContext, useContext, useState, ReactNode } from "react";
import { Question } from "../types";

interface TestContextType {
  questions: Question[];
  selectedAnswers: (string | null)[];
  setQuestions: (questions: Question[]) => void;
  setSelectedAnswers: (selectedAnswers: (string | null)[]) => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);

  return (
    <TestContext.Provider
      value={{
        questions,
        selectedAnswers,
        setQuestions,
        setSelectedAnswers,
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTest must be used within a TestProvider");
  }
  return context;
};
