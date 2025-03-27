import React, { useState, useRef, useEffect } from 'react';
import { Camera, CircleOff, Activity, Loader, Heart, ArrowLeft, AlertCircle, UserCheck, SignalHigh} from 'lucide-react';

const BPPredictionApp = ({ onBack, onSaveReading  }) => {
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [videoBlob, setVideoBlob] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (videoRef.current) {
      setCameraReady(true);
    }
  }, []);
  
  const startRecording = async () => {
    try {
      setError(null);
      setPrediction(null);
      setVideoBlob(null);
      setShowResults(false);
      
      if (!videoRef.current) {
        throw new Error("Video element not found. Please refresh the page.");
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      } else {
        throw new Error("Video element not available after permission granted");
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        
        stream.getTracks().forEach(track => track.stop());
        
        uploadVideo(blob);
      };
      
      setRecording(true);
      setCountdown(7);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      mediaRecorder.start();
    } catch (err) {
      setError("Failed to access camera: " + err.message);
      console.error("Error accessing camera:", err);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };
  
  const uploadVideo = async (blob) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', blob, 'recording.webm');
      
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get prediction");
      }
      
      const result = await response.json();
      setPrediction(result);
      setShowResults(true);
      onSaveReading(result);
    } catch (err) {
      setError("Error getting prediction: " + err.message);
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetake = () => {
    setShowResults(false);
    setPrediction(null);
    setVideoBlob(null);
  };
  
  const getBPCategory = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200" };
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "text-yellow-500", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    if (systolic < 140 || diastolic < 90) return { label: "Hypertension Stage 1", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
    return { label: "Hypertension Stage 2", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200" };
  };
  
  const getHeartRateStatus = (bpm) => {
    if (!bpm) return { label: "Unknown", color: "text-gray-500", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    
    if (bpm < 60) return { label: "Low", color: "text-yellow-500", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    if (bpm >= 60 && bpm <= 100) return { label: "Normal", color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200" };
    return { label: "High", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200" };
  };
  
  const getSignalQualityInfo = (quality) => {
    if (!quality) return { color: "text-gray-500", bgColor: "bg-gray-50", icon: null };
    
    const qualityLower = quality.toLowerCase();
    if (qualityLower === "good") return { 
      color: "text-green-500", 
      bgColor: "bg-green-50", 
      icon: <SignalHigh className="text-green-500" size={18} />
    };
    if (qualityLower === "fair") return { 
      color: "text-yellow-500", 
      bgColor: "bg-yellow-50", 
      icon: <SignalHigh className="text-yellow-500" size={18} />
    };
    return { 
      color: "text-red-500", 
      bgColor: "bg-red-50", 
      icon: <SignalHigh className="text-red-500" size={18} />
    };
  };
  
  return (
    <div className="flex flex-col items-center max-w-xl mx-auto p-6 bg-gray-50 rounded-xl shadow-sm">
      {/* Header */}
      <div className="w-full mb-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold flex items-center bg-white py-2 px-4 rounded-full shadow-sm">
          <Heart className="mr-2 text-red-500" fill="rgba(239, 68, 68, 0.2)" /> 
          <span className="bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">Vital Signs</span>
        </h1>
        <div className="w-6"></div>
      </div>
     
      {!showResults && (
        <div className="w-full bg-gray-900 rounded-2xl overflow-hidden mb-8 aspect-video relative shadow-lg border-4 border-white">
          {recording ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-60 px-3 py-1 rounded-full">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                <span className="text-white text-sm font-medium">Recording</span>
              </div>
              
              {/* Countdown overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                  <div className="relative bg-black bg-opacity-70 text-white text-5xl font-bold rounded-full w-24 h-24 flex items-center justify-center border-4 border-white shadow-lg">
                    {countdown}
                  </div>
                </div>
              </div>
              
              {/* Scanning effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 right-0 h-0 bg-blue-100 opacity-70 animate-scan"></div>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover hidden"
              />
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-b from-gray-800 to-gray-900 p-8">
                <CircleOff size={64} className="mb-4 opacity-80" />
                <p className="text-xl font-medium mb-2">Camera feed will appear here</p>
                <p className="text-gray-500 text-center max-w-xs">Position your face clearly in frame for accurate vital sign measurements</p>
                
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <div className="flex flex-col items-center">
                    <Heart className="text-red-500 mb-2" size={28} />
                    <span className="text-gray-400 text-sm">Heart Rate</span>
                  </div>
                  
                  <div className="h-12 border-l border-gray-700"></div>
                  
                  <div className="flex flex-col items-center">
                    <Activity className="text-blue-500 mb-2" size={28} />
                    <span className="text-gray-400 text-sm">Blood Pressure</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {!showResults && !loading && (
        <div className="w-full mb-6">
          <button
            onClick={startRecording}
            disabled={recording}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {recording ? (
              <span className="flex items-center">
                <Loader className="animate-spin mr-2" size={20} />
                Recording...
              </span>
            ) : (
              <span className="flex items-center">
                <Camera className="mr-2" size={20} />
                Start Recording (7 seconds)
              </span>
            )}
          </button>
        </div>
      )}
      
      {loading && (
        <div className="w-full p-6 bg-blue-50 rounded-lg mb-6 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-blue-800 font-medium">Processing video and extracting vital signs...</p>
          <p className="text-blue-600 text-sm mt-2">This may take a few moments</p>
        </div>
      )}
      
      {error && (
        <div className="w-full p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mb-6 flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-red-800">Error Occurred</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {showResults && prediction && (
        <div className="w-full animate-fadeIn">
          {/* Header Card - Overview */}
          <div className="w-full p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg mb-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results</h2>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm font-medium">Test Complete</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Activity size={18} className="mr-1" />
                  <p className="text-xs font-medium">BLOOD PRESSURE</p>
                </div>
                <p className="text-xl font-bold">{Math.round(prediction.systolic)}/{Math.round(prediction.diastolic)}</p>
                <p className="text-xs">mmHg</p>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Heart size={18} className="mr-1" />
                  <p className="text-xs font-medium">HEART RATE</p>
                </div>
                <p className="text-xl font-bold">{Math.round(prediction.heart_rate)}</p>
                <p className="text-xs">BPM</p>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <SignalHigh size={18} className="mr-1" />
                  <p className="text-xs font-medium">SIGNAL</p>
                </div>
                <p className="text-xl font-bold">{prediction.signal_quality || "N/A"}</p>
                <p className="text-xs">Quality</p>
              </div>
            </div>
            
            {prediction.systolic && prediction.diastolic && (
              <div className="w-full bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-sm">
                  {getBPCategory(prediction.systolic, prediction.diastolic).label}
                </p>
              </div>
            )}
          </div>
          
          {/* Blood Pressure Results */}
          <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <Activity size={128} />
            </div>
            
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Activity className="mr-2 text-blue-600" /> Blood Pressure
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className={`${getBPCategory(prediction.systolic, prediction.diastolic).bgColor} rounded-lg p-5 text-center relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                <div className="absolute inset-0 opacity-5">
                  <div className="h-full w-1/2 bg-black"></div>
                </div>
                <p className="text-sm text-gray-700 mb-1">Systolic</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">{Math.round(prediction.systolic)}</p>
                <p className="text-xs text-gray-500">mmHg</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white text-xs font-medium">
                  Upper reading
                </div>
              </div>
              
              <div className={`${getBPCategory(prediction.systolic, prediction.diastolic).bgColor} rounded-lg p-5 text-center relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                <div className="absolute inset-0 opacity-5">
                  <div className="h-full w-1/2 ml-auto bg-black"></div>
                </div>
                <p className="text-sm text-gray-700 mb-1">Diastolic</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">{Math.round(prediction.diastolic)}</p>
                <p className="text-xs text-gray-500">mmHg</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white text-xs font-medium">
                  Lower reading
                </div>
              </div>
            </div>
            
            {prediction.systolic && prediction.diastolic && (
              <div className={`${getBPCategory(prediction.systolic, prediction.diastolic).bgColor} ${getBPCategory(prediction.systolic, prediction.diastolic).borderColor} border-l-4 p-4 rounded-r-lg`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getBPCategory(prediction.systolic, prediction.diastolic).color} mr-2`}></div>
                  <p className={`text-lg font-medium ${getBPCategory(prediction.systolic, prediction.diastolic).color}`}>
                    {getBPCategory(prediction.systolic, prediction.diastolic).label}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-5">
                  {prediction.systolic < 120 && prediction.diastolic < 80 ? 
                    "Your blood pressure appears to be in the normal range." : 
                    prediction.systolic < 130 && prediction.diastolic < 80 ?
                    "Your blood pressure appears to be elevated. Consider monitoring regularly." :
                    prediction.systolic < 140 || prediction.diastolic < 90 ?
                    "Your blood pressure suggests stage 1 hypertension. Consider consulting a healthcare provider." :
                    "Your blood pressure suggests stage 2 hypertension. We recommend consulting a healthcare provider soon."
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Heart Rate Results */}
          <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <Heart size={128} />
            </div>
            
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Heart className="mr-2 text-red-500" /> Heart Rate
            </h2>
            
            <div className={`${getHeartRateStatus(prediction.heart_rate).bgColor} rounded-lg p-6 text-center mb-6 relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-300 to-red-500"></div>
              
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <Heart size={48} className="text-red-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-4 w-4 rounded-full bg-red-400 opacity-75"></div>
                    <div className="relative rounded-full h-2 w-2 bg-red-500"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-1">Heart Rate</p>
              <p className="text-5xl font-bold text-red-600 mb-1">{Math.round(prediction.heart_rate)}</p>
              <p className="text-xs text-gray-500 mb-3">Beats Per Minute</p>
              
              <div className={`inline-block px-4 py-2 rounded-full ${getHeartRateStatus(prediction.heart_rate).bgColor} border ${getHeartRateStatus(prediction.heart_rate).borderColor}`}>
                <p className={`font-medium ${getHeartRateStatus(prediction.heart_rate).color}`}>
                  {getHeartRateStatus(prediction.heart_rate).label}
                </p>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {prediction.heart_rate < 60 ? 
                  "Your heart rate appears to be low (bradycardia). If you regularly experience a low heart rate, consider consulting a healthcare provider." : 
                  prediction.heart_rate >= 60 && prediction.heart_rate <= 100 ?
                  "Your heart rate is within the normal resting range for most adults." :
                  "Your heart rate appears to be elevated (tachycardia). This can be normal during exercise or stress, but if you're at rest, consider monitoring it."
                }
              </p>
            </div>
          </div>
          
          {/* User Information */}
          <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserCheck className="mr-2 text-indigo-500" /> User Profile
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 p-4 rounded-lg flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-medium">{prediction.age?.toString().charAt(0) || "?"}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Detected Age</p>
                  <p className="text-lg font-bold text-gray-800">{prediction.age || "Unknown"}</p>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-medium">{prediction.gender?.toString().charAt(0) || "?"}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Detected Gender</p>
                  <p className="text-lg font-bold text-gray-800">{prediction.gender || "Unknown"}</p>
                </div>
              </div>
            </div>
            
            <div className={`${getSignalQualityInfo(prediction.signal_quality).bgColor} p-4 rounded-lg flex items-center justify-between`}>
              <div className="flex items-center">
                {getSignalQualityInfo(prediction.signal_quality).icon}
                <div className="ml-2">
                  <p className="text-sm text-gray-500">Signal Quality</p>
                  <p className={`text-lg font-bold ${getSignalQualityInfo(prediction.signal_quality).color}`}>
                    {prediction.signal_quality || "Unknown"}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {prediction.signal_quality === "Poor" ? 
                    "Results may not be accurate" : 
                    prediction.signal_quality === "Fair" ?
                    "Results have moderate accuracy" :
                    "Results likely have good accuracy"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Session Info */}
          <div className="w-full p-4 bg-gray-50 rounded-lg mb-6 text-center">
            <p className="text-sm text-gray-500">
              Session ID: <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{prediction.session_id}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Reading taken on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className="w-full p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg mb-6">
            <div className="flex">
              <AlertCircle className="text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                <p className="text-sm text-yellow-700">
                  This is an estimation based on facial video analysis. For accurate medical readings, 
                  please consult a healthcare professional.
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-4">
            <button
              onClick={handleRetake}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <Camera className="mr-2" size={20} />
              Retake Test
            </button>
            
            <button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <ArrowLeft className="mr-2" size={20} />
              Return Home
            </button>
          </div>
        </div>
      )}
      
      {!showResults && (
        <div className="mt-8 w-full">
          <h3 className="font-medium mb-2">Instructions:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li className="pb-2 border-b border-gray-100">Position your face clearly in the camera view</li>
            <li className="pb-2 border-b border-gray-100">Ensure good lighting on your face</li>
            <li className="pb-2 border-b border-gray-100">Stay still during the 7-second recording</li>
            <li className="pb-2 border-b border-gray-100">The app will extract vital signs from your facial video</li>
            <li>AI model will estimate your blood pressure and heart rate</li>
          </ol>
        </div>
      )}
      
      {/* Add some styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BPPredictionApp;