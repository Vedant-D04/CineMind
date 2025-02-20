import cv2
import numpy as np

class FaceDetector:
    """A class to handle face detection operations"""
    
    def __init__(self):
        """Initialize the face detector with Haar Cascade classifier"""
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            raise ValueError("Error: Could not load face cascade classifier")

    def detect_faces(self, frame):
        """
        Detect faces in the given frame
        
        Args:
            frame: numpy.ndarray, Input frame in BGR format
            
        Returns:
            list: List of tuples containing face coordinates (x, y, w, h)
        """
        if frame is None:
            raise ValueError("Error: Input frame is None")
            
        if frame.size == 0:
            raise ValueError("Error: Input frame is empty")
            
        # Convert frame to grayscale
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        except Exception as e:
            raise ValueError(f"Error converting frame to grayscale: {e}")
            
        # Detect faces in the frame
        try:
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
        except Exception as e:
            raise ValueError(f"Error during face detection: {e}")
            
        # Convert faces to list of tuples if faces were found
        if isinstance(faces, np.ndarray) and faces.size > 0:
            return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
        
        return []

def detect_faces(frame):
    """
    Wrapper function for face detection to maintain compatibility with main.py
    
    Args:
        frame: numpy.ndarray, Input frame in BGR format
        
    Returns:
        list: List of tuples containing face coordinates (x, y, w, h)
    """
    try:
        # Create detector if it doesn't exist
        if not hasattr(detect_faces, 'detector'):
            detect_faces.detector = FaceDetector()
            
        # Perform face detection
        return detect_faces.detector.detect_faces(frame)
        
    except Exception as e:
        print(f"Warning: Face detection error - {e}")
        return []

def draw_debug_info(frame, faces):
    """
    Draw face rectangles and debug information on the frame
    
    Args:
        frame: numpy.ndarray, Input frame
        faces: list of tuples (x, y, w, h)
        
    Returns:
        numpy.ndarray: Frame with debug information drawn
    """
    debug_frame = frame.copy()
    
    # Draw rectangle for each face
    for (x, y, w, h) in faces:
        # Draw face rectangle
        cv2.rectangle(debug_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Draw face dimensions
        cv2.putText(debug_frame, f'{w}x{h}', 
                    (x, y - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, (0, 255, 0), 1)
    
    # Draw total face count
    cv2.putText(debug_frame, f'Faces: {len(faces)}', 
                (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, (0, 255, 0), 2)
    
    return debug_frame

# Function to validate face regions
def validate_face_region(frame, face):
    """
    Check if a face region is valid within the frame boundaries
    
    Args:
        frame: numpy.ndarray, Input frame
        face: tuple (x, y, w, h)
        
    Returns:
        bool: True if face region is valid, False otherwise
    """
    if frame is None or len(frame.shape) < 2:
        return False
        
    height, width = frame.shape[:2]
    x, y, w, h = face
    
    # Check if face coordinates are within frame boundaries
    if (x >= 0 and y >= 0 and 
        x + w <= width and 
        y + h <= height and 
        w > 0 and h > 0):
        return True
        
    return False