import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Users, Radio } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { useAuth, type User } from "../contexts/AuthContext";
import { mockUsers } from "../mock/mockData";
import { useToast } from "../hooks/use-toast";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"debater" | "audience">("debater");

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = (mockUsers as User[]).find(
      (u) =>
        u.username === username && u.password === password && u.role === role
    );

    if (user) {
      login(user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}!`,
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or role mismatch",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-4 bg-slate-800 rounded-full mb-4"
            >
              <Radio className="w-8 h-8 text-slate-300" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Debate Proctor
            </h1>
            <p className="text-slate-400">Enter the arena of ideas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter your username"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-300">Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant={role === "debater" ? "default" : "outline"}
                    className={`w-full ${
                      role === "debater"
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                    }`}
                    onClick={() => setRole("debater")}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Debater
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant={role === "audience" ? "default" : "outline"}
                    className={`w-full ${
                      role === "audience"
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                    }`}
                    onClick={() => setRole("audience")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Audience
                  </Button>
                </motion.div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Login
            </Button>
          </form>

          {/* <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">
              Demo credentials:
            </p>
            <p className="text-xs text-slate-500 text-center mt-2">
              Debater: alex_debater / pass123 | Audience: emma_viewer / pass123
            </p>
          </div> */}
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
