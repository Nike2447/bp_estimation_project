# app.py - Flask Backend
import os
import numpy as np
import tensorflow as tf
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile

app = Flask(__name__)
CORS(app)

# Load the trained ResNet model
MODEL_PATH = './bp_resnet_model'
model = tf.keras.models.load_model(MODEL_PATH)

def extract_ppg_from_video(video_path):
    """
    Extract PPG signal from video using facial detection and color analysis.
    
    Parameters:
    video_path (str): Path to the video file
    
    Returns:
    numpy.ndarray: Extracted PPG signal of length 875
    """
    # Open the video file
    cap = cv2.VideoCapture(video_path)
    
    # Check if video opened successfully
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Initialize face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Initialize array to store PPG signals
    ppg_signal = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            # Take the first face detected
            x, y, w, h = faces[0]
            
            # Define ROI (forehead or cheek area)
            forehead_roi = frame[y:y+int(h*0.3), x+int(w*0.3):x+int(w*0.7)]
            
            # Extract average green channel value (most sensitive to blood volume changes)
            if forehead_roi.size > 0:
                green_val = np.mean(forehead_roi[:, :, 1])
                ppg_signal.append(green_val)
    
    # Release video capture
    cap.release()
    
    # Process the raw PPG signal
    ppg_signal = np.array(ppg_signal)
    
    # Simple filtering (moving average to remove noise)
    window_size = 5
    ppg_filtered = np.convolve(ppg_signal, np.ones(window_size)/window_size, mode='valid')
    
    # Resample to exactly 875 points (to match model input)
    if len(ppg_filtered) > 0:
        ppg_resampled = np.interp(
            np.linspace(0, len(ppg_filtered) - 1, 875),
            np.arange(len(ppg_filtered)),
            ppg_filtered
        )
        
        # Normalize
        ppg_normalized = (ppg_resampled - np.min(ppg_resampled)) / (np.max(ppg_resampled) - np.min(ppg_resampled))
        
        return ppg_normalized
    
    raise ValueError("No valid PPG signal could be extracted")

def preprocess_ppg(ppg_signal):
    """
    Preprocess PPG signal to match the expected input format of the model.
    """
    # Reshape for model input (add batch and channel dimensions)
    ppg_processed = ppg_signal.reshape(1, 875, 1)
    return ppg_processed

@app.route('/predict', methods=['POST'])
def predict_bp():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    
    # Save the uploaded video to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
        video_path = temp_video.name
        video_file.save(video_path)
    
    try:
        # Extract PPG signal from the video
        ppg_signal = extract_ppg_from_video(video_path)
        
        # Preprocess PPG signal for model input
        ppg_processed = preprocess_ppg(ppg_signal)
        
        # Make prediction
        prediction = model.predict(ppg_processed)
        
        # Extract SBP and DBP values
        sbp = float(prediction[0][0][0])
        dbp = float(prediction[1][0][0])
        
        # Clean up temporary file
        os.unlink(video_path)
        
        return jsonify({
            'systolic': round(sbp, 1),
            'diastolic': round(dbp, 1)
        })
    
    except Exception as e:
        # Clean up temporary file
        if os.path.exists(video_path):
            os.unlink(video_path)
        
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)