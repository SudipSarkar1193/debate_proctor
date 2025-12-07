import { mockDebates, mockTopics, mockUsers, mockChallenges } from '../mock/mockData';
import type { Debate, Topic, Message, User, Challenge, DebaterPosition } from '../types';
import type { Socket } from "socket.io-client";

const SIMULATED_DELAY = 500; // 500ms delay
const STORAGE_KEY = 'debate_proctor_debates';

// --- INITIALIZATION ---
let currentDebates: Debate[] = [];

try {
  const storedDebates = localStorage.getItem(STORAGE_KEY);
  if (storedDebates) {
    const parsed = JSON.parse(storedDebates);
    // Ensure the parsed data is actually an array
    if (Array.isArray(parsed)) {
      currentDebates = parsed;
    } else {
      currentDebates = [...mockDebates];
    }
  } else {
    currentDebates = [...mockDebates];
  }
} catch (error) {
  console.error("Failed to load debates from local storage:", error);
  currentDebates = [...mockDebates];
}

// Helper to save debates to localStorage
const persistDebates = () => {
  try {
    if (currentDebates && Array.isArray(currentDebates)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDebates));
    }
  } catch (error) {
    console.error("Failed to save debates to local storage:", error);
  }
};

// Helper to simulate API calls with a delay
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data ? JSON.parse(JSON.stringify(data)) : null);
    }, SIMULATED_DELAY);
  });
};

// --- AUTH ---
export const loginUser = async (username: string, password: string, role: 'debater' | 'audience'): Promise<User | null> => {
  const user = mockUsers.find(
    u => u.username === username && u.password === password && u.role === role
  );
  return simulateApiCall(user || null);
};


// --- DEBATES ---
export const getDebates = (): Promise<Debate[]> => {
  return simulateApiCall(currentDebates);
};

export const getDebateById = (id: string): Promise<Debate | undefined> => {
    // Validate currentDebates exists before searching
    const safeDebates = Array.isArray(currentDebates) ? currentDebates : [];
    const debate = safeDebates.find(d => d.id === id);
    return simulateApiCall(debate);
};


// --- TOPICS ---
export const getTopics = (): Promise<Topic[]> => {
  return simulateApiCall(mockTopics);
};


// --- MESSAGES ---
export const postMessage = (debateId: string, message: Omit<Message, 'id'> ,socket: Socket | null): Promise<Message> => {
    const newMessage = { ...message, id: `m${Date.now()}` };
    
    if(socket){
      socket.emit('sendMsg', {debateId,message});
    }

    return simulateApiCall(newMessage);
};


// --- USERS ---
export const getUsers = (role?: 'debater' | 'audience'): Promise<User[]> => {
    if (role) {
        return simulateApiCall(mockUsers.filter(u => u.role === role));
    }
    return simulateApiCall(mockUsers);
};


// --- CHALLENGES ---
export const getChallenges = (): Promise<Challenge[]> => {
    return simulateApiCall(mockChallenges);
};

export const createChallenge = (challenger: User, topicId: string, position: DebaterPosition): Promise<Challenge> => {
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) {
        return Promise.reject(new Error("Topic not found"));
    }

    const newChallenge: Challenge = {
        id: `c${Date.now()}`,
        challenger: { id: challenger.id, username: challenger.username },
        topic,
        position,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    mockChallenges.push(newChallenge);
    return simulateApiCall(newChallenge);
};


export const addChallengeAsDebate = (challenge: Challenge) => {
  const newDebate: Debate = {
    id: challenge.id,
    topic: challenge.topic,
    debater1: {
      id: challenge.challenger.id,
      username: challenge.challenger.username,
      position: challenge.position,
    },
    debater2: challenge.challenged
      ? {
          id: challenge.challenged.id,
          username: challenge.challenged.username,
          position: challenge.position === "for" ? "against" : "for",
        }
      : {
          id: "pending",
          username: "Waiting...",
          position: "against",
        },
    status: "live",
    currentRound: 1,
    totalRounds: 3,
    currentTurn: "debater1",
    timeRemaining: 600,
    startedAt: new Date().toISOString(),
  };

  // Safe push
  if (!Array.isArray(currentDebates)) {
    currentDebates = [];
  }
  currentDebates.push(newDebate);
  persistDebates();
};