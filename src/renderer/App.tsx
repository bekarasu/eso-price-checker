import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Homepage from './Homepage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
      </Routes>
    </Router>
  );
}
