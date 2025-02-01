import cv2
import time

# Global variables to store suggestions and track time
previous_suggestions = []
last_suggestion_time = 0  # Track the last time a suggestion was made
current_suggestion_index = 0  # Keep track of the index of the current suggestion

def detect_subject_position(frame):
    """
    Dummy function to simulate subject detection.
    In a real implementation, you could use person detection or object detection models like YOLO.
    Returns the (x, y) coordinates of the subject in the frame.
    """
    height, width, _ = frame.shape
    subject_x = width // 2  # Dummy position at the center
    subject_y = height // 2  # Dummy position at the center
    return subject_x, subject_y

def check_headroom(subject_y, height):
    """
    Dummy function to check headroom.
    In a real case, you would check the amount of space above the subject's head.
    """
    if subject_y > height * 0.1:
        return True  # Adequate headroom
    return False  # Insufficient headroom

def check_looking_room(frame, subject_x, subject_y):
    """
    Dummy function to check looking room.
    In a real case, this would check the space in front of the subject's gaze.
    """
    height, width, _ = frame.shape
    if subject_x < width * 0.8:  # Checking if subject has enough space in the frame
        return True
    return False

def check_balance(frame):
    """
    Dummy function to check balance in the composition.
    This can be extended to analyze the overall composition using visual analysis.
    """
    # Placeholder logic: always return balanced composition.
    return True

def analyze_framing(frame):
    """
    Analyzes the framing of the shot, checking rule of thirds, headroom, looking room, and balance.
    Returns a frame with visual feedback and a list of suggestions.
    """
    global previous_suggestions, last_suggestion_time, current_suggestion_index

    height, width, _ = frame.shape
    subject_x, subject_y = detect_subject_position(frame)
    
    suggestions = []

    # Rule of Thirds: Check if the subject is aligned
    if subject_x is not None and subject_y is not None:
        grid_x1 = width // 3
        grid_x2 = 2 * width // 3
        grid_y1 = height // 3
        grid_y2 = 2 * height // 3

        if not (grid_x1 < subject_x < grid_x2 and grid_y1 < subject_y < grid_y2):
            suggestions.append("Adjust subject position for better rule of thirds alignment.")

        # Headroom: Check the amount of space above the subject
        if not check_headroom(subject_y, height):
            suggestions.append("Increase headroom.")

        # Looking Room: Check if the subject has appropriate space in the direction they are looking
        if not check_looking_room(frame, subject_x, subject_y):
            suggestions.append("Provide more looking room.")

        # Balance: Check the overall balance of the composition
        if not check_balance(frame):
            suggestions.append("Reposition the shot for better balance.")
    
    # If there are new suggestions, update the previous ones
    if suggestions:
        previous_suggestions = suggestions

    # Check if 5 seconds have passed before showing the next suggestion
    current_time = time.time()
    if current_time - last_suggestion_time >= 5 and previous_suggestions:
        # Update the time for the last suggestion
        last_suggestion_time = current_time
        
        # Get the current suggestion based on the index
        if current_suggestion_index < len(previous_suggestions):
            current_suggestion = previous_suggestions[current_suggestion_index]
            current_suggestion_index += 1  # Move to the next suggestion
        else:
            current_suggestion_index = 0  # Reset index once all suggestions have been displayed
            current_suggestion = previous_suggestions[0]
        
        suggestions = [current_suggestion]  # Only display the current suggestion

    # Visual feedback (highlighting the subject and adding gridlines)
    if subject_x is not None and subject_y is not None:
        cv2.rectangle(frame, (subject_x - 20, subject_y - 20), (subject_x + 20, subject_y + 20), (0, 255, 0), 2)

    # Draw gridlines for the rule of thirds
    grid_x1 = width // 3
    grid_x2 = 2 * width // 3
    grid_y1 = height // 3
    grid_y2 = 2 * height // 3
    cv2.line(frame, (grid_x1, 0), (grid_x1, height), (255, 255, 255), 2)
    cv2.line(frame, (grid_x2, 0), (grid_x2, height), (255, 255, 255), 2)
    cv2.line(frame, (0, grid_y1), (width, grid_y1), (255, 255, 255), 2)
    cv2.line(frame, (0, grid_y2), (width, grid_y2), (255, 255, 255), 2)

    # Add suggestions text to the frame
    if suggestions:
        y_offset = 30
        for suggestion in suggestions:
            cv2.putText(frame, suggestion, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            y_offset += 30  # Move down for the next suggestion

    # Return the frame with visual feedback
    return frame
