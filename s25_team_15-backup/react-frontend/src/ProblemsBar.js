import React, { useEffect, useState } from 'react';

// const ProblemsBar = () => {
//   const [problems, setProblems] = useState([]);

//   useEffect(() => {
//     fetch('http://localhost:8000/crackjob/problems/')
//       .then(response => response.json())
//       .then(data => setProblems(data))
//       .catch(err => console.error(err));
//   }, []);

//   return (
//     <div style={{ border: '1px solid gray', padding: '1rem', maxWidth: '400px' }}>
//       <h2>Problems</h2>
//       <ul>
//         {problems.map(problem => (
//           <li key={problem.id}>
//             <strong>{problem.title}</strong>
//             <p style={{ fontSize: '0.8rem' }}>{problem.description}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ProblemsBar;

const ProblemsBar = ({ onProblemSelect }) => {
    const [problems, setProblems] = useState([]);
  
    useEffect(() => {
      fetch("http://localhost:8000/crackjob/problems")
        .then(res => res.json())
        .then(data => setProblems(data))
        .catch(err => console.error("Failed to fetch problems:", err));
    }, []);
  
    return (
      <div style={{ width: "250px", padding: "1rem", borderRight: "1px solid #ddd" }}>
        <h3>Problems</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {problems.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                console.log("Clicked problem:", p);  // ✅ log to confirm
                onProblemSelect(p);
              }}
              style={{
                cursor: "pointer",
                padding: "0.5rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              {p.title}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default ProblemsBar;
