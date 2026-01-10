import cv2

# Load OpenCV's Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def detect_faces(frame):
    """
    Detects faces in the given frame and draws bounding boxes around them.
    
    Args:
        frame (numpy array): The frame captured from the webcam.
    
    Returns:
        frame (numpy array): The frame with bounding boxes drawn around detected faces.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # Convert frame to grayscale for detection
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))
    if face_cascade.empty():
        print("Error loading Haarcascade XML file. Check the file path.")

    for (x, y, w, h) in faces:
        # Draw a green rectangle around detected faces
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    return frame
