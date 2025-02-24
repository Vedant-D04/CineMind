import cv2
import numpy as np
import torch

class FaceDetector:
    """A class to handle face detection operations using YOLOv5"""
    
    def __init__(self, model_path=None):
        """Initialize the YOLO face detector"""
        # Load YOLOv5 model
        if model_path is None:
            # If no custom model provided, load from torch hub
            self.model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
        else:
            self.model = torch.load(model_path)
        
        # Set model parameters
        self.model.conf = 0.5  # Confidence threshold
        self.model.classes = [0]  # Only detect persons
        self.model.eval()  # Set to evaluation mode

    def detect_faces(self, frame):
        """
        Detect faces in the given frame using YOLO
        
        Args:
            frame: numpy.ndarray, Input frame in BGR format
            
        Returns:
            list: List of tuples containing face coordinates (x, y, w, h)
        """
        if frame is None:
            raise ValueError("Error: Input frame is None")
            
        if frame.size == 0:
            raise ValueError("Error: Input frame is empty")
            
        try:
            # Perform detection
            results = self.model(frame)
            
            # Extract detections
            faces = []
            for detection in results.xyxy[0]:  # xyxy format: x1, y1, x2, y2, confidence, class
                if detection[5] == 0:  # class 0 is person
                    x1, y1, x2, y2 = detection[:4].round().int().tolist()
                    w = x2 - x1
                    h = y2 - y1
                    faces.append((int(x1), int(y1), int(w), int(h)))
            
            return faces
            
        except Exception as e:
            print(f"Error during face detection: {e}")
            return []

    def draw_debug_info(self, frame, faces):
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
            
            # Draw confidence score if available
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

def validate_face_region(frame, face):
    """Validate if face coordinates are within frame boundaries"""
    if frame is None or len(frame.shape) < 2:
        return False
        
    height, width = frame.shape[:2]
    x, y, w, h = face
    
    return (x >= 0 and y >= 0 and 
            x + w <= width and 
            y + h <= height and 
            w > 0 and h > 0)