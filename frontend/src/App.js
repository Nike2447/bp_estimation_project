import React, { useState, useEffect } from 'react';
import './App.css';
import BPPredictionApp from './components/BPPredictionApp';
import { Heart, Info, Home, Activity, ArrowRight, Bell, ArrowLeft, FileText, Check, ChevronDown, AlertCircle, User, BarChart2 } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showNotification, setShowNotification] = useState(false);
  const [lastReading, setLastReading] = useState(null);
  
  // Simulate a notification
  useEffect(() => {
    // Show notification after 5 seconds for demo purposes
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = () => {
    setShowNotification(false);
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Save mock reading data when test is completed
  const saveReading = (data) => {
    setLastReading(data);
    // Could also save to localStorage here
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'prediction':
        return <BPPredictionApp onBack={() => navigateTo('home')} onSaveReading={saveReading} />;
      case 'about':
        return <AboutUsPage onBack={() => navigateTo('home')} />;
      case 'results':
        return <ResultsHistoryPage onBack={() => navigateTo('home')} lastReading={lastReading} navigateTo={navigateTo} />;
      case 'home':
      default:
        return <HomePage onStart={() => navigateTo('prediction')} onAbout={() => navigateTo('about')} onResults={() => navigateTo('results')} />;
    }
  };

  return (
    <div className="App min-h-screen flex flex-col bg-white text-gray-900">
      {showNotification && (
        <div className="fixed top-4 right-4 max-w-md bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg z-50 animate-fade-in">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Bell className="mr-2" size={20} />
              <div>
                <p className="font-medium">Reminder</p>
                <p className="text-sm">It's time for your daily heart health check!</p>
              </div>
            </div>
            <button onClick={dismissNotification} className="text-blue-700 hover:text-blue-800">
              <Check size={18} />
            </button>
          </div>
        </div>
      )}

      <header className="bg-blue-600 py-4 shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Heart className="text-white mr-2" size={24} />
            <h1 className="text-white text-xl font-bold">Heart Health Monitoring</h1>
          </div>
          <nav className="flex items-center space-x-4">
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
              onClick={() => navigateTo('results')} 
              className={`flex items-center text-white px-3 py-1 rounded-md transition-all ${currentPage === 'results' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FileText size={18} className="mr-1" /> Results
            </button>
            <button 
              onClick={() => navigateTo('about')} 
              className={`flex items-center text-white px-3 py-1 rounded-md transition-all ${currentPage === 'about' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <Info size={18} className="mr-1" /> About
            </button>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6 bg-white">
        {renderPage()}
      </main>
      
      <footer className="mt-auto py-4 bg-gray-100 text-gray-600 text-center text-sm">
        <div className="container mx-auto">
          <p>Heart Health Estimation Web Application</p>
          <p className="text-xs mt-1">Developed with React, Flask, and TensorFlow</p>
          <div className="mt-3 flex justify-center space-x-4">
            <button href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</button>
            <button href="#" className="hover:text-blue-600 transition-colors">Terms of Use</button>
            <button href="#" className="hover:text-blue-600 transition-colors">Contact Us</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

const HomePage = ({ onStart, onAbout, onResults }) => {
  const [testimonials] = useState([
    {
      name: "Sarah J.",
      text: "This app helped me track my blood pressure trends without the hassle of traditional monitoring.",
      role: "Regular User"
    },
    {
      name: "Dr. Michael Chen",
      text: "A promising technology that could improve accessibility to cardiovascular monitoring.",
      role: "Cardiologist"
    },
    {
      name: "James T.",
      text: "I use this daily to keep an eye on my heart health. It's become part of my wellness routine.",
      role: "Fitness Enthusiast"
    }
  ]);
  
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold mb-4 text-blue-700">AI-Powered Heart Health Estimation</h2>
          <p className="text-gray-700 mb-4">
            Our innovative system leverages facial video analysis to assess heart health without traditional cuffs or invasive methods. Using deep learning algorithms, we analyze subtle color changes in your facial skin to estimate blood pressure (BP), heart rate (BPM), age, and gender with precision.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center transition-all"
            >
              Start Estimation <ArrowRight size={18} className="ml-2" />
            </button>
            <button
              onClick={onResults}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center transition-all"
            >
              View Results <FileText size={18} className="ml-2" />
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
          <div className="relative">
            <div className="bg-blue-50 p-6 rounded-full h-64 w-64 flex items-center justify-center">
              <Heart className="text-red-500 animate-pulse" size={120} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-center">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">1</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">Video Recording</h4>
            <p className="text-gray-600 text-center">
              A 7-second video recording of your face captures subtle color changes in your skin.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">2</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">Signal Processing</h4>
            <p className="text-gray-600 text-center">
              Our algorithms extract photoplethysmography (PPG) signals from the video.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="font-bold text-blue-600">3</span>
            </div>
            <h4 className="text-lg font-medium mb-2 text-center">AI Analysis</h4>
            <p className="text-gray-600 text-center">
              Deep learning models analyze the signals to estimate your systolic and diastolic blood pressure, heart rate (BPM), age, and gender.
            </p>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="mt-12 mb-12">
        <h3 className="text-2xl font-semibold mb-6 text-center">User Testimonials</h3>
        <div className="bg-blue-50 p-8 rounded-lg relative">
          <button 
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
            aria-label="Previous testimonial"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="text-center px-12">
            <p className="text-gray-700 italic text-lg mb-4">"{testimonials[activeTestimonial].text}"</p>
            <div className="font-medium text-blue-700">{testimonials[activeTestimonial].name}</div>
            <div className="text-sm text-gray-600">{testimonials[activeTestimonial].role}</div>
          </div>
          
          <button 
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
            aria-label="Next testimonial"
          >
            <ArrowRight size={16} />
          </button>
          
          <div className="flex justify-center mt-4 space-x-2">
            {testimonials.map((_, index) => (
              <button 
                key={index}
                className={`w-2 h-2 rounded-full ${activeTestimonial === index ? 'bg-blue-600' : 'bg-gray-300'}`}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
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
      
      {/* Call to Action */}
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Start Monitoring?</h3>
        <p className="text-gray-700 mb-6 max-w-xl mx-auto">
          Track your heart health metrics over time and gain valuable insights into your cardiovascular wellbeing.
        </p>
        <button
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
        >
          Begin Your First Test
        </button>
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
        <ArrowLeft size={18} className="mr-1" /> Back to Home
      </button>
      
      <h2 className="text-3xl font-bold mb-6 text-center">About Our Team</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
        <p className="text-gray-700 mb-4">
          We aim to make health monitoring more accessible and convenient through innovative technology. 
          Our Heart Health Estimation System represents a step forward in contactless health measurements, enabling users 
          to track their cardiovascular health without traditional equipment.
        </p>
        <p className="text-gray-700">
          Our application combines medical 
          knowledge with cutting-edge deep learning to provide valuable health insights.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">The Technology</h3>
        <p className="text-gray-700 mb-4">
          Our heart health estimation technology is based on remote photoplethysmography (rPPG), a technique that 
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
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
      
      {/* FAQ Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-6">Frequently Asked Questions</h3>
        
        <div className="space-y-4">
          {[
            {
              question: "How accurate is the blood pressure estimation?",
              answer: "Our technology has demonstrated accuracy within ±10mmHg for systolic and ±7mmHg for diastolic blood pressure in controlled settings. However, results may vary based on lighting conditions, movement, and individual factors."
            },
            {
              question: "Can this replace traditional blood pressure monitors?",
              answer: "Our technology is intended as a complementary tool for regular monitoring, not as a replacement for clinical-grade blood pressure monitors. For medical diagnoses or critical health decisions, please consult healthcare professionals."
            },
            {
              question: "How is my privacy protected?",
              answer: "Your facial videos are processed locally on your device and are never stored or transmitted to external servers. We prioritize your privacy and data security."
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <button className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-blue-600">
                <span>{faq.question}</span>
                <ChevronDown size={16} />
              </button>
              <div className="mt-2 text-gray-700">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
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

// Results History Page
const ResultsHistoryPage = ({ onBack, lastReading, navigateTo }) => {
  // BP status classification
  const getBPStatus = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "text-green-600", bgColor: "bg-green-50", icon: "✓" };
    if ((systolic >= 120 && systolic <= 129) && diastolic < 80) return { label: "Elevated", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: "!" };
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return { label: "Stage 1 Hypertension", color: "text-orange-600", bgColor: "bg-orange-50", icon: "⚠" };
    if (systolic >= 140 || diastolic >= 90) return { label: "Stage 2 Hypertension", color: "text-red-600", bgColor: "bg-red-50", icon: "!!" };
    return { label: "Consult Doctor", color: "text-gray-600", bgColor: "bg-gray-50", icon: "?" };
  };

  const getHRStatus = (rate) => {
    if (rate < 60) return { label: "Low", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    if (rate > 100) return { label: "High", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { label: "Normal", color: "text-green-600", bgColor: "bg-green-50" };
  };

  // Format date if available
  const formatDate = () => {
    if (!lastReading || !lastReading.timestamp) return "Recent reading";
    const date = new Date(lastReading.timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 min-h-screen rounded-3xl">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium"
      >
        <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
      </button>
      
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Your Health Results</h2>
      <p className="text-gray-500 mb-8">View and track your vital measurements over time</p>
      
      {lastReading ? (
        <>
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">Latest Reading</h3>
              <span className="text-sm text-gray-500">{formatDate()}</span>
            </div>
            
            {/* Blood Pressure Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Activity size={20} className="text-blue-600 mr-2" />
                <h4 className="text-lg font-medium text-gray-800">Blood Pressure</h4>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:shadow-md">
                  <p className="text-sm text-blue-600 font-medium">Systolic</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-800">{lastReading.systolic}</p>
                    <p className="ml-2 text-gray-500">mmHg</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:shadow-md">
                  <p className="text-sm text-blue-600 font-medium">Diastolic</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-800">{lastReading.diastolic}</p>
                    <p className="ml-2 text-gray-500">mmHg</p>
                  </div>
                </div>
              </div>
              
              <div className={`${getBPStatus(lastReading.systolic, lastReading.diastolic).bgColor} p-4 rounded-xl border ${getBPStatus(lastReading.systolic, lastReading.diastolic).color.replace('text', 'border')}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Classification</p>
                    <p className={`text-xl font-bold ${getBPStatus(lastReading.systolic, lastReading.diastolic).color}`}>
                      {getBPStatus(lastReading.systolic, lastReading.diastolic).label}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getBPStatus(lastReading.systolic, lastReading.diastolic).color.replace('text', 'bg')} bg-opacity-20`}>
                    <span className={`text-xl ${getBPStatus(lastReading.systolic, lastReading.diastolic).color}`}>
                      {getBPStatus(lastReading.systolic, lastReading.diastolic).icon}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Heart Rate Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Heart size={20} className="text-red-600 mr-2" />
                <h4 className="text-lg font-medium text-gray-800">Heart Rate</h4>
              </div>
              
              <div className={`${getHRStatus(lastReading.heart_rate || lastReading.heartRate).bgColor} p-4 rounded-xl border ${getHRStatus(lastReading.heart_rate || lastReading.heartRate).color.replace('text', 'border')}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Beats Per Minute</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-gray-800">{lastReading.heart_rate || lastReading.heartRate}</p>
                      <p className="ml-2 text-gray-500">BPM</p>
                    </div>
                    <p className={`text-sm font-medium mt-1 ${getHRStatus(lastReading.heart_rate || lastReading.heartRate).color}`}>
                      {getHRStatus(lastReading.heart_rate || lastReading.heartRate).label}
                    </p>
                  </div>
                  <div className="flex h-16 items-center">
                    <div className="flex items-end h-12 space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i} 
                          className={`w-2 rounded-t-full ${getHRStatus(lastReading.heart_rate || lastReading.heartRate).color.replace('text', 'bg')}`}
                          style={{ 
                            height: `${Math.max(20, Math.min(Math.random() * 48, 48))}px`,
                            animationDuration: `${0.5 + Math.random()}s`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <User size={20} className="text-purple-600 mr-2" />
                <h4 className="text-lg font-medium text-gray-800">User Information</h4>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 transition-all hover:shadow-md">
                  <p className="text-sm text-purple-600 font-medium">Estimated Age</p>
                  <p className="text-3xl font-bold text-gray-800">{lastReading.predictedAge || lastReading.age}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 transition-all hover:shadow-md">
                  <p className="text-sm text-purple-600 font-medium">Estimated Gender</p>
                  <p className="text-3xl font-bold text-gray-800">{lastReading.predictedGender || lastReading.gender}</p>
                </div>
              </div>
            </div>
            
            {/* Signal Quality (if available) */}
            {lastReading.signal_quality && (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <BarChart2 size={20} className="text-teal-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-800">Signal Quality</h4>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  lastReading.signal_quality === "good" ? "bg-green-50 border-green-200" :
                  lastReading.signal_quality === "fair" ? "bg-yellow-50 border-yellow-200" : 
                  "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold ${
                      lastReading.signal_quality === "good" ? "text-green-600" :
                      lastReading.signal_quality === "fair" ? "text-yellow-600" : 
                      "text-red-600"
                    }`}>
                      {lastReading.signal_quality.charAt(0).toUpperCase() + lastReading.signal_quality.slice(1)}
                    </p>
                    <div className="flex space-x-1">
                      <div className={`h-2 w-2 rounded-full ${
                        ["fair", "good"].includes(lastReading.signal_quality) ? "bg-current" : "bg-gray-300"
                      } ${
                        lastReading.signal_quality === "good" ? "text-green-500" :
                        lastReading.signal_quality === "fair" ? "text-yellow-500" : 
                        "text-red-500"
                      }`}></div>
                      <div className={`h-3 w-2 rounded-full ${
                        ["fair", "good"].includes(lastReading.signal_quality) ? "bg-current" : "bg-gray-300"
                      } ${
                        lastReading.signal_quality === "good" ? "text-green-500" :
                        lastReading.signal_quality === "fair" ? "text-yellow-500" : 
                        "text-red-500"
                      }`}></div>
                      <div className={`h-4 w-2 rounded-full ${
                        lastReading.signal_quality === "good" ? "bg-green-500" : "bg-gray-300"
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
              <div className="flex">
                <AlertCircle className="text-yellow-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  This is an estimation based on facial video analysis. For accurate medical readings, 
                  please consult a healthcare professional.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={onBack}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center"
            >
              <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </button>
            <button
              onClick={() => navigateTo('prediction')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center"
            >
              Take New Test <ArrowLeft size={18} className="ml-2 transform rotate-180" />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Readings Yet</h3>
          <p className="text-gray-600 mb-6">You haven't taken any health tests yet. Start your health monitoring journey today.</p>
          <button
            onClick={() => navigateTo('prediction')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all inline-flex items-center"
          >
            Take Your First Test
            <ArrowLeft size={18} className="ml-2 transform rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;