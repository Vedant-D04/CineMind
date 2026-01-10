# Removed .pth model usage for lighter deployment
# Emotion recognition is now bypassed or passed as a preference

import cv2
import numpy as np

# Define emotion labels and associated scene types
emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
emotion_scene_types = {
    'angry': 'Intense/Dramatic',
    'disgust': 'Gritty/Unpleasant',
    'fear': 'Eerie/Horror',
    'happy': 'Warm/Joyful',
    'sad': 'Cold/Melancholic',
    'surprise': 'Vibrant/Dynamic',
    'neutral': 'Balanced/Natural'
}

def analyze_emotion(frame, prefetched_emotion='neutral'):
    """
    Analyzes the color palette. Prefetched_emotion can be passed; 
    otherwise, it defaults to 'neutral'.
    """
    emotion = prefetched_emotion or 'neutral'
    frame, suggestions = analyze_color_palette(frame, emotion)
    return frame, suggestions



def analyze_color_palette(frame, emotion):
    """
    Analyzes the color palette of the frame and provides suggestions based on detected emotion.
    """
    hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    avg_hue = np.mean(hsv_frame[:, :, 0])
    avg_saturation = np.mean(hsv_frame[:, :, 1])
    avg_brightness = np.mean(hsv_frame[:, :, 2])

    suggestions = []

    if avg_saturation > 150:
        suggestions.append("The color palette is quite saturated. Consider reducing saturation for a more balanced look.")
    
    if avg_brightness < 50:
        suggestions.append("The scene seems quite dark. Consider lighting the scene more or using brighter colors.")
    elif avg_brightness > 200:
        suggestions.append("The scene is quite bright. A more balanced brightness would make the scene more visually appealing.")

    contrast = cv2.Laplacian(frame, cv2.CV_64F).var()
    if contrast < 50:
        suggestions.append("The contrast in the scene is low. Increase contrast to make the subject stand out more.")
    
    if 10 < avg_hue < 50:
        suggestions.append("The scene has a warm color palette, which is good for creating a cozy or energetic mood.")
    elif 100 < avg_hue < 140:
        suggestions.append("The scene has a cool color palette, which gives a calm or clinical feel.")
    
    emotion_based_suggestions = {
        'angry': "Consider using intense and contrasting colors to emphasize drama.",
        'disgust': "A gritty and desaturated color palette might enhance the uneasy feeling.",
        'fear': "Dark, high-contrast visuals can enhance the eerie effect.",
        'happy': "Warm and bright colors can enhance the joyful atmosphere.",
        'sad': "Cool and desaturated colors can reinforce the melancholic mood.",
        'surprise': "High contrast and vibrant colors can amplify excitement.",
        'neutral': "A balanced color scheme is suitable for a natural look."
    }
    
    suggestions.append(emotion_based_suggestions.get(emotion, "No specific suggestion."))

    return frame, suggestions

def get_dominant_colors(frame, k=5):
    """
    Extract dominant colors using K-Means clustering.
    """
    # Resize for speed
    img = cv2.resize(frame, (100, 100))
    pixels = img.reshape((-1, 3))
    pixels = np.float32(pixels)

    # Define criteria and apply kmeans
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

    # Convert centers back to 8-bit
    centers = np.uint8(centers)
    
    # Convert to hex strings
    hex_colors = []
    for center in centers:
        hex_colors.append('#{:02x}{:02x}{:02x}'.format(center[2], center[1], center[0])) # BGR to RGB
    
    return hex_colors
