import { useState, useEffect } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import CodingPracticeEditor from "./components/ai/Coding";
import InteractiveProblemPanel from "./components/ai/InteractiveProblemPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "./components/ai/AppSidebar"; 
import { Separator } from "@/components/ui/separator"

import { Typography } from "@mui/material";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface Problem {
  id: number;
  title: string;
  description: string;
  function_name: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};


function Aimock() {
  const [output, setOutput] = useState<string>("");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Interactive panel width state
  
  // Add effect to handle window resizing
  useEffect(() => {
    // Function to handle resize
    const handleResize = () => {
      // This will force a re-render when the window is resized
      // which helps the resizable panels adjust properly
      setLeftPanelWidth(prev => prev);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const setCodeExternally = (code: string) => {
    console.log("Code updated externally:", code);
  };

  const handleCodeSubmit = async (code: string) => {
    const csrfToken = getCookie('csrftoken') || '';
    try {
      const response = await fetch(`${backendUrl}/code-verification/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,          
        },
        credentials: 'include',           
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

  // Function to select problem
  const onProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300); 
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarProvider>
        {/* Sidebar for problems */}
        <div 
          className={`transition-all duration-300 ease-in-out`} 
          style={{ width: isSidebarOpen ? '16rem' : '0' }}
        >
          <AppSidebar onProblemSelect={onProblemSelect} />
        </div>

        {/* Main content outside of sidebar constraints */}
        <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger onClick={toggleSidebar} />
            <span className="text-sm text-muted-foreground">Problem</span>
            <Separator orientation="vertical" className="ml-2 mr-2 h-4" />
          </div>
        </header>


          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <div className="h-full min-h-[calc(100vh-4rem)]">
              {/* Resizable panel group for the main content */}
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Left Panel - Interactive Problem */}
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="h-full flex flex-col border-r bg-white">
                    <div className="flex-1 flex flex-col justify-start px-4 pt-2 pb-0">
                      <InteractiveProblemPanel
                        questionId={selectedProblem ? String(selectedProblem.id) : ""}
                        currentCode={output}
                      />
                    </div>
                  </div>
                </ResizablePanel>


                <ResizableHandle />

                {/* Right Panel - Code Editor and Output */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <ResizablePanelGroup direction="vertical">
                      {/* Top: title + description */}
                      <ResizablePanel defaultSize={25}>
                        <div className="px-4 pt-2">
                          <Card className="w-full bg-white rounded-lg hover:shadow-lg transition-all duration-300 mt-6 max-h-[300px] overflow-auto">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                {selectedProblem?.title || "Problem Description"}
                              </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {selectedProblem?.description ? (
                                <Typography variant="body1">{selectedProblem.description}</Typography>
                              ) : (
                                <div className="text-muted-foreground text-sm text-center py-2">
                                  Please select a problem to view its description.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </ResizablePanel>


                      <ResizableHandle />

                      {/* Bottom: editor */}
                      <ResizablePanel defaultSize={75}>
                        <div className="flex-1 p-4">
                          <CodingPracticeEditor
                            selectedProblem={selectedProblem}
                            onSubmit={handleCodeSubmit}
                            output={output}
                            setCodeExternally={setCodeExternally}
                          />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default Aimock;