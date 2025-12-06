import { mockDebates, mockTopics, mockMessages, mockUsers, mockChallenges } from '../mock/mockData';
import type { Debate, Topic, Message, User, Challenge, DebaterPosition } from '../types';
import type { Socket } from "socket.io-client";

const SIMULATED_DELAY = 500; // 500ms delay


// Helper to simulate API calls with a delay
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // Create a deep copy to prevent direct mutation of mock data
      resolve(JSON.parse(JSON.stringify(data)));
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
  return simulateApiCall(mockDebates);
};

export const getDebateById = (id: string): Promise<Debate | undefined> => {
    const debate = mockDebates.find(d => d.id === id);
    return simulateApiCall(debate);
};


// --- TOPICS ---
export const getTopics = (): Promise<Topic[]> => {
  return simulateApiCall(mockTopics);
};


// --- MESSAGES ---
export const getMessagesForDebate = (debateId: string): Promise<Message[]> => {
  const messages = (mockMessages as Record<string, Message[]>)[debateId] || [];
  return simulateApiCall(messages);
};

export const postMessage = (debateId: string, message: Omit<Message, 'id'> ,socket: Socket | null): Promise<Message> => {
  console.log(message) // invoking socket
  console.log("he")
    const newMessage = { ...message, id: `m${Date.now()}` };
    if (!mockMessages[debateId]) {
        mockMessages[debateId] = [];
    }
    if(socket){
      socket.emit('sendMsg', {debateId,message});
    }


    mockMessages[debateId].push(newMessage);
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
