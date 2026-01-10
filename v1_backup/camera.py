import cv2

# Function to initialize the camera and capture video feed
def capture_video():
    # Initialize the video capture (use 0 for the default webcam)
    cap = cv2.VideoCapture(0)

    # Check if the camera opened successfully
    if not cap.isOpened():
        print("Error: Could not open camera.")
        exit()
    
    return cap
