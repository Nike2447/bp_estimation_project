import React, { useState, useRef, useEffect } from 'react';
import { Camera, CircleOff, Activity, Loader, Heart } from 'lucide-react';

const BPPredictionApp = () => {
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [videoBlob, setVideoBlob] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  // Initialize video element reference
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
      
      // Check if video element is available
      if (!videoRef.current) {
        throw new Error("Video element not found. Please refresh the page.");
      }
      
      // Reset recorder
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      streamRef.current = stream;
      
      // Safely set srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Make sure video plays
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      } else {
        throw new Error("Video element not available after permission granted");
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up recording handlers
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Upload video for prediction
        uploadVideo(blob);
      };
      
      // Start countdown
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
      
      // Start recording
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
      
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get prediction");
      }
      
      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError("Error getting prediction: " + err.message);
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const getBPCategory = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "text-green-500" };
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "text-yellow-500" };
    if (systolic < 140 || diastolic < 90) return { label: "Hypertension Stage 1", color: "text-orange-500" };
    return { label: "Hypertension Stage 2", color: "text-red-500" };
  };
  
  return (
    <div className="flex flex-col items-center max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Heart className="mr-2 text-red-500" /> Blood Pressure Estimation
      </h1>
      
      <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-6 aspect-video relative">
        {recording ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 text-white text-4xl font-bold rounded-full w-16 h-16 flex items-center justify-center">
                {countdown}
              </div>
            </div>
          </>
        ) : videoBlob ? (
          <video
            src={URL.createObjectURL(videoBlob)}
            className="w-full h-full object-cover"
            controls
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover hidden"
            />
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <CircleOff size={48} className="mb-2" />
              <p>Camera feed will appear here</p>
            </div>
          </>
        )}
      </div>
      
      <div className="w-full mb-6">
        <button
          onClick={startRecording}
          disabled={recording || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      {loading && (
        <div className="w-full p-4 bg-gray-100 rounded-lg mb-6 flex flex-col items-center">
          <Loader className="animate-spin mb-2" size={32} />
          <p>Processing video and estimating blood pressure...</p>
        </div>
      )}
      
      {error && (
        <div className="w-full p-4 bg-red-100 text-red-800 rounded-lg mb-6">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {prediction && (
        <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="mr-2" /> Blood Pressure Results
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Systolic</p>
              <p className="text-3xl font-bold text-blue-600">{Math.round(prediction.systolic)}</p>
              <p className="text-xs text-gray-500">mmHg</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Diastolic</p>
              <p className="text-3xl font-bold text-blue-600">{Math.round(prediction.diastolic)}</p>
              <p className="text-xs text-gray-500">mmHg</p>
            </div>
          </div>
          
          {prediction.systolic && prediction.diastolic && (
            <div className="text-center mt-2">
              <p className="text-lg font-medium">
                Category: <span className={getBPCategory(prediction.systolic, prediction.diastolic).color}>
                  {getBPCategory(prediction.systolic, prediction.diastolic).label}
                </span>
              </p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="text-center italic">
              This is an estimation based on PPG analysis. For accurate medical readings, 
              please consult a healthcare professional.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-8 w-full">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
          <li>Position your face clearly in the camera view</li>
          <li>Ensure good lighting on your face</li>
          <li>Stay still during the 7-second recording</li>
          <li>The app will extract PPG signals from your facial skin</li>
          <li>AI model will estimate your blood pressure</li>
        </ol>
      </div>
    </div>
  );
};

export default BPPredictionApp;