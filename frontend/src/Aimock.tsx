import { useState } from "react";
import CodingPracticeEditor from "./components/ai/Coding";
import ProblemsBar from "./components/ai/ProblemsBar";

interface Problem {
  id: number;
  title: string;
  description: string;
  function_name: string;
}

function Aimock() {
  const [output, setOutput] = useState<string>("");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  const handleCodeSubmit = async (code: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/code-verification/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: "python3",
          question_id: selectedProblem?.id || 1,
        }),
      });

      const data = await response.json();
      setOutput(data.output || "No output received.");
    } catch (error) {
      console.error("Error submitting code:", error);
      setOutput("Error occurred while submitting code.");
    }
  };

  return (
    <div className="flex min-h-screen">
      <ProblemsBar onProblemSelect={setSelectedProblem} />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <CodingPracticeEditor
          selectedProblem={selectedProblem}
          onSubmit={handleCodeSubmit}
          output={output}
        />
      </main>
    </div>
  );
}

export default Aimock;
