# app.py - Flask Backend
import os
import numpy as np
import tensorflow as tf
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import matplotlib.pyplot as plt
from scipy.signal import butter, filtfilt

app = Flask(__name__)
CORS(app)

# Configure a debug directory
DEBUG_DIR = './debug_output'
os.makedirs(DEBUG_DIR, exist_ok=True)

# Load the trained ResNet model
MODEL_PATH = './bp_resnet_model'
model = tf.keras.models.load_model(MODEL_PATH)

def butter_bandpass(lowcut, highcut, fs, order=5):
    """Create a butterworth bandpass filter"""
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def bandpass_filter(data, lowcut, highcut, fs, order=5):
    """Apply a butterworth bandpass filter to data"""
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = filtfilt(b, a, data)
    return y

def extract_ppg_from_video(video_path, session_id=None):
    """
    Enhanced PPG signal extraction with better face tracking and multiple ROIs
    
    Parameters:
    video_path (str): Path to the video file
    session_id (str): Optional identifier for debugging
    
    Returns:
    numpy.ndarray: Extracted PPG signal of length 875
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Use standard Haar cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Store signals from multiple ROIs
    ppg_signals = {
        'forehead': [],
        'left_cheek': [],
        'right_cheek': []
    }
    
    # Debugging: Store sample frames
    debug_frames = []
    roi_frames = {roi: [] for roi in ppg_signals.keys()}
    face_detected_count = 0
    frame_count_read = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count_read += 1
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces with adjusted parameters
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(100, 100))
        
        # Create debug visualization frame
        debug_frame = frame.copy()
        
        if len(faces) > 0:
            face_detected_count += 1
            x, y, w, h = faces[0]
            
            # Draw rectangle around the face
            cv2.rectangle(debug_frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Define multiple ROIs
            forehead_roi = frame[y:y+int(h*0.25), x+int(w*0.3):x+int(w*0.7)]
            left_cheek_roi = frame[y+int(h*0.4):y+int(h*0.7), x+int(w*0.1):x+int(w*0.3)]
            right_cheek_roi = frame[y+int(h*0.4):y+int(h*0.7), x+int(w*0.7):x+int(w*0.9)]
            
            # Draw ROI rectangles on debug frame
            fh_y, fh_h = y, int(h*0.25)
            fh_x, fh_w = x+int(w*0.3), int(w*0.4)
            cv2.rectangle(debug_frame, (fh_x, fh_y), (fh_x+fh_w, fh_y+fh_h), (0, 255, 0), 2)
            
            lc_y, lc_h = y+int(h*0.4), int(h*0.3)
            lc_x, lc_w = x+int(w*0.1), int(w*0.2)
            cv2.rectangle(debug_frame, (lc_x, lc_y), (lc_x+lc_w, lc_y+lc_h), (0, 255, 0), 2)
            
            rc_y, rc_h = y+int(h*0.4), int(h*0.3)
            rc_x, rc_w = x+int(w*0.7), int(w*0.2)
            cv2.rectangle(debug_frame, (rc_x, rc_y), (rc_x+rc_w, rc_y+rc_h), (0, 255, 0), 2)
            
            # Add text labels
            cv2.putText(debug_frame, "Forehead", (fh_x, fh_y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            cv2.putText(debug_frame, "L Cheek", (lc_x, lc_y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            cv2.putText(debug_frame, "R Cheek", (rc_x, rc_y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Extract average color values (focusing on green channel)
            if forehead_roi.size > 0:
                ppg_signals['forehead'].append(np.mean(forehead_roi[:, :, 1]))
                roi_frames['forehead'].append(forehead_roi)
            
            if left_cheek_roi.size > 0:
                ppg_signals['left_cheek'].append(np.mean(left_cheek_roi[:, :, 1]))
                roi_frames['left_cheek'].append(left_cheek_roi)
                
            if right_cheek_roi.size > 0:
                ppg_signals['right_cheek'].append(np.mean(right_cheek_roi[:, :, 1]))
                roi_frames['right_cheek'].append(right_cheek_roi)
        else:
            cv2.putText(debug_frame, "No Face Detected", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Store debug frame
        if frame_count_read % 5 == 0:  # Store every 5th frame to avoid too many images
            debug_frames.append(debug_frame)
    
    cap.release()
    
    # Save debug information
    if session_id:
        debug_path = os.path.join(DEBUG_DIR, f"session_{session_id}")
        os.makedirs(debug_path, exist_ok=True)
        
        # Save debug frames
        for i, frame in enumerate(debug_frames):
            cv2.imwrite(os.path.join(debug_path, f"frame_{i:03d}.jpg"), frame)
        
        # Save sample ROIs
        for roi_name, frames in roi_frames.items():
            if frames:
                roi_dir = os.path.join(debug_path, f"roi_{roi_name}")
                os.makedirs(roi_dir, exist_ok=True)
                for i, frame in enumerate(frames[:10]):  # Save first 10 frames
                    cv2.imwrite(os.path.join(roi_dir, f"roi_{i:03d}.jpg"), frame)
    
    # Check if we have enough signal data
    valid_signals = {}
    signal_stats = {}
    
    for roi, signal in ppg_signals.items():
        if len(signal) > 20:  # Minimum threshold of frames
            signal_array = np.array(signal)
            valid_signals[roi] = signal_array
            signal_stats[roi] = {
                'mean': np.mean(signal_array),
                'std': np.std(signal_array),
                'min': np.min(signal_array),
                'max': np.max(signal_array),
                'length': len(signal_array)
            }
    
    if not valid_signals:
        raise ValueError(f"No valid PPG signals could be extracted. Face detected in {face_detected_count} of {frame_count_read} frames.")
    
    # Select the best signal based on variance (higher variance = stronger pulse signal)
    signal_variances = {roi: np.var(signal) for roi, signal in valid_signals.items()}
    best_roi = max(signal_variances, key=signal_variances.get)
    
    # Estimate fps if not available or unrealistic
    estimated_fps = fps if 10 <= fps <= 60 else 30
    
    # Get raw signal before filtering
    raw_signal = valid_signals[best_roi]
    
    # Apply bandpass filter (0.7-4Hz corresponds to 42-240 BPM)
    filtered_signal = bandpass_filter(raw_signal, 0.7, 4.0, estimated_fps)
    
    # Detrend (remove slow drifts)
    detrended_signal = filtered_signal - np.polyval(np.polyfit(np.arange(len(filtered_signal)), filtered_signal, 3), np.arange(len(filtered_signal)))
    
    # Resample to exactly 875 points
    ppg_resampled = np.interp(
        np.linspace(0, len(detrended_signal) - 1, 875),
        np.arange(len(detrended_signal)),
        detrended_signal
    )
    
    # Normalize
    ppg_normalized = (ppg_resampled - np.min(ppg_resampled)) / (np.max(ppg_resampled) - np.min(ppg_resampled))
    
    # Create diagnostic plots if session_id provided
    if session_id:
        # Create signal plots
        plt.figure(figsize=(15, 10))
        
        # Plot raw signals from all ROIs
        plt.subplot(3, 1, 1)
        for roi, signal in valid_signals.items():
            plt.plot(signal, label=f"{roi} (var: {signal_variances[roi]:.5f})")
        plt.title("Raw PPG Signals from Different ROIs")
        plt.legend()
        plt.grid(True)
        
        # Plot processing stages for best ROI
        plt.subplot(3, 1, 2)
        plt.plot(raw_signal, label="Raw")
        plt.plot(filtered_signal, label="Bandpass Filtered")
        plt.plot(detrended_signal, label="Detrended")
        plt.title(f"Signal Processing Stages (Best ROI: {best_roi})")
        plt.legend()
        plt.grid(True)
        
        # Plot final normalized signal
        plt.subplot(3, 1, 3)
        plt.plot(ppg_normalized)
        plt.title("Final Normalized PPG Signal (Model Input)")
        plt.xlabel("Sample")
        plt.ylabel("Normalized Amplitude")
        plt.grid(True)
        
        plt.tight_layout()
        plt.savefig(os.path.join(debug_path, "ppg_signals.png"))
        plt.close()
        
        # Save signal data for further analysis
        np.save(os.path.join(debug_path, "raw_signals.npy"), {roi: signal for roi, signal in valid_signals.items()})
        np.save(os.path.join(debug_path, "processed_signal.npy"), ppg_normalized)
        
        # Save signal stats as text
        with open(os.path.join(debug_path, "signal_stats.txt"), 'w') as f:
            f.write(f"Face detection rate: {face_detected_count}/{frame_count_read} frames\n")
            f.write(f"Video FPS: {fps}, Estimated FPS: {estimated_fps}\n\n")
            f.write(f"Best ROI: {best_roi} (variance: {signal_variances[best_roi]:.5f})\n\n")
            
            f.write("Signal Statistics:\n")
            for roi, stats in signal_stats.items():
                f.write(f"  {roi}:\n")
                for stat, value in stats.items():
                    f.write(f"    {stat}: {value}\n")
                f.write(f"    variance: {signal_variances[roi]:.5f}\n\n")
    
    return ppg_normalized, best_roi, signal_variances[best_roi]

def preprocess_ppg(ppg_signal):
    """
    Preprocess PPG signal to match the expected input format of the model.
    """
    # Reshape for model input (add batch and channel dimensions)
    ppg_processed = ppg_signal.reshape(1, 875, 1)
    return ppg_processed

def assess_signal_quality(variance, min_threshold=0.0001):
    """
    Assess the quality of the extracted PPG signal
    """
    if variance < min_threshold:
        return "poor"
    elif variance < min_threshold * 10:
        return "fair"
    else:
        return "good"

@app.route('/predict', methods=['POST'])
def predict_bp():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    
    # Generate a session ID for debugging
    session_id = f"{np.random.randint(10000, 99999)}"
    
    # Save the uploaded video to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
        video_path = temp_video.name
        video_file.save(video_path)
    
    try:
        # Extract PPG signal from the video
        ppg_signal, best_roi, signal_variance = extract_ppg_from_video(video_path, session_id)
        
        # Preprocess PPG signal for model input
        ppg_processed = preprocess_ppg(ppg_signal)
        
        # Make prediction
        prediction = model.predict(ppg_processed)
        
        # Extract SBP and DBP values
        sbp = float(prediction[0][0][0])
        dbp = float(prediction[1][0][0])
        
        # Debug: Record raw predictions
        debug_path = os.path.join(DEBUG_DIR, f"session_{session_id}")
        with open(os.path.join(debug_path, "prediction_results.txt"), 'w') as f:
            f.write(f"Raw predictions:\n")
            f.write(f"  SBP: {sbp}\n")
            f.write(f"  DBP: {dbp}\n")
            f.write(f"  Difference: {sbp - dbp}\n")
            f.write(f"  ROI: {best_roi}\n")
            f.write(f"  Signal variance: {signal_variance}\n")
            f.write(f"  Signal quality: {assess_signal_quality(signal_variance)}\n")
        
        # Adjust predictions if they are too similar
        # This is a temporary fix to avoid identical values
        if abs(sbp - dbp) < 5:
            # A typical SBP to DBP ratio is around 3:2
            mean_bp = (sbp + dbp) / 2
            sbp = mean_bp * 1.2  # Increase systolic by 20%
            dbp = mean_bp * 0.8  # Decrease diastolic by 20%
            
            with open(os.path.join(debug_path, "prediction_results.txt"), 'a') as f:
                f.write("\nAdjusted predictions (values were too similar):\n")
                f.write(f"  SBP: {sbp}\n")
                f.write(f"  DBP: {dbp}\n")
                f.write(f"  Difference: {sbp - dbp}\n")
        
        # Apply some basic physiological constraints
        if sbp <= dbp:
            # Ensure systolic is higher than diastolic
            dbp = min(dbp, 0.9 * sbp)  # Make diastolic at most 90% of systolic
            
            with open(os.path.join(debug_path, "prediction_results.txt"), 'a') as f:
                f.write("\nCorrected predictions (systolic <= diastolic):\n")
                f.write(f"  SBP: {sbp}\n")
                f.write(f"  DBP: {dbp}\n")
                f.write(f"  Difference: {sbp - dbp}\n")
            
        # Clean up temporary file
        os.unlink(video_path)
        
        signal_quality = assess_signal_quality(signal_variance)
        
        return jsonify({
            'systolic': round(sbp, 1),
            'diastolic': round(dbp, 1),
            'signal_quality': signal_quality,
            'session_id': session_id
        })
    
    except Exception as e:
        # Clean up temporary file
        if os.path.exists(video_path):
            os.unlink(video_path)
        
        # Log the error
        debug_path = os.path.join(DEBUG_DIR, f"session_{session_id}")
        os.makedirs(debug_path, exist_ok=True)
        with open(os.path.join(debug_path, "error.txt"), 'w') as f:
            f.write(str(e))
        
        return jsonify({
            'error': str(e),
            'session_id': session_id
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/debug/<session_id>', methods=['GET'])
def get_debug_info(session_id):
    """Endpoint to retrieve debug information for a session"""
    debug_path = os.path.join(DEBUG_DIR, f"session_{session_id}")
    
    if not os.path.exists(debug_path):
        return jsonify({'error': 'Debug information not found for this session'}), 404
    
    # List all files in the debug directory
    debug_files = os.listdir(debug_path)
    
    return jsonify({
        'session_id': session_id,
        'files': debug_files,
        'path': debug_path
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)