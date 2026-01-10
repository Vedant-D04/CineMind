"""
CineMind Backend Server - Flask API (FINAL FIX)
Properly integrates with corrected emotion labels and face detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import base64
import numpy as np
from datetime import datetime
import torch
import traceback
import os


# Import analysis modules
# We'll use the logic directly or call the refactored functions
# We'll use the logic directly or call the refactored functions
from FaceDetector import FaceDetector
from ai_director_bot import get_ai_response
from color_palette_analysis import analyze_emotion as analyze_color
from framing_analysis import analyze_framing
from scene_analysis import analyze_scene

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Initialize face detector
face_detector = FaceDetector()

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    try:
        data = request.json
        messages = data.get('messages', [])
        response = get_ai_response(messages)
        return jsonify({'response': response})
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_frame():
    try:
        data = request.json
        image_base64 = data.get('image', '')
        
        if not image_base64:
            return jsonify({'error': 'No image data'}), 400
        
        # Decode image
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("Error: Could not decode image")
            return jsonify({'error': 'Invalid image'}), 400
        
        # 1. Face Detection (Replaces Emotion Analysis for faces)
        analysis_frame = frame.copy()
        faces_data = []
        try:
            # FaceDetector returns internal rect format, need to standardize if necessary
            # Assuming detect_faces returns list of (x, y, w, h)
            faces = face_detector.detect_faces(analysis_frame)
            # Format explicitly for consistency: [x, y, w, h] is standard
            faces_data = faces 
            print(f"Detected {len(faces_data)} faces.")
        except Exception as e:
            print(f"Face Detection Exception: {e}")
            traceback.print_exc()
            faces_data = []

        results = {
            'timestamp': datetime.now().isoformat(),
            'faces': faces_data
        }
        
        # 2. Color analysis (pass neutral if emotion not available)
        try:
            _, color_suggestions = analyze_color(frame.copy(), prefetched_emotion='neutral')
            results['color_analysis'] = {
                'suggestions': color_suggestions,
                'metrics': extract_color_metrics(frame)
            }
        except Exception as e:
            print(f"Color Analysis Exception: {e}")
            results['color_analysis'] = {'suggestions': [], 'metrics': {}}
        
        # 3. Framing analysis
        # 3. Framing analysis
        try:
            _, framing_suggestions, framing_checks = analyze_framing(frame.copy())
            results['framing'] = {
                'suggestions': framing_suggestions,
                'checks': framing_checks
            }
        except Exception as e:
            print(f"Framing Analysis Exception: {e}")
            results['framing'] = {'suggestions': [], 'checks': {}}
        
        # 4. Scene analysis
        try:
            scene_text, _ = analyze_scene(frame.copy())
            results['scene'] = {
                'status': scene_text,
                'is_clean': 'clear' in scene_text.lower() or 'no' in scene_text.lower()
            }
        except Exception as e:
            print(f"Scene Analysis Exception: {e}")
            results['scene'] = {'status': 'Unavailable', 'is_clean': False}
        
        return jsonify(results)
    
    except Exception as e:
        print(f"GLOBAL Analysis error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def extract_color_metrics(frame):
    """Extract HSV color metrics"""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    return {
        'hue': float(np.mean(hsv[:, :, 0])),
        'saturation': float(np.mean(hsv[:, :, 1])),
        'brightness': float(np.mean(hsv[:, :, 2]))
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("=" * 50)
    print(f"CineMind Backend Server Starting (Port {port})...")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
