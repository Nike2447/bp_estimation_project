import os
import numpy as np
import sqlite3
import tensorflow as tf
import cv2
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tempfile
import time
import csv
from scipy.signal import butter, filtfilt
from datetime import datetime, timedelta

app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
CORS(app)

@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")

MODEL_PATH = './bp_resnet_model'
model = tf.keras.models.load_model(MODEL_PATH)

# Heart rate monitoring parameters
LEVELS = 3
ALPHA = 170
MIN_FREQUENCY = 1.0
MAX_FREQUENCY = 2.0
BUFFER_SIZE = 150
VIDEO_FRAME_RATE = 15
BPM_CALCULATION_FREQUENCY = 5
BPM_BUFFER_SIZE = 10


def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def bandpass_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = filtfilt(b, a, data)
    return y

def buildGauss(frame, levels):
    pyramid = [frame]
    for level in range(levels):
        frame = cv2.pyrDown(frame)
        pyramid.append(frame)
    return pyramid

def reconstructFrame(pyramid, index, levels, videoHeight, videoWidth):
    filteredFrame = pyramid[index]
    for level in range(levels):
        filteredFrame = cv2.pyrUp(filteredFrame)
    filteredFrame = filteredFrame[:videoHeight, :videoWidth]
    return filteredFrame

def normalizeSkinColor(frame):
    normalizedFrame = cv2.normalize(frame, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    return normalizedFrame

def applyAdaptiveHistogramEqualization(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    equalizedFrame = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return equalizedFrame

def assess_signal_quality(variance, min_threshold=0.0001):
    if variance < min_threshold:
        return "poor"
    elif variance < min_threshold * 10:
        return "fair"
    else:
        return "good"

def extract_vitals_from_video(video_path, session_id=None):
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened(): 
        raise ValueError("Could not open video file")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Load face detection model
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Load pre-trained age and gender models
    try:
        ageProto = "deploy_age.prototxt"
        ageModel = "age_net.caffemodel"
        genderProto = "deploy_gender.prototxt"
        genderModel = "gender_net.caffemodel"
        ageNet = cv2.dnn.readNet(ageModel, ageProto)
        genderNet = cv2.dnn.readNet(genderModel, genderProto)
        ageList = ['(0-3)', '(4-9)', '(10-15)', '(16-19)', '(20-29)', '(30-39)', '(40-49)', '(50-59)', '(60-69)', '(70-79)', '(80-100)']
        genderList = ['Male', 'Female']
    except Exception as e:
        print(f"Error loading age/gender models: {e}")
        ageNet = None
        genderNet = None
    
    # BP prediction variables
    ppg_signals = {
        'forehead': [],
        'left_cheek': [],
        'right_cheek': []
    }
    
    # Heart rate monitoring variables
    videoWidth = 160
    videoHeight = 120
    videoChannels = 3
    
    bufferIndex = 0
    bpmBufferIndex = 0
    
    firstFrame = np.zeros((videoHeight, videoWidth, videoChannels))
    firstGauss = buildGauss(firstFrame, LEVELS + 1)[LEVELS]
    videoGauss = np.zeros((BUFFER_SIZE, firstGauss.shape[0], firstGauss.shape[1], videoChannels))
    fourierTransformAvg = np.zeros((BUFFER_SIZE))
    
    frequencies = (1.0 * VIDEO_FRAME_RATE) * np.arange(BUFFER_SIZE) / (1.0 * BUFFER_SIZE)
    mask = (frequencies >= MIN_FREQUENCY) & (frequencies <= MAX_FREQUENCY)
    
    bpmBuffer = np.zeros((BPM_BUFFER_SIZE))
    
    i = 0
    
    # Face detection metrics
    face_detected_count = 0
    frame_count_read = 0
    
    # Age and gender storage
    detected_ages = []
    detected_genders = []
    
    # Process video frames
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count_read += 1
        
        # Create a copy for processing
        processed_frame = frame.copy()
        
        # Process frame for better face detection
        processed_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
        processed_frame = applyAdaptiveHistogramEqualization(processed_frame)
        processed_frame = normalizeSkinColor(processed_frame)
        
        gray = cv2.cvtColor(processed_frame, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        
        if len(faces) > 0:
            face_detected_count += 1
            x, y, w, h = faces[0]
            
            # Extract ROIs for BP prediction
            forehead_roi_bp = processed_frame[y:y+int(h*0.25), x+int(w*0.3):x+int(w*0.7)]
            left_cheek_roi_bp = processed_frame[y+int(h*0.4):y+int(h*0.7), x+int(w*0.1):x+int(w*0.3)]
            right_cheek_roi_bp = processed_frame[y+int(h*0.4):y+int(h*0.7), x+int(w*0.7):x+int(w*0.9)]
            
            # Add signal for BP prediction
            if forehead_roi_bp.size > 0:
                ppg_signals['forehead'].append(np.mean(forehead_roi_bp[:, :, 1]))
            
            if left_cheek_roi_bp.size > 0:
                ppg_signals['left_cheek'].append(np.mean(left_cheek_roi_bp[:, :, 1]))
                
            if right_cheek_roi_bp.size > 0:
                ppg_signals['right_cheek'].append(np.mean(right_cheek_roi_bp[:, :, 1]))
            
            # Extract ROI for heart rate
            detectionFrame = processed_frame[y:y + h, x:x + w]
            
            # Age and gender prediction
            if ageNet is not None and genderNet is not None:
                # Prepare face for age/gender prediction
                faceForPrediction = detectionFrame.copy()
                faceForPrediction = cv2.resize(faceForPrediction, (227, 227))
                
                # Predict gender
                blob = cv2.dnn.blobFromImage(faceForPrediction, 1.0, (227, 227), (104.0, 177.0, 123.0), swapRB=False)
                genderNet.setInput(blob)
                genderPreds = genderNet.forward()
                gender = genderList[genderPreds[0].argmax()]
                detected_genders.append(gender)
                
                # Predict age
                ageNet.setInput(blob)
                agePreds = ageNet.forward()
                age = ageList[agePreds[0].argmax()]
                detected_ages.append(age)
            
            # Extract forehead for heart rate calculation
            forehead = detectionFrame[0:int(0.3 * h), 0:w]
            detectionFrame = cv2.resize(forehead, (videoWidth, videoHeight))
            
            # Heart rate calculation
            videoGauss[bufferIndex] = buildGauss(detectionFrame, LEVELS + 1)[LEVELS]
            fourierTransform = np.fft.fft(videoGauss, axis=0)
            
            # Filter frequencies
            fourierTransform[mask == False] = 0
            
            # Calculate heart rate
            if bufferIndex % BPM_CALCULATION_FREQUENCY == 0:
                i += 1
                for buf in range(BUFFER_SIZE):
                    fourierTransformAvg[buf] = np.real(fourierTransform[buf]).mean()
                hz = frequencies[np.argmax(fourierTransformAvg)]
                bpm = 60.0 * hz
                bpmBuffer[bpmBufferIndex] = bpm
                bpmBufferIndex = (bpmBufferIndex + 1) % BPM_BUFFER_SIZE
            
            # Process the filtered data
            filtered = np.real(np.fft.ifft(fourierTransform, axis=0))
            filtered = filtered * ALPHA
            
            bufferIndex = (bufferIndex + 1) % BUFFER_SIZE
        
    cap.release()
    
    # Process BP data
    valid_signals = {}
    signal_stats = {}
    
    for roi, signal in ppg_signals.items():
        if len(signal) > 20: 
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
    
    signal_variances = {roi: np.var(signal) for roi, signal in valid_signals.items()}
    best_roi = max(signal_variances, key=signal_variances.get)
    
    estimated_fps = fps if 10 <= fps <= 60 else 30
    
    raw_signal = valid_signals[best_roi]
    
    filtered_signal = bandpass_filter(raw_signal, 0.7, 4.0, estimated_fps)
    
    detrended_signal = filtered_signal - np.polyval(np.polyfit(np.arange(len(filtered_signal)), filtered_signal, 3), np.arange(len(filtered_signal)))
    
    ppg_resampled = np.interp(
        np.linspace(0, len(detrended_signal) - 1, 875),
        np.arange(len(detrended_signal)),
        detrended_signal
    )
    
    ppg_normalized = (ppg_resampled - np.min(ppg_resampled)) / (np.max(ppg_resampled) - np.min(ppg_resampled))
    
    # Calculate heart rate results
    heart_rate = 0
    if i > BPM_BUFFER_SIZE:
        heart_rate = bpmBuffer.mean()
    
    # Determine most frequent age and gender
    most_common_age = max(set(detected_ages), key=detected_ages.count) if detected_ages else "Unknown"
    most_common_gender = max(set(detected_genders), key=detected_genders.count) if detected_genders else "Unknown"
    
    # Get heart rate status
    hr_status = get_heart_rate_status(heart_rate, most_common_age, most_common_gender)
    
    return {
        'ppg_normalized': ppg_normalized,
        'best_roi': best_roi,
        'signal_variance': signal_variances[best_roi],
        'heart_rate': heart_rate,
        'age': most_common_age,
        'gender': most_common_gender,
        'hr_status': hr_status
    }

def get_heart_rate_status(bpm, age, gender):
    if bpm == 0:
        return "Unknown"
        
    # Extract numeric age from age range string
    age_num = 0
    try:
        if '(' in age and ')' in age:
            age_range = age.strip('()').split('-')
            if len(age_range) == 2:
                age_num = int(age_range[0])
    except:
        age_num = 30  # Default to adult if parsing fails
    
    if gender.lower() == "male":
        if age_num < 18:
            if bpm < 50:
                return "Very Low"
            elif 50 <= bpm < 70:
                return "Low"
            elif 70 <= bpm <= 100:
                return "Normal"
            elif 100 < bpm <= 130:
                return "High"
            else:
                return "Very High"
        elif 18 <= age_num <= 40:
            if bpm < 55:
                return "Very Low"
            elif 55 <= bpm < 70:
                return "Low"
            elif 70 <= bpm <= 100:
                return "Normal"
            elif 100 < bpm <= 120:
                return "High"
            else:
                return "Very High"
        else:  # age > 40
            if bpm < 50:
                return "Very Low"
            elif 50 <= bpm < 65:
                return "Low"
            elif 65 <= bpm <= 100:
                return "Normal"
            elif 100 < bpm <= 120:
                return "High"
            else:
                return "Very High"
    
    elif gender.lower() == "female":
        if age_num < 18:
            if bpm < 55:
                return "Very Low"
            elif 55 <= bpm < 75:
                return "Low"
            elif 75 <= bpm <= 105:
                return "Normal"
            elif 105 < bpm <= 135:
                return "High"
            else:
                return "Very High"
        elif 18 <= age_num <= 40:
            if bpm < 60:
                return "Very Low"
            elif 60 <= bpm < 75:
                return "Low"
            elif 75 <= bpm <= 105:
                return "Normal"
            elif 105 < bpm <= 125:
                return "High"
            else:
                return "Very High"
        else:  # age > 40
            if bpm < 55:
                return "Very Low"
            elif 55 <= bpm < 70:
                return "Low"
            elif 70 <= bpm <= 105:
                return "Normal"
            elif 105 < bpm <= 125:
                return "High"
            else:
                return "Very High"
    
    # Default case if gender is unknown
    if bpm < 60:
        return "Low"
    elif 60 <= bpm <= 100:
        return "Normal"
    else:
        return "High"

def preprocess_ppg(ppg_signal):
    ppg_processed = ppg_signal.reshape(1, 875, 1)
    return ppg_processed

@app.route('/predict', methods=['POST'])
def predict_vitals():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    
    session_id = f"{np.random.randint(10000, 99999)}"
    
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
        video_path = temp_video.name
        video_file.save(video_path)
    
    try:
        # Extract all vital signs from a single video
        vitals_data = extract_vitals_from_video(video_path, session_id)
        
        # BP prediction
        ppg_processed = preprocess_ppg(vitals_data['ppg_normalized'])
        prediction = model.predict(ppg_processed)
        
        sbp = float(prediction[0][0][0])
        dbp = float(prediction[1][0][0])
        
        # Adjust predictions if needed
        if abs(sbp - dbp) < 5:
            mean_bp = (sbp + dbp) / 2
            sbp = mean_bp * 1.2  
            dbp = mean_bp * 0.8 
        
        if sbp <= dbp:
            dbp = min(dbp, 0.9 * sbp)
            
        # Clean up the temp file
        os.unlink(video_path)
        
        # Assess signal quality
        signal_quality = assess_signal_quality(vitals_data['signal_variance'])
        
        # Save to CSV (optional)
        try:
            with open('vital_signs_data.csv', 'a', newline='') as csv_file:
                csv_writer = csv.writer(csv_file)
                
                # Write header if file is empty
                if os.path.getsize('vital_signs_data.csv') == 0:
                    csv_writer.writerow(['Timestamp', 'Session ID', 'Heart Rate (BPM)', 'HR Status', 'Systolic BP', 'Diastolic BP', 'Signal Quality', 'Age', 'Gender'])
                
                # Write data
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                csv_writer.writerow([
                    timestamp, 
                    session_id, 
                    round(vitals_data['heart_rate'], 1),
                    vitals_data['hr_status'],
                    round(sbp, 1),
                    round(dbp, 1),
                    signal_quality,
                    vitals_data['age'],
                    vitals_data['gender']
                ])
        except Exception as csv_error:
            print(f"Warning: Could not save to CSV: {csv_error}")

        # Return all vital signs in the response
        return jsonify({
            'systolic': round(sbp, 1),
            'diastolic': round(dbp, 1),
            'heart_rate': round(vitals_data['heart_rate'], 1),
            'hr_status': vitals_data['hr_status'],
            'age': vitals_data['age'],
            'gender': vitals_data['gender'],
            'signal_quality': signal_quality,
            'session_id': session_id
        })
    
    except Exception as e:
        if os.path.exists(video_path):
            os.unlink(video_path)
        
        return jsonify({
            'error': str(e),
            'session_id': session_id
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

DB_PATH = "vital_signs.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vital_signs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            session_id TEXT,
            heart_rate REAL,
            hr_status TEXT,
            systolic REAL,
            diastolic REAL,
            signal_quality TEXT,
            age TEXT,
            gender TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route("/save-reading", methods=["POST"])
def save_reading():
    try:
        data = request.json
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        session_id = data.get("session_id", "unknown")
        heart_rate = data.get("heart_rate")
        hr_status = data.get("hr_status")
        systolic = data.get("systolic")
        diastolic = data.get("diastolic")
        signal_quality = data.get("signal_quality")
        age = data.get("age", "unknown")
        gender = data.get("gender", "unknown")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vital_signs (timestamp, session_id, heart_rate, hr_status, systolic, diastolic, signal_quality, age, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (timestamp, session_id, heart_rate, hr_status, systolic, diastolic, signal_quality, age, gender))
        conn.commit()
        conn.close()

        return jsonify({"message": "Reading saved successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get-readings", methods=["GET"])
def get_readings():
    try:
        time_range = request.args.get("range", "7days")
        now = datetime.now()

        if time_range == "1day":
            start_time = now - timedelta(days=1)
        elif time_range == "7days":
            start_time = now - timedelta(days=7)
        elif time_range == "1month":
            start_time = now - timedelta(days=30)
        elif time_range == "3months":
            start_time = now - timedelta(days=90)
        else:
            return jsonify({"error": "Invalid time range"}), 400

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT timestamp, heart_rate, hr_status, systolic, diastolic, signal_quality, age, gender
            FROM vital_signs
            WHERE timestamp >= ?
            ORDER BY timestamp ASC
        ''', (start_time.strftime('%Y-%m-%d %H:%M:%S'),))
        rows = cursor.fetchall()
        conn.close()

        data = [
            {
                "timestamp": row[0],
                "heart_rate": row[1],
                "hr_status": row[2],
                "systolic": row[3],
                "diastolic": row[4],
                "signal_quality": row[5],
                "age": row[6],
                "gender": row[7],
            }
            for row in rows
        ]

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)