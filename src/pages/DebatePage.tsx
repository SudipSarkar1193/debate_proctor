import React, {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
  type JSX,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Copy,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import type { Debate, Message, User } from "@/types";
import {
  getDebateById,
  postMessage,
} from "@/api/debateAPI";
import { useSocket } from "@/contexts/SocketContext";

const DebatePage: React.FC = () => {
  const { debateId } = useParams<{ debateId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageCounterRef = useRef(0);
  const hasJoinedRoom = useRef(false); // Track if we've joined the room

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<
    "debater1" | "debater2" | null
  >(null);
  const [showTurnBanner, setShowTurnBanner] = useState<boolean>(false);
  const [currentTurnUser, setCurrentTurnUser] = useState<User | null>(null);
  const socket = useSocket();

  function generateMessageId() {
    messageCounterRef.current += 1;
    return `${Date.now()}-${messageCounterRef.current}`;
  }

  // --- Load Debate Data ---
  useEffect(() => {
    if (!debateId) {
      navigate("/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const debateData = await getDebateById(debateId);

        if (debateData) {
          setDebate(debateData);
          setTimeRemaining(debateData.timeRemaining);
          setCurrentTurn(debateData.currentTurn);
        } else {
          console.log(debateId);
          toast.error("Error", { description: "Debate not found." });
          navigate("/dashboard");
        }
      } catch (error) {
        toast.error("Error", { description: "Failed to load debate data." });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debateId, navigate]);

  // --- Join Socket Room (FIXED) ---
  useEffect(() => {
    if (!socket || !debateId) {
      console.log("⏳ Waiting for socket or debateId...");
      return;
    }

    // Wait for socket to be connected
    if (!socket.connected) {
      console.log("⏳ Socket not connected yet, waiting...");
      const handleConnect = () => {
        console.log(`✅ Socket connected! Joining room: ${debateId}`);
        socket.emit("join-debate", debateId);
        hasJoinedRoom.current = true;
      };

      socket.once("connect", handleConnect);
      return () => {
        socket.off("connect", handleConnect);
      };
    }

    // Socket is already connected
    if (!hasJoinedRoom.current) {
      console.log(`🔌 Socket already connected, joining room: ${debateId}`);
      socket.emit("join-debate", debateId);
      hasJoinedRoom.current = true;
    }

    return () => {
      hasJoinedRoom.current = false;
    };
  }, [socket, debateId]);

  // --- Socket Message Listener ---
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: any) => {
      console.log("📨 Received message via socket:", message);

      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(
          (msg) => (msg as any).messageid === (message as any).messageid || 
                   msg.messageId === message.messageId
        );

        if (isDuplicate) {
          console.log("⚠️ Duplicate message, skipping");
          return prevMessages;
        }

        console.log("✅ Adding new message to state");
        return [...prevMessages, message];
      });
    };

    console.log("👂 Setting up message listener");
    socket.on("real-time-sync-message", handleMessage);

    return () => {
      console.log("🔇 Removing message listener");
      socket.off("real-time-sync-message", handleMessage);
    };
  }, [socket]);

  // --- Timer ---
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // --- Scroll to Latest Message ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handle Send ---
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !debate || !user || !currentTurn) return;

    const isDebater1 = user.id === debate.debater1.id;
    const isDebater2 = user.id === debate.debater2.id;
    const isMyTurn =
      (currentTurn === "debater1" && isDebater1) ||
      (currentTurn === "debater2" && isDebater2);

    if (!isMyTurn && user.role === "debater") {
      toast.warning("Not your turn", {
        description: "Wait for your opponent to finish",
      });
      return;
    }

    const factCheckStatuses: Message["factCheckStatus"][] = [
      "verified",
      "questionable",
      "unverified",
    ];
    const randomStatus =
      factCheckStatuses[Math.floor(Math.random() * factCheckStatuses.length)];

    const messageData: Omit<Message, "id"> = {
      debaterId: user.id,
      debaterName: user.username,
      message: newMessage,
      messageId: generateMessageId(),
      timestamp: new Date().toISOString(),
      factCheckStatus: randomStatus,
      round: debate.currentRound,
    };

    try {
      console.log("📤 Sending message:", messageData);
      
      await postMessage(debate.id, messageData, socket);
      
      setNewMessage("");

      const nextTurn = currentTurn === "debater1" ? "debater2" : "debater1";
      const nextTurnUser =
        nextTurn === "debater1" ? debate.debater1 : debate.debater2;

      setCurrentTurn(nextTurn);
      setCurrentTurnUser(nextTurnUser as User);
      setShowTurnBanner(true);
      setTimeout(() => setShowTurnBanner(false), 3000);
      
      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Error", { description: "Could not send message." });
    }
  };

  // --- Helpers ---
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getInitials = (name: string): string =>
    name
      .split("_")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getFactCheckIcon = (
    status: Message["factCheckStatus"]
  ): JSX.Element => {
    if (status === "verified")
      return <ShieldCheck className="w-4 h-4 text-green-400" />;
    if (status === "questionable")
      return <ShieldAlert className="w-4 h-4 text-yellow-400" />;
    return <Shield className="w-4 h-4 text-slate-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!debate) return null;

  const isDebater1 = user?.id === debate.debater1.id;
  const isMyTurn =
    (currentTurn === "debater1" && isDebater1) ||
    (currentTurn === "debater2" && user?.id === debate.debater2.id);
  const isAudience = user?.role === "audience";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            Live Debate
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg-col-span-1">
            <Card className="p-6 bg-slate-900/50 border-slate-700 sticky top-24">
              <h3 className="text-md font-bold text-white ">Topic</h3>
              <p className="text-slate-300 mb-2">{debate.topic.title}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Round</p>
                  <p className="text-xl font-bold text-white">
                    {debate.currentRound} / {debate.totalRounds}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Time Remaining</p>
                  <div
                    className={`flex items-center space-x-2 ${
                      timeRemaining < 10 ? "animate-pulse" : ""
                    }`}
                  >
                    <Clock
                      className={`w-5 h-5 ${
                        timeRemaining < 10 ? "text-red-400" : "text-slate-400"
                      }`}
                    />
                    <p
                      className={`text-xl font-bold ${
                        timeRemaining < 10 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {formatTime(timeRemaining)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-3">Debaters</p>
                  <div className="space-y-3">
                    {[debate.debater1, debate.debater2].map((deb, i) => (
                      <div
                        key={deb.id}
                        className={`p-3 rounded-lg ${
                          currentTurn === `debater${i + 1}`
                            ? "bg-slate-700/50 border-2 border-slate-600"
                            : "bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8 bg-slate-700">
                            <AvatarFallback className="text-xs">
                              {getInitials(deb.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {deb.username}
                            </p>
                            <p className="text-xs text-slate-400">
                              {deb.position}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-white mb-1 p-4 bg-slate-700/50 border-2 border-slate-600 rounded-lg flex items-center justify-between">
                <span>Debate Room Id: {debateId}</span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(debateId || "");
                    toast.success("Copied!", {
                      description: "Debate Room ID copied to clipboard",
                    });
                  }}
                  className="text-slate-300 hover:text-white transition"
                >
                  <Copy className="w-5 h-5 cursor-pointer" />
                </button>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/50 border-slate-700 h-[calc(100vh-200px)] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((msg, index) => {
                    const isOwnMessage = msg.debaterId === user?.id || (msg as any).debaterid === user?.id;
                    return (
                      <motion.div
                        key={(msg as any).messageid || msg.messageId || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwnMessage ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-xs text-slate-400">
                              {msg.debaterName || (msg as any).debatername}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div
                            className={`p-4 rounded-lg ${
                              isOwnMessage
                                ? "bg-slate-700 text-white"
                                : "bg-slate-800 text-slate-200"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {msg.message}
                            </p>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="flex items-center space-x-1 mt-2"
                            >
                              {getFactCheckIcon(msg.factCheckStatus || (msg as any).factcheckstatus)}
                              <span
                                className={`text-xs ${
                                  (msg.factCheckStatus || (msg as any).factcheckstatus) === "verified"
                                    ? "text-green-400"
                                    : (msg.factCheckStatus || (msg as any).factcheckstatus) === "questionable"
                                    ? "text-yellow-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {msg.factCheckStatus || (msg as any).factcheckstatus}
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <AnimatePresence>
                {showTurnBanner && currentTurnUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mx-6 mb-4 p-4 bg-slate-800 border-2 border-slate-600 rounded-lg text-center"
                  >
                    <p className="text-white font-semibold">
                      {currentTurnUser.username}'s Turn
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 border-t border-slate-700">
                {isAudience ? (
                  <div className="text-center text-slate-400 py-4">
                    You are watching this debate. Only debaters can send
                    messages.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewMessage(e.target.value)
                      }
                      placeholder={
                        isMyTurn
                          ? "Type your message..."
                          : "Wait for your turn..."
                      }
                      disabled={!isMyTurn || timeRemaining === 0}
                      className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    <Button
                      type="submit"
                      disabled={
                        !isMyTurn || !newMessage.trim() || timeRemaining === 0
                      }
                      className="bg-slate-700 hover:bg-slate-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebatePage;