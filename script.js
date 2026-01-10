const ANALYSIS_INTERVAL = 1000; // 1 second
let detectedFaces = []; // Store faces for continuous drawing
const API_BASE_URL = 'http://127.0.0.1:5001';

// ===========================
// Page Navigation
// ===========================
const landingPage = document.getElementById('landing-page');
const workflowPage = document.getElementById('workflow-page');
const getStartedBtn = document.getElementById('get-started-btn');
const getStartedBtn2 = document.getElementById('get-started-btn-2');
const backToHomeBtn = document.getElementById('back-to-home');

// Navigate to workflow page
function navigateToWorkflow() {
    landingPage.classList.remove('active');
    workflowPage.classList.add('active');

    // Check if first time user
    const hasSeenTutorial = localStorage.getItem('cinemind-tutorial-seen');
    if (!hasSeenTutorial) {
        setTimeout(() => startTutorial(), 500);
    }
}

// Navigate to landing page
function navigateToLanding() {
    workflowPage.classList.remove('active');
    landingPage.classList.add('active');
}

getStartedBtn.addEventListener('click', navigateToWorkflow);
getStartedBtn2.addEventListener('click', navigateToWorkflow);
backToHomeBtn.addEventListener('click', navigateToLanding);

// Watch Demo button - scroll to features
const watchDemoBtn = document.getElementById('watch-demo-btn');
if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', () => {
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// ===========================
// Sidebar Navigation
// ===========================
const navItems = document.querySelectorAll('.nav-item[data-panel]');
const contentPanels = document.querySelectorAll('.content-panel');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const panelId = item.dataset.panel;
        const panelName = item.querySelector('span').textContent;

        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update active panel
        contentPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${panelId}-panel`).classList.add('active');

        // Update workspace header
        document.getElementById('workspace-title').textContent = `Analysis Mode: ${panelName}`;

        // Toggle Workspace Visibility for Chat and Settings
        const sharedWorkspace = document.querySelector('.shared-workspace');
        if (panelId === 'chat' || panelId === 'settings') {
            sharedWorkspace.style.display = 'none';
        } else {
            sharedWorkspace.style.display = 'flex'; // Restore flex layout
        }

        // Update subtitle based on tool
        const subtitles = {
            'camera': 'Live video feed from your camera',
            'chat': 'Cinematography & Scene Design Assistant',
            'emotion': 'Real-time facial emotion detection',
            'color': 'Mood-based color suggestions',
            'framing': 'Composition and framing guidelines',
            'scene': 'Object and cleanup detection',
            'settings': 'Device and analysis preferences'
        };
        document.getElementById('workspace-subtitle').textContent = subtitles[panelId] || '';
    });
});

// ===========================
// Camera Feed Management
// ===========================
const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const videoPlaceholder = document.getElementById('video-placeholder');
const cameraFeed = document.getElementById('camera-feed');
const analysisCanvas = document.getElementById('analysis-canvas');
const ctx = analysisCanvas.getContext('2d');

// Chat Elements
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessages = document.getElementById('chat-messages');

let stream = null;
let animationId = null;
let isAnalyzing = false;

// Start camera
async function startCamera() {
    try {
        const cameraSource = document.getElementById('camera-select').value;
        const constraints = {
            video: {
                deviceId: cameraSource === '0' ? undefined : { exact: cameraSource },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraFeed.srcObject = stream;

        // Wait for video to load
        cameraFeed.onloadedmetadata = () => {
            // Set canvas size to match video
            analysisCanvas.width = cameraFeed.videoWidth;
            analysisCanvas.height = cameraFeed.videoHeight;

            videoPlaceholder.style.display = 'none';
            cameraFeed.style.display = 'block';
            analysisCanvas.style.display = 'block';

            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'flex';

            isAnalyzing = true;
            updateAnalysisStatus('Running');

            // Start analysis loop
            analyzeFrame();
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Failed to access camera. Please check permissions.');
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    cameraFeed.srcObject = null;
    cameraFeed.style.display = 'none';
    analysisCanvas.style.display = 'none';
    videoPlaceholder.style.display = 'flex';

    stopCameraBtn.style.display = 'none';
    startCameraBtn.style.display = 'flex';

    isAnalyzing = false;
    updateAnalysisStatus('Idle');
}

startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);

// ===========================
// Analysis Loop (Backend-Connected)
// ===========================
let frameCount = 0;
let lastFrameTime = Date.now();
let fps = 0;

async function analyzeFrame() {
    if (!isAnalyzing) return;

    // Calculate FPS
    frameCount++;
    const currentTime = Date.now();
    if (currentTime - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = currentTime;
        updateFrameRate(fps);
    }

    // Clear canvas
    ctx.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);

    // Redraw previously detected faces if any
    detectedFaces.forEach(face => {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeRect(face.x, face.y, face.width, face.height);
        ctx.fillStyle = '#4CAF50';
        ctx.font = '16px Inter';
        ctx.fillText('Face Detected', face.x, face.y - 10);
    });

    // Draw rule of thirds grid if enabled
    if (document.getElementById('show-grid-toggle').checked) {
        drawRuleOfThirdsGrid();
    }

    // Send frame to backend for analysis
    try {
        // Capture current frame from video
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const tempCtx = canvas.getContext('2d');
        tempCtx.drawImage(cameraFeed, 0, 0);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

        // Send to backend
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        if (response.ok) {
            const results = await response.json();
            updateUIWithBackendResults(results);
        } else {
            console.warn('Backend analysis failed, using demo mode');
            simulateFaceDetection();
        }
    } catch (error) {
        console.warn('Backend error, using demo mode:', error);
        // Fallback to simulated detection
        if (Math.random() > 0.3) {
            simulateFaceDetection();
        }
    }

    // Continue loop
    animationId = requestAnimationFrame(analyzeFrame);
}

// Update UI with backend results
function updateUIWithBackendResults(results) {
    // Update face detection
    if (results.faces) {
        detectedFaces = results.faces;
        updateFaceCount(results.faces.length);
    } else {
        detectedFaces = [];
        updateFaceCount(0);
    }

    // Update emotion analysis
    if (results.emotion) {
        const emotionIcons = {
            'happy': '😊',
            'sad': '😢',
            'angry': '😠',
            'surprise': '😮',
            'fear': '😨',
            'disgust': '🤢',
            'neutral': '😐'
        };

        const emoji = emotionIcons[results.emotion.label.toLowerCase()] || '😐';
        const label = results.emotion.label.charAt(0).toUpperCase() + results.emotion.label.slice(1);

        // Update emotion panel
        document.getElementById('emotion-icon').textContent = emoji;
        document.getElementById('emotion-label').textContent = label;

        const confidence = Math.round(results.emotion.confidence * 100);
        document.getElementById('emotion-confidence').style.width = `${confidence}%`;
        document.getElementById('emotion-confidence-text').textContent = `${confidence}%`;
    }

    // Update color analysis
    if (results.color_analysis) {
        const metrics = results.color_analysis.metrics;

        if (metrics) {
            document.getElementById('hue-value').textContent = `${Math.round(metrics.hue)}°`;
            document.getElementById('saturation-value').textContent = `${Math.round(metrics.saturation)}%`;
            document.getElementById('brightness-value').textContent = `${Math.round(metrics.brightness)}%`;

            document.getElementById('saturation-fill').style.width = `${Math.round(metrics.saturation)}%`;
            document.getElementById('brightness-fill').style.width = `${Math.round(metrics.brightness)}%`;
        }

        // Update suggestions
        if (results.color_analysis.suggestions) {
            const suggestionsContainer = document.getElementById('color-suggestions');
            suggestionsContainer.innerHTML = results.color_analysis.suggestions.map(suggestion => `
                <div class="suggestion-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2L12 8L18 8L13 12L15 18L10 14L5 18L7 12L2 8L8 8L10 2Z" fill="#FFD700"/>
                    </svg>
                    <span>${suggestion}</span>
                </div>
            `).join('');
        }
    }

    // Update framing analysis
    if (results.framing) {
        const checks = results.framing.checks;

        if (checks) {
            updateFramingCheck('rule-of-thirds-check', checks.rule_of_thirds);
            updateFramingCheck('headroom-check', checks.headroom);
            updateFramingCheck('looking-room-check', checks.looking_room);
        }

        // Update suggestions
        if (results.framing.suggestions) {
            const suggestionsContainer = document.getElementById('framing-suggestions');
            suggestionsContainer.innerHTML = results.framing.suggestions.map(suggestion => `
                <div class="suggestion-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="#667eea" stroke-width="2"/>
                        <path d="M10 6V10L13 13" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>${suggestion}</span>
                </div>
            `).join('');
        }
    }

    // Update scene analysis
    if (results.scene) {
        const isClean = results.scene.is_clean;
        const statusIndicator = document.getElementById('scene-status-indicator');
        const statusText = document.getElementById('scene-status-text');
        const statusDescription = document.getElementById('scene-status-description');

        if (isClean) {
            statusIndicator.className = 'status-indicator status-clean';
            statusText.textContent = 'Scene is Clear';
            statusDescription.textContent = 'No unwanted clutter detected';
        } else {
            statusIndicator.className = 'status-indicator status-clutter';
            statusText.textContent = 'Clutter Detected';
            statusDescription.textContent = results.scene.status;
        }

        // Update objects list
        if (results.scene.objects && results.scene.objects.length > 0) {
            const objectsList = document.getElementById('objects-list');
            objectsList.innerHTML = results.scene.objects.map(obj => `
                <div class="object-tag">
                    <span class="object-icon">${getObjectIcon(obj.name)}</span>
                    <span>${obj.name}</span>
                    <span class="object-confidence">${Math.round(obj.confidence * 100)}%</span>
                </div>
            `).join('');
        }
    }
}

function updateFramingCheck(checkId, isGood) {
    const checkElement = document.getElementById(checkId);
    if (!checkElement) return;

    const icon = checkElement.querySelector('.check-icon');
    const status = checkElement.querySelector('.check-status');

    if (isGood) {
        icon.textContent = '✓';
        status.textContent = 'Good';
        status.className = 'check-status status-good';
    } else {
        icon.textContent = '⚠';
        status.textContent = 'Needs Adjustment';
        status.className = 'check-status status-warning';
    }
}

function getObjectIcon(objectName) {
    const icons = {
        'person': '👤',
        'chair': '🪑',
        'bottle': '🍾',
        'cup': '☕',
        'phone': '📱',
        'laptop': '💻',
        'book': '📚',
        'bag': '🎒'
    };
    return icons[objectName.toLowerCase()] || '📦';
}

function drawRuleOfThirdsGrid() {
    const width = analysisCanvas.width;
    const height = analysisCanvas.height;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((2 * width) / 3, 0);
    ctx.lineTo((2 * width) / 3, height);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, (2 * height) / 3);
    ctx.lineTo(width, (2 * height) / 3);
    ctx.stroke();

    ctx.setLineDash([]);
}

function simulateFaceDetection() {
    const width = analysisCanvas.width;
    const height = analysisCanvas.height;

    // Random face position (centered for better demo)
    const faceWidth = width * 0.2;
    const faceHeight = height * 0.3;
    const faceX = (width - faceWidth) / 2 + (Math.random() - 0.5) * 100;
    const faceY = (height - faceHeight) / 2 + (Math.random() - 0.5) * 50;

    // Store simulated face for continuous drawing
    detectedFaces = [{ x: faceX, y: faceY, width: faceWidth, height: faceHeight }];

    // Update face count
    updateFaceCount(1);

    // Simulate emotion detection
    const emotions = ['😊 Happy', '😢 Sad', '😮 Surprise', '😐 Neutral', '😠 Angry'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const [emoji, label] = randomEmotion.split(' ');
    document.getElementById('emotion-icon').textContent = emoji;
    document.getElementById('emotion-label').textContent = label;

    // Random confidence
    const confidence = Math.floor(Math.random() * 20) + 75;
    document.getElementById('emotion-confidence').style.width = `${confidence}%`;
    document.getElementById('emotion-confidence-text').textContent = `${confidence}%`;
}

// ===========================
// Stats Updates
// ===========================
function updateFaceCount(count) {
    document.getElementById('faces-count').textContent = count;
}

function updateFrameRate(rate) {
    const el = document.getElementById('frame-rate');
    if (el) el.textContent = `${rate} FPS`;
}

// ===========================
// Chat System
// ===========================

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage('user', message);
    chatInput.value = '';

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: "user", content: message }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            appendMessage('bot', data.response);
        } else {
            appendMessage('bot', "I'm detecting some interference. Please try again.");
        }
    } catch (err) {
        console.error("Chat error:", err);
        appendMessage('bot', "I'm having trouble connecting to the director. Please try again.");
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    // Format newlines for basic markdown-like appearance
    const formattedText = text.replace(/\n/g, '<br>');
    msgDiv.innerHTML = `<div class="message-content"><p>${formattedText}</p></div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle suggestion chips
document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendChatMessage();
    });
});

if (sendChatBtn) {
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function getHueDescription(hue) {
    if (hue >= 0 && hue < 30) return "Warm Red/Orange";
    if (hue >= 30 && hue < 60) return "Warm Yellow";
    if (hue >= 60 && hue < 150) return "Fresh Green";
    if (hue >= 150 && hue < 210) return "Cool Cyan/Teal";
    if (hue >= 210 && hue < 270) return "Deep Blue";
    if (hue >= 270 && hue < 330) return "Vibrant Purple";
    return "Warm Red";
}

function getSaturationDescription(s) {
    if (s < 20) return "Muted / Grayscale";
    if (s < 50) return "Natural / Desaturated";
    if (s < 80) return "Vibrant / Rich";
    return "High Saturation";
}

function getBrightnessDescription(b) {
    if (b < 30) return "Low Key / Dark";
    if (b < 70) return "Balanced Exposure";
    return "High Key / Bright";
}

function updateAnalysisStatus(status) {
    document.getElementById('analysis-status').textContent = status;
}

// ===========================
// Settings
// ===========================
const analysisIntervalSlider = document.getElementById('analysis-interval');
const intervalValue = document.getElementById('interval-value');

analysisIntervalSlider.addEventListener('input', (e) => {
    intervalValue.textContent = `${e.target.value}s`;
});

// Grid toggle
document.getElementById('show-grid-toggle').addEventListener('change', (e) => {
    if (!e.target.checked && ctx) {
        ctx.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);
    }
});

// ===========================
// Tutorial System
// ===========================
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialBtn = document.getElementById('tutorial-btn');
const tutorialSkipBtn = document.getElementById('tutorial-skip');
const tutorialNextBtn = document.getElementById('tutorial-next');
const tutorialSpotlight = document.querySelector('.tutorial-spotlight');
const tutorialTooltip = document.querySelector('.tutorial-tooltip');
const tutorialTitle = document.getElementById('tutorial-title');
const tutorialDescription = document.getElementById('tutorial-description');
const tutorialStepEl = document.getElementById('tutorial-step');
const tutorialTotalEl = document.getElementById('tutorial-total');

let currentTutorialStep = 0;

const tutorialSteps = [
    {
        title: 'Welcome to CineMind!',
        description: 'Let\'s take a quick tour of the main features. This tutorial will guide you through the core functionalities.',
        target: '.sidebar',
        position: 'right'
    },
    {
        title: 'Camera Feed',
        description: 'Start your camera here to begin real-time analysis. The video feed will appear in the main area.',
        target: '[data-panel="camera"]',
        position: 'right'
    },
    {
        title: 'Emotion Analysis',
        description: 'View detected emotions from facial expressions. The AI analyzes faces and provides emotion insights.',
        target: '[data-panel="emotion"]',
        position: 'right'
    },
    {
        title: 'Color Palette',
        description: 'Get intelligent color suggestions based on the scene mood and detected emotions.',
        target: '[data-panel="color"]',
        position: 'right'
    },
    {
        title: 'Framing Analysis',
        description: 'Check your composition with rule of thirds, headroom, and looking room guidelines.',
        target: '[data-panel="framing"]',
        position: 'right'
    },
    {
        title: 'Scene Analysis',
        description: 'Detect unwanted objects and background clutter to maintain clean, professional shots.',
        target: '[data-panel="scene"]',
        position: 'right'
    },
    {
        title: 'Start Camera',
        description: 'Click this button to start your camera and begin analyzing your footage in real-time!',
        target: '#start-camera-btn',
        position: 'bottom'
    }
];

function startTutorial() {
    currentTutorialStep = 0;
    tutorialOverlay.classList.add('active');
    tutorialTotalEl.textContent = tutorialSteps.length;
    showTutorialStep(currentTutorialStep);
}

function showTutorialStep(stepIndex) {
    if (stepIndex >= tutorialSteps.length) {
        endTutorial();
        return;
    }

    const step = tutorialSteps[stepIndex];
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
        // Skip to next step if target not found
        currentTutorialStep++;
        showTutorialStep(currentTutorialStep);
        return;
    }

    // Update tutorial content
    tutorialTitle.textContent = step.title;
    tutorialDescription.textContent = step.description;
    tutorialStepEl.textContent = stepIndex + 1;

    // Position spotlight
    const rect = targetElement.getBoundingClientRect();
    tutorialSpotlight.style.top = `${rect.top - 8}px`;
    tutorialSpotlight.style.left = `${rect.left - 8}px`;
    tutorialSpotlight.style.width = `${rect.width + 16}px`;
    tutorialSpotlight.style.height = `${rect.height + 16}px`;

    // Position tooltip
    positionTooltip(rect, step.position);

    // Update button text
    if (stepIndex === tutorialSteps.length - 1) {
        tutorialNextBtn.textContent = 'Finish';
    } else {
        tutorialNextBtn.textContent = 'Next';
    }
}

function positionTooltip(targetRect, position) {
    const tooltipRect = tutorialTooltip.getBoundingClientRect();
    const padding = 20;

    switch (position) {
        case 'right':
            tutorialTooltip.style.top = `${targetRect.top}px`;
            tutorialTooltip.style.left = `${targetRect.right + padding}px`;
            break;
        case 'left':
            tutorialTooltip.style.top = `${targetRect.top}px`;
            tutorialTooltip.style.left = `${targetRect.left - tooltipRect.width - padding}px`;
            break;
        case 'bottom':
            tutorialTooltip.style.top = `${targetRect.bottom + padding}px`;
            tutorialTooltip.style.left = `${targetRect.left}px`;
            break;
        case 'top':
            tutorialTooltip.style.top = `${targetRect.top - tooltipRect.height - padding}px`;
            tutorialTooltip.style.left = `${targetRect.left}px`;
            break;
    }
}

function endTutorial() {
    tutorialOverlay.classList.remove('active');
    localStorage.setItem('cinemind-tutorial-seen', 'true');

    // Clean up highlighted elements
    document.querySelectorAll('.tutorial-highlighted').forEach(el => {
        el.classList.remove('tutorial-highlighted');
        el.style.position = '';
        el.style.zIndex = '';
    });
}

// Tutorial event listeners
tutorialBtn.addEventListener('click', startTutorial);
tutorialSkipBtn.addEventListener('click', endTutorial);
tutorialNextBtn.addEventListener('click', () => {
    currentTutorialStep++;
    showTutorialStep(currentTutorialStep);
});

// Close tutorial on backdrop click
document.querySelector('.tutorial-backdrop').addEventListener('click', endTutorial);

// ===========================
// Smooth Scroll for Landing Page
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================
// Demo Data Updates
// ===========================
// Update color metrics
setInterval(() => {
    if (isAnalyzing) {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 100);
        const brightness = Math.floor(Math.random() * 100);

        document.getElementById('hue-value').textContent = `${hue}°`;
        document.getElementById('saturation-value').textContent = `${saturation}%`;
        document.getElementById('brightness-value').textContent = `${brightness}%`;

        if (document.getElementById('hue-fill')) document.getElementById('hue-fill').style.width = `${(hue / 360) * 100}%`;
        if (document.getElementById('saturation-fill')) document.getElementById('saturation-fill').style.width = `${saturation}%`;
        if (document.getElementById('brightness-fill')) document.getElementById('brightness-fill').style.width = `${brightness}%`;

        // Update explanations
        if (document.getElementById('hue-explanation')) document.getElementById('hue-explanation').textContent = getHueDescription(hue);
        if (document.getElementById('saturation-explanation')) document.getElementById('saturation-explanation').textContent = getSaturationDescription(saturation);
        if (document.getElementById('brightness-explanation')) document.getElementById('brightness-explanation').textContent = getBrightnessDescription(brightness);

        // Update color swatches
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach((swatch, index) => {
            const h = (hue + index * 30) % 360;
            swatch.style.background = `hsl(${h}, ${saturation}%, ${brightness}%)`;
        });
    }
}, 3000);

// ===========================
// Initialize
// ===========================
console.log('CineMind UI initialized');
console.log('Note: This is a frontend demo. Connect to Python backend for real analysis.');
