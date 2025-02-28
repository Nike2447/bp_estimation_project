import React, { useState } from 'react';
import './App.css';
import BPPredictionApp from './components/BPPredictionApp';
import { Heart, Info, Home, Activity, ArrowRight } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'prediction':
        return <BPPredictionApp onBack={() => navigateTo('home')} />;
      case 'about':
        return <AboutUsPage onBack={() => navigateTo('home')} />;
      case 'home':
      default:
        return <HomePage onStart={() => navigateTo('prediction')} onAbout={() => navigateTo('about')} />;
    }
  };

  return (
    <div className="App min-h-screen flex flex-col">
      <header className="bg-blue-600 py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Heart className="text-white mr-2" size={24} />
            <h1 className="text-white text-xl font-bold">BP Estimation System</h1>
          </div>
          <nav className="flex space-x-4">
            <button 
              onClick={() => navigateTo('home')} 
              className={`flex items-center text-white px-3 py-1 rounded-md transition-all ${currentPage === 'home' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <Home size={18} className="mr-1" /> Home
            </button>
            <button 
              onClick={() => navigateTo('prediction')} 
              className={`flex items-center text-white px-3 py-1 rounded-md transition-all ${currentPage === 'prediction' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <Activity size={18} className="mr-1" /> Test BP
            </button>
            <button 
              onClick={() => navigateTo('about')} 
              className={`flex items-center text-white px-3 py-1 rounded-md transition-all ${currentPage === 'about' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <Info size={18} className="mr-1" /> About Us
            </button>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {renderPage()}
      </main>
      
      <footer className="mt-auto py-4 bg-gray-100 text-center text-gray-600 text-sm">
        <div className="container mx-auto">
          <p>Blood Pressure Estimation Web Application</p>
          <p className="text-xs mt-1">Developed with React, Flask, and TensorFlow</p>
        </div>
      </footer>
    </div>
  );
}

const HomePage = ({ onStart, onAbout }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold mb-4 text-blue-700">AI-Powered Blood Pressure Estimation</h2>
          <p className="text-gray-700 mb-4">
            Our innovative system uses facial video analysis to estimate your blood pressure without traditional cuffs or invasive methods. Through deep learning algorithms, we analyze subtle color changes in your facial skin that correspond to your heartbeat.
          </p>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center transition-all"
            >
              Start Estimation <ArrowRight size={18} className="ml-2" />
            </button>
            <button
              onClick={onAbout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg flex items-center transition-all"
            >
              Learn More <Info size={18} className="ml-2" />
            </button>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="bg-blue-50 p-6 rounded-full h-64 w-64 flex items-center justify-center">
            <Heart className="text-red-500" size={120} />
          </div>
        </div>
      </div>
      
      <div className="mt-12 mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-center">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">1</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">Video Recording</h4>
            <p className="text-gray-600 text-center">
              A 7-second video recording of your face captures subtle color changes in your skin.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">2</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">Signal Processing</h4>
            <p className="text-gray-600 text-center">
              Our algorithms extract photoplethysmography (PPG) signals from the video.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">3</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">AI Analysis</h4>
            <p className="text-gray-600 text-center">
              Deep learning models analyze the signals to estimate your systolic and diastolic blood pressure.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Important Notes</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Estimations are for informational purposes only and not a medical diagnosis</li>
          <li>For accurate medical readings, please consult a healthcare professional</li>
          <li>Best results are achieved with good lighting and minimal movement</li>
          <li>Your privacy is important - videos are processed locally and not stored</li>
        </ul>
      </div>
    </div>
  );
};

const AboutUsPage = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-700"
      >
        ← Back to Home
      </button>
      
      <h2 className="text-3xl font-bold mb-6 text-center">About Our Team</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
        <p className="text-gray-700 mb-4">
          We aim to make health monitoring more accessible and convenient through innovative technology. 
          Our BP Estimation System represents a step forward in contactless health measurements, enabling users 
          to track their cardiovascular health without traditional equipment.
        </p>
        <p className="text-gray-700">
          Founded by a team of healthcare professionals and AI specialists, our application combines medical 
          knowledge with cutting-edge deep learning to provide valuable health insights.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">The Technology</h3>
        <p className="text-gray-700 mb-4">
          Our blood pressure estimation technology is based on remote photoplethysmography (rPPG), a technique that 
          measures blood volume changes by analyzing slight color variations in the skin that occur with each heartbeat.
        </p>
        <p className="text-gray-700 mb-4">
          The system employs a convolutional neural network trained on thousands of paired video and blood pressure 
          readings to detect patterns that correlate with systolic and diastolic blood pressure levels.
        </p>
        <p className="text-gray-700">
          This technology has been validated in preliminary studies with promising results, though we continuously 
          work to improve its accuracy and reliability.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Research & Development</h3>
        <p className="text-gray-700 mb-4">
          Our team is committed to ongoing research in non-invasive health monitoring technologies. We collaborate 
          with medical institutions to validate and improve our algorithms.
        </p>
        <p className="text-gray-700">
          We prioritize both innovation and scientific rigor, ensuring that our technology is both cutting-edge 
          and grounded in established medical principles.
        </p>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default App;