// ============ Vocabulary Types ============
export interface VocabularyWord {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  definitionCn?: string;
  exampleSentence: string;
  synonyms: string[];
  antonyms?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  theme: string;
  collocations?: string[];
  skill?: string;
  source?: string;
}

// ============ Practice Types ============
export type QuestionType = 'multiple-choice' | 'true-false-ng' | 'gap-fill' | 'matching' | 'short-answer' | 'sentence-completion';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  sectionRef?: string; // reference to passage paragraph
}

export interface ReadingTest {
  id: string;
  title: string;
  passage: string;
  passageSections: { id: string; title?: string; content: string }[];
  questions: Question[];
  timeLimit: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ListeningSection {
  id: string;
  title: string;
  speakerInfo?: string;
  questions: Question[];
}

export interface ListeningTest {
  id: string;
  title: string;
  audioUrl: string;
  sections: ListeningSection[];
  transcript?: string;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WritingPrompt {
  id: string;
  taskType: 1 | 2;
  title: string;
  promptText: string;
  imageUrl?: string;
  wordLimit: number;
  timeLimit: number;
  sampleAnswer?: string;
}

export interface SpeakingTopic {
  id: string;
  part: 1 | 2 | 3;
  title: string;
  promptText: string;
  followUpQuestions?: string[];
  prepTime: number; // seconds
  responseTime: number; // seconds
}

// ============ AI / Agent Types ============
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: AgentMode;
}

export type AgentMode = 'chat' | 'expand-sentence' | 'translate' | 'plan' | 'essay-correct' | 'speaking-coach' | 'grammar-explain';

export interface SentenceExpansionResult {
  original: string;
  expanded: {
    sentence: string;
    techniques: string[];
    bandEstimate: string;
  }[];
}

export interface TranslationResult {
  original: string;
  translated: string;
  alternatives?: string[];
  notes?: string;
}

export interface StudyPlan {
  id: string;
  date: string;
  title: string;
  tasks: StudyTask[];
  createdAt: number;
}

export interface StudyTask {
  id: string;
  type: 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking' | 'review' | 'break';
  title: string;
  description: string;
  duration: number; // minutes
  completed: boolean;
}

// ============ Speaking Evaluation Types ============
export interface SpeakingEvaluation {
  overallBand: number;
  criteria: {
    fluencyAndCoherence: { band: number; feedback: string };
    pronunciation: { band: number; feedback: string };
    lexicalResource: { band: number; feedback: string };
    grammaticalRangeAndAccuracy: { band: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  followUpResponse?: string;
}

// ============ Essay Correction Types ============
export interface EssayCorrection {
  overallBand: number;
  criteria: {
    taskResponse: { band: number; feedback: string; suggestions: string[] };
    coherenceAndCohesion: { band: number; feedback: string; suggestions: string[] };
    lexicalResource: { band: number; feedback: string; suggestions: string[] };
    grammaticalRangeAndAccuracy: { band: number; feedback: string; suggestions: string[] };
  };
  corrections: EssayCorrectionItem[];
  correctedEssay: string;
  overallFeedback: string;
}

export interface EssayCorrectionItem {
  original: string;
  corrected: string;
  type: 'grammar' | 'vocabulary' | 'coherence' | 'task-response';
  explanation: string;
}

// ============ Progress Types ============
export interface UserProgress {
  dailyStreak: number;
  lastStudyDate: string;
  totalWordsLearned: number;
  totalTestsCompleted: number;
  scoreHistory: {
    date: string;
    type: string;
    score: number;
  }[];
  recentActivity: ActivityItem[];
  savedWords: string[];
  masteredWords: string[];
}

export interface ActivityItem {
  id: string;
  date: string;
  type: 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking';
  title: string;
  score?: number;
  duration?: number;
}

// ============ Timer Types ============
export interface StudyTimer {
  id: string;
  label: string;
  duration: number; // seconds
  remaining: number;
  type: 'focus' | 'break' | 'practice';
  createdAt: number;
  endsAt: number;
}
