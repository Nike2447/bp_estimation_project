import React, { useState } from 'react';
import './App.css';
import BPPredictionApp from './components/BPPredictionApp';

function App() {
  const [showPredictionApp, setShowPredictionApp] = useState(false);

  return (
    <div className="App">
      <header className="bg-blue-600 py-4 mb-6">
        <div className="container mx-auto text-center">
          <h1 className="text-white text-xl font-bold">BP Estimation System</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 text-center">
        {!showPredictionApp ? (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Welcome to BP Estimation</h2>
            <p className="text-gray-700 mb-6">
              This application uses AI-powered facial video analysis to estimate your blood pressure.
              Simply start the test, and let our deep learning model do the rest!
            </p>
            <button
              onClick={() => setShowPredictionApp(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
            >
              Start Estimation
            </button>
          </div>
        ) : (
          <BPPredictionApp />
        )}
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
