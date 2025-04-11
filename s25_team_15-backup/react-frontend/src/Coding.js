import React, { useEffect, useRef, useState } from "react";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-monokai";
import { Card, CardHeader, CardContent } from "@mui/material";
import { Typography, Button, Grid, Paper } from "@mui/material";

// const CodingPracticeEditor = ({ defaultCode = "# Write your Python code here", onSubmit, output }) => {
//   const editorRef = useRef(null);
//   const [code, setCode] = useState(defaultCode);

//   useEffect(() => {
//     const editor = ace.edit(editorRef.current);
//     editor.setTheme("ace/theme/monokai");
//     editor.session.setMode("ace/mode/python");
//     editor.setValue(code, 1);
//     editor.setOptions({
//       fontSize: "16px",
//       showPrintMargin: false,
//       useWorker: false,
//       tabSize: 4,
//       highlightActiveLine: true,
//     });

//     editor.session.on("change", () => {
//       setCode(editor.getValue());
//     });

//     return () => editor.destroy();
//   }, []);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (onSubmit) onSubmit(code);
//   };

//   return (
//     <div style={{ minHeight: "100vh", backgroundColor: "#f7f9fc", padding: "2rem" }}>
//       <Grid container spacing={4} justifyContent="center">
//         <Grid item xs={12} md={3}>
//           <Card elevation={6}>
//             <CardHeader title={<Typography variant="h5">Problem</Typography>} />
//             <CardContent>
//               <Typography variant="body1" color="textSecondary">
//                 Write a function that takes a list of integers and returns the sum of all even numbers.
//               </Typography>
//               <Typography variant="body2" style={{ marginTop: "1rem", fontFamily: "monospace" }}>
//                 Input: [1, 2, 3, 4] <br />
//                 Output: 6
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={9}>
//           <Card elevation={6}>
//             <CardHeader
//               title={<Typography variant="h5">Code Editor</Typography>}
//               action={
//                 <Button
//                   onClick={handleSubmit}
//                   variant="contained"
//                   color="primary"
//                   size="large"
//                   style={{ marginRight: "1rem", marginTop: "0.5rem" }}
//                 >
//                   ▶ Run Code
//                 </Button>
//               }
//             />
//             <CardContent>
//                 <Paper variant="outlined" style={{ borderRadius: "6px", marginBottom: "1.5rem" }}>
//                   <div ref={editorRef} style={{ height: "450px", width: "100%" }} />
//                 </Paper>

//               {output && (
//                 <Paper elevation={2} style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f0f2f5" }}>
//                   <Typography variant="h6" gutterBottom>
//                     Output
//                   </Typography>
//                   <pre style={{ fontSize: "14px", fontFamily: "monospace", maxHeight: "300px", overflow: "auto" }}>{output}</pre>
//                 </Paper>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//     </div>
//   );
// };

// export default CodingPracticeEditor;

const CodingPracticeEditor = ({ selectedProblem, onSubmit, output }) => {
  const editorRef = useRef(null);
  const [code, setCode] = useState("# Write your Python code here");

  // Inject function name when problem changes
  useEffect(() => {
    if (selectedProblem) {
      const starterCode = `def ${selectedProblem.function_name}():\n    pass`;
      setCode(starterCode);
      if (editorRef.current) {
        const editor = ace.edit(editorRef.current);
        editor.setValue(starterCode, 1);
      }
    }
  }, [selectedProblem]);

  useEffect(() => {
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

    return () => editor.destroy();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(code);
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f7f9fc", minHeight: "100vh" }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card elevation={6}>
            <CardHeader title={<Typography variant="h5">Problem</Typography>} />
            <CardContent>
              {selectedProblem ? (
                <>
                  <Typography variant="h6">{selectedProblem.title}</Typography>
                  <Typography variant="body1" color="textSecondary" style={{ marginBottom: "1rem" }}>
                    {selectedProblem.description}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2">Select a problem from the sidebar.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={6}>
            <CardHeader
              title={<Typography variant="h5">Code Editor</Typography>}
              action={
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  size="large"
                  style={{ marginRight: "1rem", marginTop: "0.5rem" }}
                >
                  ▶ Run Code
                </Button>
              }
            />
            <CardContent>
              <Paper variant="outlined" style={{ borderRadius: "6px", marginBottom: "1.5rem" }}>
                <div ref={editorRef} style={{ height: "450px", width: "100%" }} />
              </Paper>

              {output && (
                <Paper elevation={2} style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f0f2f5" }}>
                  <Typography variant="h6" gutterBottom>
                    Output
                  </Typography>
                  <pre style={{ fontSize: "14px", fontFamily: "monospace", maxHeight: "300px", overflow: "auto" }}>{output}</pre>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default CodingPracticeEditor;