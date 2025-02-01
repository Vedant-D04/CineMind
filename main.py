import cv2
import time
from camera import capture_video
from color_palette_analysis import analyze_color_palette  # Import the color palette analysis function

# Initialize the camera feed using capture_video from camera.py
cap = capture_video()

# Initialize time tracking variables
last_time = time.time()

# Loop to continuously capture frames from the camera
while True:
    ret, frame = cap.read()  # Capture a frame from the video feed

    if not ret:
        print("Error: Failed to grab frame.")
        break

    # Check if 10 seconds have passed since the last analysis
    current_time = time.time()
    if current_time - last_time >= 10:  # 10 seconds passed
        # Analyze the frame using the color palette analysis script
        frame, suggestions = analyze_color_palette(frame)  # Get suggestions from color palette analysis
        # Print the suggestions to the console
        if suggestions:
            for suggestion in suggestions:
                print(suggestion)  # Print suggestions
        last_time = current_time  # Reset the timer

    # Show the frame continuously (even when analysis isn't happening)
    cv2.imshow('Film Assistant', frame)

    # Check for the 'q' key press to exit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the camera and close any OpenCV windows
cap.release()
cv2.destroyAllWindows()
