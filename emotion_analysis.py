import cv2
import torch
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from FER import DeepCNN
# Load the pre-trained model
# Load the pre-trained model
model = DeepCNN(input_channels=1, num_classes=7)  # Initialize the model architecture
model.load_state_dict(torch.load("/Users/bhargavdesai/Desktop/AI Film making/v1_93.3.pth", map_location=torch.device('cpu')))

# Load OpenCV's Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Define image transformations
transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),  # Convert to grayscale if needed
    transforms.Resize((48, 48)),  # Resize to match model input size
    transforms.ToTensor()  # Normalize
])

# Define emotion labels (adjust based on your model's output classes)
emotion_labels =['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

def analyze_emotion(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # Convert frame to grayscale for face detection
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]  # Crop the detected face
        face_pil = Image.fromarray(face)  # Convert to PIL Image
        face_tensor = transform(face_pil).unsqueeze(0)  # Apply transformations and add batch dimension

        with torch.no_grad():
            output = model(face_tensor)  # Get model predictions
            _, predicted = torch.max(output, 1)  # Get highest probability class
            emotion = emotion_labels[predicted.item()]  # Map index to emotion
        
        # Draw bounding box and label
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, emotion, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    return frame
