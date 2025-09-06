import { Question, ScoreData } from '../types/GameTypes';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch questions');
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    return getDefaultQuestions();
  }
};

export const fetchRandomQuestions = async (count: number = 10): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/random/${count}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch random questions');
    }
  } catch (error) {
    console.error('Error fetching random questions:', error);
    return getDefaultQuestions().slice(0, count);
  }
};

export const fetchQuestionsByDifficulty = async (difficulty: string): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/difficulty/${difficulty}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(`Failed to fetch ${difficulty} questions`);
    }
  } catch (error) {
    console.error(`Error fetching ${difficulty} questions:`, error);
    return getDefaultQuestions().filter(q => q.difficulty === difficulty);
  }
};

export const validateAnswer = async (questionIndex: number, answer: string): Promise<{
  correct: boolean;
  correctAnswer: string;
  difficulty: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionIndex, answer }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty
      };
    } else {
      throw new Error('Failed to validate answer');
    }
  } catch (error) {
    console.error('Error validating answer:', error);
    throw error;
  }
};

export const saveScore = async (scoreData: Omit<ScoreData, 'id' | 'timestamp' | 'accuracy'>): Promise<ScoreData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to save score');
    }
  } catch (error) {
    console.error('Error saving score:', error);
    // Return a mock score if the API fails
    const mockScore: ScoreData = {
      id: Date.now().toString(),
      ...scoreData,
      timestamp: new Date().toISOString(),
      accuracy: scoreData.questionsAnswered > 0 
        ? Number(((scoreData.correctAnswers / scoreData.questionsAnswered) * 100).toFixed(1))
        : 0
    };
    return mockScore;
  }
};

export const getLeaderboard = async (limit: number = 10): Promise<ScoreData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/leaderboard/${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch leaderboard');
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

const getDefaultQuestions = (): Question[] => {
  return [
    {
      id: 1,
      question: "When did World War II end?",
      answers: ["1945", "1944", "1946", "1943"],
      correct: "1945",
      difficulty: "easy",
      subject: "History",
      explanation: "World War II ended in 1945 with the surrender of Japan in September.",
      points: 100
    },
    {
      id: 2,
      question: "What is the heaviest naturally occurring element?",
      answers: ["Uranium", "Lead", "Plutonium", "Osmium"],
      correct: "Uranium",
      difficulty: "hard",
      subject: "Chemistry",
      explanation: "Uranium is the heaviest naturally occurring element with atomic number 92.",
      points: 200
    },
    {
      id: 3,
      question: "Which planet is closest to the Sun?",
      answers: ["Venus", "Mercury", "Mars", "Earth"],
      correct: "Mercury",
      difficulty: "easy",
      subject: "Science",
      explanation: "Mercury is the smallest planet and closest to the Sun in our solar system.",
      points: 100
    },
    {
      id: 4,
      question: "What is the capital of Australia?",
      answers: ["Sydney", "Melbourne", "Canberra", "Perth"],
      correct: "Canberra",
      difficulty: "medium",
      subject: "Geography",
      explanation: "Canberra is the capital city of Australia, located in the Australian Capital Territory.",
      points: 150
    },
    {
      id: 5,
      question: "In mathematics, what is the value of π (pi) rounded to two decimal places?",
      answers: ["3.14", "3.16", "3.12", "3.18"],
      correct: "3.14",
      difficulty: "easy",
      subject: "Mathematics",
      explanation: "Pi (π) is approximately 3.14159, which rounds to 3.14 when rounded to two decimal places.",
      points: 100
    }
  ];
};