import cv2
import torch
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from FER import DeepCNN
# Load the pre-trained model
# Load the pre-trained model
model = DeepCNN(input_channels=1, num_classes=7)  # Initialize the model architecture
model.load_state_dict(torch.load("/Users/vedantdesai/CineMind/v1_93.3.pth", map_location=torch.device('cpu')))

# Load OpenCV's Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Define image transformations
transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),  # Convert to grayscale if needed
    transforms.Resize((48, 48)),  # Resize to match model input size
    transforms.ToTensor()  # Normalize
])

# Define emotion labels (adjust based on your model's output classes)
emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

def analyze_emotion(frame):
    """
    Detects faces and predicts emotions.
    Returns: (modified_frame, faces_data, primary_emotion)
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))
    
    faces_data = []
    primary_emotion = {'label': 'neutral', 'confidence': 0.0}
    max_conf = -1

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        face_pil = Image.fromarray(face)
        face_tensor = transform(face_pil).unsqueeze(0)

        with torch.no_grad():
            output = model(face_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted = torch.max(probabilities, 0)
            emotion = emotion_labels[predicted.item()]
            
            conf_val = float(confidence.item())
            if conf_val > max_conf:
                max_conf = conf_val
                primary_emotion = {'label': emotion, 'confidence': conf_val}
            
            faces_data.append({'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h), 'emotion': emotion})
            
        # Draw on frame
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, emotion.capitalize(), (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    return frame, faces_data, primary_emotion
