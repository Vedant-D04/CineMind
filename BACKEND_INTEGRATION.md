# Backend Integration Guide

## 🔌 Connecting the UI to Python Backend

This guide will help you connect the CineMind UI to your Python analysis scripts.

---

## 📋 Prerequisites

### Required Python Packages
```bash
pip install flask flask-cors opencv-python numpy torch torchvision
```

### Files You Need
- ✅ `backend_server.py` - Flask API server (provided)
- ✅ `backend_integration.js` - Frontend connector (provided)
- ✅ All your existing Python scripts (emotion_analysis.py, etc.)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend Server
```bash
cd /Users/vedantdesai/CineMind
python backend_server.py
```

You should see:
```
==================================================
CineMind Backend Server Starting...
==================================================
Server: http://localhost:5000
Health Check: http://localhost:5000/health
Analysis Endpoint: POST http://localhost:5000/analyze
==================================================
```

### Step 2: Update Frontend Configuration

In `index.html`, add this line before `</body>`:
```html
<script src="backend_integration.js"></script>
```

In `backend_integration.js`, change:
```javascript
const USE_BACKEND = false; // Change to true
```
to:
```javascript
const USE_BACKEND = true; // Backend enabled!
```

### Step 3: Open the UI
```bash
open index.html
```

Start the camera and the UI will now use **real analysis** from your Python scripts!

---

## 🔧 Detailed Setup

### Backend Server Configuration

The `backend_server.py` file provides these endpoints:

#### 1. Health Check
```
GET http://localhost:5000/health
```
Returns server status and version.

#### 2. Frame Analysis
```
POST http://localhost:5000/analyze
Body: { "image": "base64_encoded_jpeg" }
```
Returns all analysis results.

#### 3. Camera List
```
GET http://localhost:5000/camera/list
```
Returns available camera devices.

### Response Format

The backend returns JSON in this format:
```json
{
  "timestamp": "2026-01-10T16:30:00",
  "faces": [
    { "x": 100, "y": 50, "width": 200, "height": 250 }
  ],
  "emotion": {
    "label": "happy",
    "confidence": 0.92
  },
  "color_analysis": {
    "suggestions": [
      "The scene has a warm color palette..."
    ],
    "metrics": {
      "hue": 120,
      "saturation": 70,
      "brightness": 65
    }
  },
  "framing": {
    "suggestions": [
      "Provide more looking room..."
    ],
    "checks": {
      "rule_of_thirds": true,
      "headroom": true,
      "looking_room": false
    }
  },
  "scene": {
    "status": "Scene is clear",
    "objects": [],
    "is_clean": true
  }
}
```

---

## 🔄 How It Works

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │         │    Flask     │         │  Python Scripts │
│   (UI)      │────────▶│   Server     │────────▶│   (Analysis)    │
│             │  HTTP   │              │  Import │                 │
│             │◀────────│              │◀────────│                 │
└─────────────┘  JSON   └──────────────┘  Return └─────────────────┘
```

### Step-by-Step Process

1. **Camera Capture**: Browser captures video frame
2. **Encode**: Convert frame to base64 JPEG
3. **Send**: POST to `/analyze` endpoint
4. **Decode**: Flask decodes base64 to OpenCV format
5. **Analyze**: Run all Python analysis scripts
6. **Format**: Convert results to JSON
7. **Return**: Send JSON back to browser
8. **Update**: UI updates with real results

---

## 🛠️ Customizing the Backend

### Adding New Analysis

1. **Import your module** in `backend_server.py`:
```python
from my_new_analysis import analyze_something
```

2. **Add to analyze_frame()** function:
```python
try:
    new_result = analyze_something(frame.copy())
    results['new_analysis'] = {
        'data': new_result
    }
except Exception as e:
    print(f"New analysis error: {e}")
```

3. **Update frontend** in `backend_integration.js`:
```javascript
if (results.new_analysis) {
    // Update UI with new analysis data
    updateNewAnalysisPanel(results.new_analysis);
}
```

### Modifying Return Format

Edit the `results` dictionary in `backend_server.py`:
```python
results = {
    'timestamp': datetime.now().isoformat(),
    'your_custom_field': 'your_data',
    # ... existing fields
}
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'flask'`
```bash
pip install flask flask-cors
```

**Error**: `Address already in use`
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or change port in backend_server.py
app.run(port=5001)  # Use different port
```

### CORS Errors

**Error**: `Access-Control-Allow-Origin`

Make sure `flask-cors` is installed:
```bash
pip install flask-cors
```

And enabled in `backend_server.py`:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # This line is crucial
```

### Analysis Not Working

**Check backend logs** for errors:
```python
# In backend_server.py, errors are printed to console
print(f"Analysis error: {e}")
```

**Test endpoint manually**:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status": "healthy", "timestamp": "...", "version": "1.0.0"}
```

### Frontend Not Connecting

**Check browser console** (F12 → Console):
- Look for network errors
- Verify `USE_BACKEND = true`
- Check BACKEND_URL is correct

**Test with curl**:
```bash
# Create test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" > test.txt

# Send to backend
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"image": "'$(cat test.txt)'"}'
```

---

## ⚡ Performance Optimization

### 1. Reduce Frame Rate
```javascript
// In script.js, analyze every Nth frame
let frameCounter = 0;
function analyzeFrame() {
    frameCounter++;
    if (frameCounter % 5 === 0) {  // Analyze every 5th frame
        analyzeFrameWithBackend();
    }
    requestAnimationFrame(analyzeFrame);
}
```

### 2. Lower Image Quality
```javascript
// In backend_integration.js
const imageData = canvas.toDataURL('image/jpeg', 0.5);  // 50% quality
```

### 3. Resize Before Sending
```javascript
// Resize canvas before encoding
const maxWidth = 640;
const scale = maxWidth / cameraFeed.videoWidth;
canvas.width = maxWidth;
canvas.height = cameraFeed.videoHeight * scale;
```

### 4. Use WebSocket Instead of HTTP
For real-time performance, consider WebSocket:

**Backend** (websocket_server.py):
```python
import asyncio
import websockets
import json

async def analyze_handler(websocket, path):
    async for message in websocket:
        data = json.loads(message)
        results = process_frame(data['frame'])
        await websocket.send(json.dumps(results))

start_server = websockets.serve(analyze_handler, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
```

**Frontend**:
```javascript
const ws = new WebSocket('ws://localhost:8765');
ws.onmessage = (event) => {
    const results = JSON.parse(event.data);
    updateUIWithBackendResults(results);
};
```

---

## 🚢 Deployment

### Local Network Access

To access from other devices on your network:

1. **Find your IP**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **Update backend**:
```python
app.run(host='0.0.0.0', port=5000)  # Listen on all interfaces
```

3. **Update frontend**:
```javascript
const BACKEND_URL = 'http://YOUR_IP:5000';
```

### Production Deployment

For production, use:
- **Gunicorn** for Flask server
- **Nginx** as reverse proxy
- **HTTPS** for security
- **Docker** for containerization

Example Dockerfile:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "backend_server:app"]
```

---

## 📊 Testing

### Manual Testing

1. **Start backend**:
```bash
python backend_server.py
```

2. **Test health**:
```bash
curl http://localhost:5000/health
```

3. **Test analysis** (with real image):
```bash
# Capture frame from camera
# Convert to base64
# Send to /analyze endpoint
```

### Automated Testing

Create `test_backend.py`:
```python
import unittest
import json
from backend_server import app

class TestBackend(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
    
    def test_health(self):
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_analyze(self):
        # Test with dummy image
        response = self.app.post('/analyze', 
            json={'image': 'base64_encoded_image'})
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
```

Run tests:
```bash
python test_backend.py
```

---

## 🎯 Next Steps

1. ✅ **Start backend server** - `python backend_server.py`
2. ✅ **Enable backend in UI** - Set `USE_BACKEND = true`
3. ✅ **Test connection** - Check browser console for "Backend connected"
4. ✅ **Start camera** - Verify real analysis is working
5. ✅ **Monitor logs** - Watch backend console for errors
6. ✅ **Optimize** - Adjust frame rate and quality as needed

---

## 📚 Additional Resources

- **Flask Documentation**: https://flask.palletsprojects.com/
- **Flask-CORS**: https://flask-cors.readthedocs.io/
- **WebSocket Guide**: https://websockets.readthedocs.io/
- **OpenCV Python**: https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html

---

## 🆘 Support

If you encounter issues:

1. **Check backend logs** - Errors are printed to console
2. **Check browser console** - Network errors appear here
3. **Verify imports** - All Python modules must be importable
4. **Test endpoints** - Use curl to test API directly
5. **Review this guide** - Most issues are covered above

---

**You're ready to integrate! 🚀**

Start the backend, enable it in the UI, and enjoy real-time AI-powered film analysis!
