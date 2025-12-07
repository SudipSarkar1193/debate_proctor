import { mockTopics, mockUsers } from '../mock/mockData';
import type { Debate, Topic, Message, User, Challenge, DebaterPosition } from '../types';
import type { Socket } from "socket.io-client";

// Access the environment variable defined in .env
const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// --- AUTH (Keep mock for now ) ---
export const loginUser = async (username: string, password: string, role: 'debater' | 'audience'): Promise<User | null> => {
  // Simulating login for now
  const user = mockUsers.find(
    u => u.username === username && u.password === password && u.role === role
  );
  return user || null;
};

// --- DEBATES ---

// FETCH Real data from backend
export const getDebateById = async (id: string): Promise<Debate | undefined> => {
  try {
    const response = await fetch(`${API_URL}/api/debates/${id}`);
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch debate:", error);
    return undefined;
  }
};

export const getDebates = async (): Promise<Debate[]> => {
  // Will add a GET /api/debates endpoint to server.js later
  return []; 
};

// --- MESSAGES ---
export const postMessage = async (debateId: string, message: Omit<Message, 'id'>, socket: Socket | null): Promise<Message> => {
  const newMessage = { ...message, id: `m${Date.now()}` }; // ID generation can move to backend if desired
  
  if (socket) {
    // This emits to the socket.js backend which saves to DB
    socket.emit('sendMsg', { debateId, message: newMessage }); 
  }
  return newMessage;
};

// --- TOPICS & USERS (Keep Mock for simplicity) ---
export const getTopics = async (): Promise<Topic[]> => Promise.resolve(mockTopics);
export const getUsers = async (role?: 'debater' | 'audience'): Promise<User[]> => {
    if (role) return Promise.resolve(mockUsers.filter(u => u.role === role));
    return Promise.resolve(mockUsers);
};

// --- CHALLENGES ---
// We treat creating a challenge as creating a debate in the DB immediately
export const createChallenge = async (challenger: User, topicId: string, position: DebaterPosition): Promise<Challenge> => {
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) throw new Error("Topic not found");

    const newChallenge: Challenge = {
        id: `c${Date.now()}`, // Temporary ID, will be replaced by addChallengeAsDebate logic usually
        challenger,
        topic,
        position,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    return newChallenge;
};

// Save the challenge to the Postgres DB
export const addChallengeAsDebate = async (challenge: Challenge) => {
  try {
    await fetch(`${API_URL}/api/debates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: challenge.id,
        topic: challenge.topic,
        debater1: challenge.challenger,
        position: challenge.position,
        // debater2 is undefined/waiting
      })
    });
  } catch (error) {
    console.error("Failed to create debate in DB:", error);
  }
};