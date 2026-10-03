export type BitStatus = "todo" | "done";

export type Plan = {
  id: string;
  examDate: string;
  dailyMinutes: number;
  createdAt: string;
};

export type Bit = {
  id: string;
  planId: string;
  order: number;
  title: string;
  content: string;
  takeaway: string;
  estMinutes: number;
  weight: 1 | 2 | 3;
  scheduledDate: string;
  status: BitStatus;
};

export type FlashcardSrsState = "new" | "learning" | "review";

export type Flashcard = {
  id: string;
  bitId: string;
  front: string;
  back: string;
  sourceSnippet: string;
  srs: {
    state: FlashcardSrsState;
    ease: number;
    intervalDays: number;
    due: string;
    reps: number;
    lapses: number;
  };
};

export type QuizQuestionType = "mcq" | "tf" | "fill" | "short";

export type QuizQuestion = {
  id: string;
  bitId: string;
  type: QuizQuestionType;
  prompt: string;
  options?: readonly string[];
  answer: string;
  explanation: string;
  hint?: string;
  difficulty: 1 | 2 | 3;
  topic: string;
  flagged: boolean;
};

export type ReviewResult = {
  id: string;
  cardId: string;
  rating: "again" | "hard" | "good" | "easy";
  reviewedAt: string;
};
