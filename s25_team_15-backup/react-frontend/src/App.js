import React, { useState } from "react";
import CodingPracticeEditor from "./Coding"; // make sure path is correct
import ProblemsBar from "./ProblemsBar"; 

// function App() {
//   const [output, setOutput] = useState("");
//   const [selectedProblem, setSelectedProblem] = useState(null);

//   const handleCodeSubmit = async (code) => {
//     try {
//       const response = await fetch("http://localhost:8000/crackjob/coding", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           code: code,
//           language: "python3",        
//           question_id: 1              
//         }),
//       });

//       const data = await response.json();
//       setOutput(data.output || "No output received.");
//     } catch (error) {
//       console.error("Error submitting code:", error);
//       setOutput("Error occurred while submitting code.");
//     }
//   };

//   return (
//     <div style={{ display: "flex", height: "100vh" }}>
//     <ProblemsBar onProblemSelect={setSelectedProblem} />
//     <div style={{ flex: 1, padding: "1rem" }}>
//       {selectedProblem && <h2>{selectedProblem.title}</h2>}
//       <CodingPracticeEditor onSubmit={handleCodeSubmit} output={output} />
//     </div>
//   </div>
//   );
// }

// export default App;

function App() {
  const [output, setOutput] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);

  const handleCodeSubmit = async (code) => {
    try {
      const response = await fetch("http://localhost:8000/crackjob/coding", {
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
    <div style={{ display: "flex" }}>
      <ProblemsBar onProblemSelect={setSelectedProblem} />
      <div style={{ flex: 1 }}>
        <CodingPracticeEditor
          selectedProblem={selectedProblem}
          onSubmit={handleCodeSubmit}
          output={output}
        />
      </div>
    </div>
  );
}

export default App;
