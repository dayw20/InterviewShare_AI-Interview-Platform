import React, { useEffect, useRef, useState } from "react";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-monokai";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Problem {
  id: number;
  title: string;
  description: string;
  function_name: string;
}

interface CodingPracticeEditorProps {
  selectedProblem: Problem | null;
  onSubmit: (code: string) => void;
  output: string;
}

const CodingPracticeEditor: React.FC<CodingPracticeEditorProps> = ({
  selectedProblem,
  onSubmit,
  output,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [code, setCode] = useState<string>("# Write your Python code here");

  useEffect(() => {
    if (selectedProblem && editorRef.current) {
      const starterCode = `def ${selectedProblem.function_name}():\n    pass`;
      setCode(starterCode);

      const editor = ace.edit(editorRef.current);
      editor.setValue(starterCode, 1);
    }
  }, [selectedProblem]);

  useEffect(() => {
    if (editorRef.current) {
      const editor = ace.edit(editorRef.current);
      editor.setTheme("ace/theme/monokai");
      editor.session.setMode("ace/mode/python");
      editor.setValue(code, 1);
      editor.setOptions({
        fontSize: "16px",
        showPrintMargin: false,
        useWorker: false,
        tabSize: 4,
        highlightActiveLine: true,
      });

      editor.session.on("change", () => {
        setCode(editor.getValue());
      });

      return () => {
        editor.destroy();
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(code);
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedProblem ? (
            <>
              <h3 className="text-lg font-semibold">{selectedProblem.title}</h3>
              <p className="text-muted-foreground mt-2">{selectedProblem.description}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Select a problem from the sidebar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Code Editor</CardTitle>
          <Button size="sm" onClick={handleSubmit}>▶ Run Code</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mb-4 overflow-hidden">
            <div ref={editorRef} style={{ height: "450px", width: "100%" }} />
          </div>
          {output && (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-semibold mb-2">Output</h3>
              <pre className="text-sm font-mono whitespace-pre-wrap max-h-72 overflow-auto">{output}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CodingPracticeEditor;
