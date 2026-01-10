import cv2
import torch
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

import os
from ultralytics import YOLO

# Load YOLOv8 model - automatically downloads if not present
model_path = os.getenv('YOLO_MODEL_PATH', 'yolov8s.pt')
print(f"Loading YOLOv8 model: {model_path}...")
model = YOLO(model_path)

# Define unwanted objects (these are typical clutter items in a frame)
UNWANTED_OBJECTS = [
    'chair', 'bottle', 'cup', 'backpack', 'handbag', 'laptop', 'book',
    'umbrella', 'tissue', 'tripod', 'bag', 'phone', 'tablet', 'headphones',
    'charger', 'cables', 'shoe', 'slipper', 'cap', 'hat', 'scarf', 'jacket',
    'dustbin', 'water dispenser', 'plastic bag', 'fan', 'stool', 'carton',
    'paint can', 'power strip', 'mask', 'gloves', 'mic stand', 'speaker',
    'poster', 'banner', 'bucket', 'mop', 'broom', 'mirror', 'clock', 'calendar',
    'clothes hanger', 'ladder', 'drum', 'toolbox', 'extension cord', 'helmet',
    'plant pot', 'frame', 'keys', 'pen', 'notebook', 'remote control', 'towel',
    'basket', 'food packet', 'cigarette pack', 'lighter', 'cushion', 'candle',
    'shoe rack', 'pet bowl', 'pillow', 'magazine', 'tv remote', 'game controller',
    'plastic container', 'cart', 'bicycle', 'motorcycle', 'traffic cone',
    'street sign', 'lamp', 'rope', 'construction helmet', 'coffee machine',
    'cutlery', 'plate', 'soda can', 'broomstick', 'mat', 'curtain',
    'box', 'folding table', 'folding chair', 'trash bag'
]


def is_background_person(box, frame_width, frame_height, main_person_box=None):
    """
    Check if the detected person is likely in the background.
    Background people are usually:
    - Smaller (further away)
    - Located off-center
    """
    x1, y1, x2, y2 = box
    box_width = x2 - x1
    box_height = y2 - y1
    box_area = box_width * box_height

    center_x = (x1 + x2) / 2

    # Off-center people are more likely background clutter
    center_threshold = frame_width * 0.3
    if center_x < center_threshold or center_x > (frame_width - center_threshold):
        return True

    # Compare size to the main person
    if main_person_box:
        mx1, my1, mx2, my2 = main_person_box
        main_area = (mx2 - mx1) * (my2 - my1)
        if box_area < main_area * 0.5:  # Much smaller than main person
            return True

    return False

def analyze_scene(frame):
    """
    Detect unwanted objects and background clutter in the frame.
    Returns:
        result_text: Summary of analysis
        frame_with_boxes: Frame with bounding boxes and labels drawn
    """
    # Run inference
    results = model(frame)[0]

    frame_with_boxes = frame.copy()
    frame_height, frame_width, _ = frame.shape

    people_boxes = []
    unwanted_objects = []

    # Process detections
    for box in results.boxes:
        cls_idx = int(box.cls[0])
        class_name = results.names[cls_idx]
        conf = float(box.conf[0])
        coords = box.xyxy[0].tolist() # [x1, y1, x2, y2]

        if class_name == 'person':
            people_boxes.append((coords, conf))
        elif class_name in UNWANTED_OBJECTS:
            unwanted_objects.append((class_name, coords, conf))

    # Find main subject (center person with largest size)
    main_person_box = None
    max_area = 0

    for box, conf in people_boxes:
        x1, y1, x2, y2 = map(int, box)
        area = (x2 - x1) * (y2 - y1)
        center_x = (x1 + x2) / 2

        if (frame_width * 0.3 < center_x < frame_width * 0.7) and area > max_area:
            main_person_box = box
            max_area = area

    # Draw boxes and detect clutter
    detected_clutter = []

    for box, conf in people_boxes:
        x1, y1, x2, y2 = map(int, box)

        if main_person_box and box == main_person_box:
            color = (0, 255, 0)  # Main subject - Green
            label = f"Main Subject ({conf:.2f})"
        elif is_background_person(box, frame_width, frame_height, main_person_box):
            color = (0, 0, 255)  # Background person - Red
            label = f"Background Person ({conf:.2f})"
            detected_clutter.append('person')
        else:
            continue  # Skip if not main person or background person

        cv2.rectangle(frame_with_boxes, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame_with_boxes, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # Draw unwanted object boxes
    for class_name, box, conf in unwanted_objects:
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(frame_with_boxes, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(frame_with_boxes, f"{class_name} ({conf:.2f})", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        detected_clutter.append(class_name)

    # Generate result text
    detected_clutter_names = []
    objects_list = []

    # Process objects for the list
    for class_name, box, conf in unwanted_objects:
        detected_clutter_names.append(class_name)
        objects_list.append({
            'name': class_name,
            'confidence': float(conf)
        })
    
    # Also add background people as clutter
    for box, conf in people_boxes:
        if is_background_person(box, frame_width, frame_height, main_person_box):
             detected_clutter_names.append('person')
             objects_list.append({
                 'name': 'person',
                 'confidence': float(conf)
             })

    if detected_clutter_names:
        result_text = f"Clutter Detected: {', '.join(set(detected_clutter_names))}"
    else:
        result_text = "Scene is clear — No unwanted clutter detected."

    return {
        'status': result_text,
        'is_clean': not detected_clutter_names,
        'objects': objects_list
    }, frame_with_boxes

def main():
    cap = cv2.VideoCapture(1)

    if not cap.isOpened():
        print("Error: Cannot open camera")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame")
            break

        result_text, analyzed_frame = analyze_scene(frame)

        # Overlay result text
        cv2.putText(analyzed_frame, result_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        cv2.imshow("Scene Analysis", analyzed_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
