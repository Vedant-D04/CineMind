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

# Import analysis modules
# We'll use the logic directly or call the refactored functions
from emotion_analysis import analyze_emotion
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
        
        # 1. Run Emotion Analysis (this now returns faces_data and primary_emotion)
        # It also draws the boxes on its copy of the frame
        analysis_frame = frame.copy()
        try:
            _, faces_data, primary_emotion = analyze_emotion(analysis_frame)
            print(f"Detected {len(faces_data)} faces. Primary Emotion: {primary_emotion['label']}")
        except Exception as e:
            print(f"Emotion Analysis Exception: {e}")
            traceback.print_exc()
            faces_data = []
            primary_emotion = {'label': 'neutral', 'confidence': 0.0}

        results = {
            'timestamp': datetime.now().isoformat(),
            'faces': faces_data,
            'emotion': primary_emotion
        }
        
        # 2. Color analysis (pass the detected emotion to avoid redundancy)
        try:
            _, color_suggestions = analyze_color(frame.copy(), prefetched_emotion=primary_emotion['label'])
            results['color_analysis'] = {
                'suggestions': color_suggestions,
                'metrics': extract_color_metrics(frame)
            }
        except Exception as e:
            print(f"Color Analysis Exception: {e}")
            results['color_analysis'] = {'suggestions': [], 'metrics': {}}
        
        # 3. Framing analysis
        try:
            _, framing_suggestions = analyze_framing(frame.copy())
            results['framing'] = {
                'suggestions': framing_suggestions,
                'checks': {
                    'rule_of_thirds': len(faces_data) > 0,
                    'headroom': len(faces_data) > 0,
                    'looking_room': len(faces_data) > 0
                }
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
    print("=" * 50)
    print("CineMind Backend Server Starting (Port 5001)...")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
