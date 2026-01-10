# main.py
import cv2
import time
from camera import capture_video
from color_palette_analysis import analyze_emotion
from face_detection import detect_faces
from framing_analysis import analyze_framing
from scene_analysis import analyze_scene
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Initialize the camera feed
cap = capture_video()

# Initialize time tracking variables
last_color_analysis_time = time.time()
last_framing_analysis_time = time.time()

print("\nFilm Assistant Started")
print("Press 'q' to quit\n")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break

    # Perform face detection
    frame = detect_faces(frame)
    
    # Perform framing analysis
    result_text, analyzed_frame = analyze_scene(frame)

    # Overlay result text
    cv2.putText(analyzed_frame, result_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cv2.imshow("Scene Analysis", analyzed_frame)

    # Color/emotion analysis every 10 seconds
    current_time = time.time()
    if current_time - last_color_analysis_time >= 10:
        
    
    # Print framing suggestions when available
        
        print("\nFraming Suggestions:")
        frame, framing_suggestions = analyze_framing(frame)
        print(f"- {framing_suggestions}")
            
        
        
        
        print("\nColor/Emotion Analysis:")
        frame, color_suggestions = analyze_emotion(frame)
        print(f"- {color_suggestions}")
        
        last_color_analysis_time = current_time

    # Show the frame
    cv2.imshow('Film Assistant', frame)

    # Check for quit command
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()