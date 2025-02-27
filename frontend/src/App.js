// src/App.js
import React from 'react';
import './App.css';
import BPPredictionApp from './components/BPPredictionApp';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 py-4 mb-6">
        <div className="container mx-auto">
          <h1 className="text-white text-xl font-bold">BP Estimation System</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4">
        <BPPredictionApp />
      </main>
      
      <footer className="mt-12 py-4 bg-gray-100 text-center text-gray-600 text-sm">
        <div className="container mx-auto">
          <p>Blood Pressure Estimation Web Application</p>
          <p className="text-xs mt-1">Developed with React, Flask, and TensorFlow</p>
        </div>
      </footer>
    </div>
  );
}

export default App;