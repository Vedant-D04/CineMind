import cv2
import time
from FaceDetector import FaceDetector, validate_face_region

# Global variables to store suggestions and track time
previous_suggestions = []
last_suggestion_time = 0
current_suggestion_index = 0

# Initialize face detector
face_detector = FaceDetector()

def check_headroom(face, frame_height):
    """Check if there's enough space above the face"""
    x, y, w, h = face
    # Calculate the space above the face as a ratio
    headroom_ratio = y / frame_height
    # Consider good headroom to be between 10-30% of frame height
    return 0.1 <= headroom_ratio <= 0.3

def check_looking_room(face, frame_width):
    """Check if there's enough space in front of the face"""
    x, y, w, h = face
    # Assume subject is looking right - check space to the right of face
    space_ratio = (frame_width - (x + w)) / frame_width
    return space_ratio >= 0.2

def check_rule_of_thirds(face, frame_width, frame_height):
    """Check if face is positioned near rule of thirds intersections"""
    x, y, w, h = face
    # Calculate face center
    face_center_x = x + w/2
    face_center_y = y + h/2
    
    # Calculate rule of thirds lines
    third_w = frame_width / 3
    third_h = frame_height / 3
    
    # Check if face center is near any rule of thirds intersection
    near_third_x = abs(face_center_x - third_w) < w/2 or abs(face_center_x - 2*third_w) < w/2
    near_third_y = abs(face_center_y - third_h) < h/2 or abs(face_center_y - 2*third_h) < h/2
    
    return near_third_x and near_third_y

def analyze_framing(frame):
    """Analyzes the framing of the shot using actual face detection"""
    global previous_suggestions, last_suggestion_time, current_suggestion_index
    
    height, width = frame.shape[:2]
    suggestions = []
    
    # Detect faces using FaceDetector
    faces = face_detector.detect_faces(frame)
    
    checks = {
        'rule_of_thirds': False,
        'headroom': False,
        'looking_room': False
    }

    # If faces were detected, analyze the composition
    if faces:
        # Use the largest face for composition analysis (assuming it's the main subject)
        largest_face = max(faces, key=lambda face: face[2] * face[3])
        
        if validate_face_region(frame, largest_face):
            # Check rule of thirds
            checks['rule_of_thirds'] = check_rule_of_thirds(largest_face, width, height)
            if not checks['rule_of_thirds']:
                suggestions.append("Move subject to align with rule of thirds points")
            
            # Check headroom
            checks['headroom'] = check_headroom(largest_face, height)
            if not checks['headroom']:
                suggestions.append("Adjust camera position for better headroom")
            
            # Check looking room
            checks['looking_room'] = check_looking_room(largest_face, width)
            if not checks['looking_room']:
                suggestions.append("Provide more looking room in front of the subject")

    # Update suggestion rotation system
    if suggestions:
        previous_suggestions = suggestions

    current_time = time.time()
    if current_time - last_suggestion_time >= 5 and previous_suggestions:
        last_suggestion_time = current_time
        
        if current_suggestion_index < len(previous_suggestions):
            current_suggestion = previous_suggestions[current_suggestion_index]
            current_suggestion_index += 1
        else:
            current_suggestion_index = 0
            current_suggestion = previous_suggestions[0]
        
        suggestions = [current_suggestion]

    # Draw visual feedback
    # Rule of thirds grid
    grid_x1 = width // 3
    grid_x2 = 2 * width // 3
    grid_y1 = height // 3
    grid_y2 = 2 * height // 3
    
    cv2.line(frame, (grid_x1, 0), (grid_x1, height), (255, 255, 255), 2)
    cv2.line(frame, (grid_x2, 0), (grid_x2, height), (255, 255, 255), 2)
    cv2.line(frame, (0, grid_y1), (width, grid_y1), (255, 255, 255), 2)
    cv2.line(frame, (0, grid_y2), (width, grid_y2), (255, 255, 255), 2)

    # Highlight detected faces
    for face in faces:
        x, y, w, h = face
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    return frame, suggestions, checks