import { useState } from "react";
import "./App.css";
import Login from "./components/Login.jsx";

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1>Count is {count}</h1>
      <button onClick={() => setCount(count + 1)}>Click</button>
    </>
  );
}

export default App;
