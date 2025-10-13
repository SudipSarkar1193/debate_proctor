// =================================================================
// TYPE DEFINITIONS
// =================================================================

// Defines the possible roles a user can have
export type UserRole = 'debater' | 'audience';

// Defines the structure of a User object
export interface User {
  id: string;
  username: string;
  role: UserRole;
  password?: string; // Made optional as it's often not needed in frontend models
}

// Defines the structure of a Topic object
export interface Topic {
  id: string;
  title: string;
  category: string;
}

// Defines the possible positions in a debate
export type DebaterPosition = 'for' | 'against';

// Defines the user object specific to its role within a debate
export interface DebaterInDebate {
  id: string;
  username: string;
  role: 'debater';
  position: DebaterPosition;
}

// Defines the possible statuses of a debate
export type DebateStatus = 'live' | 'scheduled' | 'completed' | 'pending';

// Defines whose turn it is in the debate
export type DebateTurn = 'debater1' | 'debater2';

// Defines the structure of a Debate object
export interface Debate {
  id: string;
  topic: Topic;
  debater1: DebaterInDebate;
  debater2: DebaterInDebate;
  status: DebateStatus;
  currentRound: number;
  totalRounds: number;
  currentTurn: DebateTurn;
  timeRemaining: number; // in seconds
  startedAt: string; // ISO 8601 date string
}

// Defines the possible statuses for fact-checking
export type FactCheckStatus = 'verified' | 'questionable' | 'pending' | 'false';

// Defines the structure of a Message object within a debate
export interface Message {
  id: string;
  debaterId: string;
  debaterName: string;
  message: string;
  timestamp: string; // ISO 8601 date string
  factCheckStatus: FactCheckStatus;
  round: number;
}

// Defines the structure for challenge requests
export interface Challenge {
    id: string;
    challenger: Pick<User, 'id' | 'username'>; // User making the challenge
    challenged: Pick<User, 'id' | 'username'>; // User being challenged
    topic: Topic;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string; // ISO 8601 date string
}


// =================================================================
// MOCK DATA
// =================================================================

// Mock Users
export const mockUsers: User[] = [
  { id: '1', username: 'alex_debater', role: 'debater', password: 'pass123' },
  { id: '2', username: 'sarah_debate', role: 'debater', password: 'pass123' },
  { id: '3', username: 'mike_pro', role: 'debater', password: 'pass123' },
  { id: '4', username: 'emma_viewer', role: 'audience', password: 'pass123' },
  { id: '5', username: 'john_observer', role: 'audience', password: 'pass123' },
];

// Mock Topics
export const mockTopics: Topic[] = [
  { id: 't1', title: 'AI will replace human jobs within 10 years', category: 'Technology' },
  { id: 't2', title: 'Social media does more harm than good', category: 'Society' },
  { id: 't3', title: 'Climate change is the biggest threat to humanity', category: 'Environment' },
  { id: 't4', title: 'Remote work is better than office work', category: 'Work Culture' },
  { id: 't5', title: 'Nuclear energy is the solution to climate crisis', category: 'Energy' },
  { id: 't6', title: 'Cryptocurrency will replace traditional banking', category: 'Finance' },
];

// Mock Debates
export const mockDebates: Debate[] = [
  {
    id: 'd1',
    topic: { id: 't1', title: 'AI will replace human jobs within 10 years', category: 'Technology' },
    debater1: { id: '1', username: 'alex_debater', role: 'debater', position: 'for' },
    debater2: { id: '2', username: 'sarah_debate', role: 'debater', position: 'against' },
    status: 'live',
    currentRound: 2,
    totalRounds: 3,
    currentTurn: 'debater1',
    timeRemaining: 420,
    startedAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'd2',
    topic: { id: 't2', title: 'Social media does more harm than good', category: 'Society' },
    debater1: { id: '3', username: 'mike_pro', role: 'debater', position: 'against' },
    debater2: { id: '1', username: 'alex_debater', role: 'debater', position: 'for' },
    status: 'live',
    currentRound: 1,
    totalRounds: 3,
    currentTurn: 'debater2',
    timeRemaining: 540,
    startedAt: new Date(Date.now() - 300000).toISOString(),
  },
];

// Mock Messages (Record mapping debateId to an array of messages)
export const mockMessages: Record<string, Message[]> = {
  'd1': [
    {
      id: 'm1',
      debaterId: '1',
      debaterName: 'alex_debater',
      message: 'AI and automation are already transforming industries. Look at manufacturing - robots now perform tasks that used to require hundreds of workers.',
      timestamp: new Date(Date.now() - 500000).toISOString(),
      factCheckStatus: 'verified',
      round: 1,
    },
    {
      id: 'm2',
      debaterId: '2',
      debaterName: 'sarah_debate',
      message: 'While automation exists, it also creates new jobs. The tech industry has grown exponentially, creating millions of positions that didn\'t exist 20 years ago.',
      timestamp: new Date(Date.now() - 480000).toISOString(),
      factCheckStatus: 'verified',
      round: 1,
    },
    {
      id: 'm3',
      debaterId: '1',
      debaterName: 'alex_debater',
      message: 'Studies show that AI could automate 30% of current jobs by 2030. The pace of change is unprecedented.',
      timestamp: new Date(Date.now() - 460000).toISOString(),
      factCheckStatus: 'questionable',
      round: 2,
    },
  ],
  'd2': [
    {
      id: 'm4',
      debaterId: '3',
      debaterName: 'mike_pro',
      message: 'Social media platforms are designed to be addictive, exploiting psychological vulnerabilities for profit.',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      factCheckStatus: 'verified',
      round: 1,
    },
  ],
};

// Mock Challenge Requests
export const mockChallenges: Challenge[] = [];