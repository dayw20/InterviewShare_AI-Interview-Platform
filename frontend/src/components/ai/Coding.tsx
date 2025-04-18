import React, { useEffect, useRef, useState } from "react";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-monokai";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

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
  setCodeExternally: (code: string) => void; 
}

const CodingPracticeEditor: React.FC<CodingPracticeEditorProps> = ({
  selectedProblem,
  onSubmit,
  output,
  setCodeExternally,
}) => {
  const editorRef = useRef(null);
  const editorInstance = useRef<any>(null); 
  const [code, setCode] = useState("# Write your Python code here");

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      const editor = ace.edit(editorRef.current);
      editor.setTheme("ace/theme/monokai");
      editor.session.setMode("ace/mode/python");
      editor.setValue(code, 1); // Initialize with default code
      editor.setOptions({
        fontSize: "16px",
        showPrintMargin: false,
        useWorker: false,
        tabSize: 4,
        highlightActiveLine: true,
      });

      editorInstance.current = editor;

      // Editor change event
      editor.session.on("change", () => {
        const newCode = editor.getValue();
        setCode(newCode);
        setCodeExternally(newCode);
      });
    }
    
    // Cleanup editor when component unmounts
    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [setCodeExternally]);

  // Watch for changes in selectedProblem and update code
  useEffect(() => {
    if (selectedProblem && editorInstance.current) {
      const starterCode = `def ${selectedProblem.function_name}():\n    pass`;
      setCode(starterCode);
      editorInstance.current.setValue(starterCode, 1);
    }
  }, [selectedProblem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(code);
  };

  return (
    <Card className="w-full bg-white rounded-lg hover:shadow-lg transition-all duration-300 mt-2 ">
    
      <CardContent className="space-y-4 pb-2">
        <div ref={editorRef} className="h-[300px] mt-4 rounded-md overflow-hidden"></div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedProblem && (
            <span className="text-xs text-muted-foreground">
              Function: {selectedProblem.function_name}
            </span>
          )}
        </div>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={handleSubmit}
          className="gap-1"
        >
          <Play className="h-3 w-3" />
          <span>Run Code</span>
        </Button>
      </CardFooter>

      {output && (
        <CardContent className="pt-4 border-t space-y-2">
          <h3 className="text-lg font-medium">Output</h3>
          <div className="bg-muted p-4 rounded-md text-sm">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </CardContent>
      )}
    </Card>

  );
};

export default CodingPracticeEditor;