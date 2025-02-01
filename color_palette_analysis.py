import cv2
import numpy as np

def analyze_color_palette(frame):
    """
    Analyzes the color palette of the frame and provides suggestions for color harmony, contrast, and overall aesthetics.
    Prints the suggestions instead of displaying them on the frame.
    """
    height, width, _ = frame.shape
    
    # Convert the frame to the HSV color space (more intuitive for color analysis)
    hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Calculate the average hue, saturation, and value (brightness) of the entire frame
    avg_hue = np.mean(hsv_frame[:, :, 0])
    avg_saturation = np.mean(hsv_frame[:, :, 1])
    avg_brightness = np.mean(hsv_frame[:, :, 2])

    suggestions = []

    # Check for color harmony: if the colors are too varied or clashing
    if avg_saturation > 150:
        suggestions.append("The color palette is quite saturated. Consider reducing saturation for a more balanced look.")
    
    if avg_brightness < 50:
        suggestions.append("The scene seems quite dark. Consider lighting the scene more or using brighter colors.")
    elif avg_brightness > 200:
        suggestions.append("The scene is quite bright. A more balanced brightness would make the scene more visually appealing.")

    # Analyze if the scene has good contrast between the subject and the background
    contrast = cv2.Laplacian(frame, cv2.CV_64F).var()  # Higher variance means higher contrast
    if contrast < 50:
        suggestions.append("The contrast in the scene is low. Increase contrast to make the subject stand out more.")

    # Suggest color temperature (warm vs cool)
    if 10 < avg_hue < 50:
        suggestions.append("The scene has a warm color palette, which is good for creating a cozy or energetic mood.")
    elif 100 < avg_hue < 140:
        suggestions.append("The scene has a cool color palette, which gives a calm or clinical feel.")

    # Print the suggestions
    if suggestions:
        for suggestion in suggestions:
            print("Color palette analysis:"+suggestion)
    else:
        print("The color palette seems balanced.")

    return frame, suggestions
