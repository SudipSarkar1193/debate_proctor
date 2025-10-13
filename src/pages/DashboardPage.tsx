import React, { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Swords, LogOut, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth, type User } from "@/contexts/AuthContext";
import { mockDebates, mockTopics, mockUsers } from "@/mock/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


// TYPE DEFINITIONS

interface Topic {
  id: string;
  title: string;
}

// A debater participating in a debate, including their position
interface Debater extends User {
  position: "for" | "against";
}

interface Debate {
  id: string;
  topic: Topic;
  debater1: Debater;
  debater2: Debater;
  currentRound: number;
  totalRounds: number;
}

interface Challenge {
  id: string;
  topic: Topic;
  challenger: User;
  position: "for" | "against";
  status: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [debates, setDebates] = useState<Debate[]>(mockDebates as any);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<"for" | "against">(
    "for"
  );
  const [opponentSearch, setOpponentSearch] = useState<string>("");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleLogout = (): void => {
    logout();
    navigate("/login");
  };

  const handleWatchDebate = (debateId: string): void => {
    navigate(`/debate/${debateId}`);
  };

  const handleCreateChallenge = (): void => {
    if (!selectedTopic) {
      toast({
        title: "Select a topic",
        description: "Please choose a debate topic",
      });
      return;
    }

    const topic = mockTopics.find((t: Topic) => t.id === selectedTopic);
    if (!topic || !user) return;

    const newChallenge: Challenge = {
      id: `c${Date.now()}`,
      topic,
      challenger: user,
      position: selectedPosition,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setChallenges([...challenges, newChallenge]);
    toast({
      title: "Challenge Created",
      description: "Waiting for an opponent to accept...",
    });
    setIsCreateDialogOpen(false);
    setSelectedTopic("");
  };

  const availableDebaters = mockUsers.filter(
    (u: User) =>
      u.role === "debater" &&
      u.id !== user?.id &&
      u.username.toLowerCase().includes(opponentSearch.toLowerCase())
  );

  const filteredDebates = debates.filter((debate: Debate) =>
    debate.topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Swords className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Debate Proctor</h1>
              <p className="text-sm text-slate-400">
                Welcome, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              {user?.role === "debater" ? "Debater" : "Audience"}
            </Badge>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder="Search debates by topic..."
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {user?.role === "debater" && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-slate-700 hover:bg-slate-600">
                  <Plus className="w-4 h-4 mr-2" />
                  New Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Challenge</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Topic */}
                  <div className="space-y-2">
                    <Label>Select Topic</Label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                    >
                      <option value="">Choose a topic...</option>
                      {mockTopics.map((topic: Topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <Label>Your Position</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={
                          selectedPosition === "for" ? "default" : "outline"
                        }
                        onClick={() => setSelectedPosition("for")}
                        className={
                          selectedPosition === "for"
                            ? "bg-slate-700"
                            : "border-slate-700"
                        }
                      >
                        For
                      </Button>
                      <Button
                        type="button"
                        variant={
                          selectedPosition === "against" ? "default" : "outline"
                        }
                        onClick={() => setSelectedPosition("against")}
                        className={
                          selectedPosition === "against"
                            ? "bg-slate-700"
                            : "border-slate-700"
                        }
                      >
                        Against
                      </Button>
                    </div>
                  </div>

                  {/* Opponent */}
                  <div className="space-y-2">
                    <Label>Challenge Opponent (optional)</Label>
                    <Input
                      placeholder="Search by username..."
                      value={opponentSearch}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setOpponentSearch(e.target.value)
                      }
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    {opponentSearch && (
                      <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                        {availableDebaters.map((debater: User) => (
                          <div
                            key={debater.id}
                            className="p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer text-sm"
                          >
                            {debater.username}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateChallenge}
                    className="w-full bg-slate-700 hover:bg-slate-600"
                  >
                    Send Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Live Debates */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-slate-400" />
            Live Debates
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredDebates.map((debate: Debate, index: number) => (
                <motion.div
                  key={debate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {debate.topic.title}
                        </h3>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Live
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">For:</span>
                        <span className="text-white font-medium">
                          {debate.debater1.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Against:</span>
                        <span className="text-white font-medium">
                          {debate.debater2.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Round:</span>
                        <span className="text-white">
                          {debate.currentRound} / {debate.totalRounds}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleWatchDebate(debate.id)}
                      className="w-full bg-slate-700 hover:bg-slate-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {user?.role === "debater" ? "Join" : "Watch"} Debate
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredDebates.length === 0 && (
            <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
              <p className="text-slate-400">
                No debates found. Start a new challenge!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
