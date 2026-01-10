// Backend Integration Configuration
const BACKEND_URL = 'http://localhost:5001';
const USE_BACKEND = true; // Set to false to use demo mode

// Update the analyzeFrame function to use real backend
async function analyzeFrameWithBackend() {
    if (!isAnalyzing || !USE_BACKEND) {
        // Fall back to simulated analysis
        return analyzeFrame();
    }

    try {
        // Capture current frame from video
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraFeed, 0, 0);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Send to backend
        const response = await fetch(`${BACKEND_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const results = await response.json();

        // Update UI with real results
        updateUIWithBackendResults(results);

    } catch (error) {
        console.error('Backend analysis error:', error);
        // Fall back to simulated analysis
        analyzeFrame();
    }

    // Continue loop
    animationId = requestAnimationFrame(analyzeFrameWithBackend);
}

function updateUIWithBackendResults(results) {
    // Update face detection
    if (results.faces && results.faces.length > 0) {
        updateFaceCount(results.faces.length);
        // Draw face boxes on canvas
        results.faces.forEach(face => {
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 3;
            ctx.strokeRect(face.x, face.y, face.width, face.height);
        });
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
        updateCurrentEmotion(`${emoji} ${label}`);

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

// Check backend health on startup
async function checkBackendHealth() {
    if (!USE_BACKEND) return;

    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        updateAnalysisStatus('Backend Connected');
    } catch (error) {
        console.warn('⚠️ Backend not available, using simulated analysis');
        updateAnalysisStatus('Demo Mode');
    }
}

// Initialize backend check
checkBackendHealth();

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeFrameWithBackend,
        updateUIWithBackendResults,
        checkBackendHealth,
        USE_BACKEND,
        BACKEND_URL
    };
}
