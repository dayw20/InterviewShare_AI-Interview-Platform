import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Lightbulb, Code, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InteractiveProblemPanelProps {
  questionId: string;
  currentCode: string;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

const SpeechRecognition = (window.SpeechRecognition || (window as any).webkitSpeechRecognition) as {
  new (): SpeechRecognition;
};
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
}

const InteractiveProblemPanel: React.FC<InteractiveProblemPanelProps> = ({
  questionId,
  currentCode,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const [typedText, setTypedText] = useState<string>("");
  const [userApproach, setUserApproach] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(recognition);

  useEffect(() => {
    if (!typingMessage) {
      setTypedText("");
      return;
    }
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      setTypedText((prev) => prev + typingMessage.charAt(i));
      i++;
      if (i >= typingMessage.length) {
        clearInterval(interval);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: typingMessage },
        ]);
        speakResponse(typingMessage);
        setTypingMessage(null);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [typingMessage]);

  const callAskEndpoint = async (requestType: "hint" | "solution" | "feedback"): Promise<void> => {
    if (!questionId) {
      alert("No question loaded!");
      return;
    }
    try {
      const body = {
        question_id: questionId,
        request_type: requestType,
        current_code: currentCode,
        user_approach: requestType === "feedback" ? userApproach : undefined,
      };

      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          content:
            requestType === "feedback"
              ? `Requested feedback on approach: ${userApproach.slice(0, 50)}${userApproach.length > 50 ? "..." : ""}`
              : `Requested ${requestType}`,
        },
      ]);

      const res = await fetch("http://localhost:8000/api/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTypingMessage(data.answer || "No answer received.");
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${(err as Error).message}` },
      ]);
    }
  };

  const toggleRecording = (): void => {
    if (!recognitionRef.current) return alert("Speech recognition not supported.");
    if (!isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (!recognitionRef.current) return;
    const recog = recognitionRef.current;
    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserApproach((prev) => prev + " " + transcript);
    };
    recog.onerror = () => setIsRecording(false);
    recog.onend = () => setIsRecording(false);
  }, []);

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // ✅ Display placeholder card when no problem is selected
  if (!questionId) {
    return (
      <Card className="w-full bg-white rounded-lg shadow-md transition-all duration-300 mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Interactive Q&A
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm text-center py-6">
            Please select a problem to start the interactive session.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Interactive Q&A
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => callAskEndpoint("hint")}>
            <Lightbulb className="h-4 w-4" />
            Get Hint
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => callAskEndpoint("solution")}>
            <Code className="h-4 w-4" />
            Get Solution
          </Button>
        </div>

        {/* User approach input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Describe your approach (optional)"
            className="min-h-24 w-full"
            value={userApproach}
            onChange={(e) => setUserApproach(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => callAskEndpoint("feedback")}>
              Get Feedback
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Record Feedback
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Conversation area */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-[400px] overflow-y-auto">
          <div className="text-sm font-medium mb-2 text-gray-700">Conversation</div>
          {chatMessages.length === 0 && !typingMessage && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No conversation yet. Get started by requesting a hint, solution, or feedback.</p>
            </div>
          )}
          <div className="space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-3/4 px-3 py-2 rounded-lg ${
                    msg.role === "assistant" ? "bg-gray-100 text-gray-800" : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-1">
                    <Badge variant={msg.role === "assistant" ? "secondary" : "default"} className="text-xs lowercase">
                      {msg.role}
                    </Badge>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {typingMessage && (
              <div className="flex justify-start">
                <div className="max-w-3/4 px-3 py-2 rounded-lg bg-gray-100 text-gray-800">
                  <div className="mb-1 flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs lowercase">
                      assistant
                    </Badge>
                    <span className="text-xs text-muted-foreground">(typing)</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{typedText}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span>AI-powered assistance for your coding challenges</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InteractiveProblemPanel;
