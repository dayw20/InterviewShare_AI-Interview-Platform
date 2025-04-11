import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Problem {
  id: number;
  title: string;
  description: string;
  function_name: string;
}

interface ProblemsBarProps {
  onProblemSelect: (problem: Problem) => void;
}

const ProblemsBar: React.FC<ProblemsBarProps> = ({ onProblemSelect }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/problems/")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setProblems(data.results || []))
      .catch((err) => {
        console.error("Failed to fetch problems:", err);
        setError("Failed to load problems.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="w-64 h-screen overflow-y-auto border-r p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Problems</h3>

      {loading && <p className="text-sm text-muted-foreground">Loading problems...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && problems.length === 0 && (
        <p className="text-sm text-muted-foreground">No problems available.</p>
      )}

      {!loading && !error && problems.length > 0 && (
        <ul className="space-y-2">
          {problems.map((p) => (
            <li
              key={p.id}
              onClick={() => onProblemSelect(p)}
              className="cursor-pointer p-2 rounded hover:bg-muted transition-colors text-sm"
            >
              {p.title}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default ProblemsBar;
