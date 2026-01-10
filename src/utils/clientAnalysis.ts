import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

// Singleton for models
let cocoModel: cocoSsd.ObjectDetection | null = null;
let blazeModel: blazeface.BlazeFaceModel | null = null;

export const loadModels = async () => {
    try {
        await tf.setBackend('webgl');
        await tf.ready();

        if (!cocoModel) {
            cocoModel = await cocoSsd.load();
            console.log("COCO-SSD loaded");
        }
        if (!blazeModel) {
            blazeModel = await blazeface.load({ maxFaces: 10, scoreThreshold: 0.1 });
            console.log("BlazeFace loaded");
        }
    } catch (error) {
        console.error("Error loading TFJS models:", error);
    }
};

// --- Color Analysis ---
export const analyzeColor = (video: HTMLVideoElement, canvas: HTMLCanvasElement, emotion: string = 'neutral') => {
    if (!canvas.width || !canvas.height) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        if (data.length === 0) return null;

        // Calculate average HSV values (matching Python's cv2.cvtColor approach)
        let totalH = 0, totalS = 0, totalV = 0;
        let pixelCount = 0;

        // Sample pixels for performance
        const step = 4; // Sample every 4th pixel
        for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            // Hue calculation (0-360)
            let h = 0;
            if (delta !== 0) {
                if (max === r) {
                    h = 60 * (((g - b) / delta) % 6);
                } else if (max === g) {
                    h = 60 * (((b - r) / delta) + 2);
                } else {
                    h = 60 * (((r - g) / delta) + 4);
                }
            }
            if (h < 0) h += 360;

            // Saturation (0-255 scale to match Python)
            const s = max === 0 ? 0 : (delta / max) * 255;

            // Value/Brightness (0-255 scale)
            const v = max * 255;

            totalH += h;
            totalS += s;
            totalV += v;
            pixelCount++;
        }

        const avgHue = totalH / pixelCount;
        const avgSaturation = totalS / pixelCount;
        const avgBrightness = totalV / pixelCount;

        // Calculate contrast using Laplacian-like variance
        const contrast = calculateContrast(data, canvas.width, canvas.height);

        // Generate suggestions based on Python logic
        const suggestions: string[] = [];

        // Saturation check
        if (avgSaturation > 150) {
            suggestions.push("The color palette is quite saturated. Consider reducing saturation for a more balanced look.");
        }

        // Brightness checks
        if (avgBrightness < 50) {
            suggestions.push("The scene seems quite dark. Consider lighting the scene more or using brighter colors.");
        } else if (avgBrightness > 200) {
            suggestions.push("The scene is quite bright. A more balanced brightness would make the scene more visually appealing.");
        }

        // Contrast check
        if (contrast < 50) {
            suggestions.push("The contrast in the scene is low. Increase contrast to make the subject stand out more.");
        }

        // Hue-based suggestions (warm vs cool)
        if (avgHue > 10 && avgHue < 50) {
            suggestions.push("The scene has a warm color palette, which is good for creating a cozy or energetic mood.");
        } else if (avgHue > 100 && avgHue < 140) {
            suggestions.push("The scene has a cool color palette, which gives a calm or clinical feel.");
        }

        // Emotion-based suggestions
        const emotionSuggestions: Record<string, string> = {
            'angry': "Consider using intense and contrasting colors to emphasize drama.",
            'disgust': "A gritty and desaturated color palette might enhance the uneasy feeling.",
            'fear': "Dark, high-contrast visuals can enhance the eerie effect.",
            'happy': "Warm and bright colors can enhance the joyful atmosphere.",
            'sad': "Cool and desaturated colors can reinforce the melancholic mood.",
            'surprise': "High contrast and vibrant colors can amplify excitement.",
            'neutral': "A balanced color scheme is suitable for a natural look."
        };
        suggestions.push(emotionSuggestions[emotion] || emotionSuggestions['neutral']);

        // Extract dominant colors using K-means-like clustering
        const dominantColors = getDominantColors(data, 5);

        return {
            suggestions,
            metrics: {
                hue: Math.round(avgHue),
                saturation: Math.round((avgSaturation / 255) * 100),
                brightness: Math.round((avgBrightness / 255) * 100),
                contrast: Math.round(contrast)
            },
            dominant_colors: dominantColors
        };
    } catch (e) {
        console.error("Color analysis failed:", e);
        return null;
    }
};

// Calculate contrast using edge detection variance
const calculateContrast = (data: Uint8ClampedArray, width: number, height: number): number => {
    // Simple Laplacian-like edge detection
    let variance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            const top = ((data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3);
            const bottom = ((data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3);
            const left = ((data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3);
            const right = ((data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3);

            const laplacian = Math.abs(4 * center - top - bottom - left - right);
            variance += laplacian * laplacian;
            count++;
        }
    }

    return Math.sqrt(variance / count);
};

// Extract dominant colors using simple K-means clustering
const getDominantColors = (data: Uint8ClampedArray, k: number = 5): string[] => {
    // Sample pixels for clustering (every 10th pixel for performance)
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += 40) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    if (pixels.length === 0) return ['#000000'];

    // Simple K-means clustering
    let centers: [number, number, number][] = [];

    // Initialize centers randomly
    for (let i = 0; i < k; i++) {
        const randomIdx = Math.floor(Math.random() * pixels.length);
        centers.push([...pixels[randomIdx]]);
    }

    // Run K-means iterations
    for (let iter = 0; iter < 10; iter++) {
        const clusters: [number, number, number][][] = Array(k).fill(null).map(() => []);

        // Assign pixels to nearest center
        pixels.forEach(pixel => {
            let minDist = Infinity;
            let closestCenter = 0;

            centers.forEach((center, idx) => {
                const dist = Math.sqrt(
                    Math.pow(pixel[0] - center[0], 2) +
                    Math.pow(pixel[1] - center[1], 2) +
                    Math.pow(pixel[2] - center[2], 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    closestCenter = idx;
                }
            });

            clusters[closestCenter].push(pixel);
        });

        // Update centers
        centers = clusters.map(cluster => {
            if (cluster.length === 0) return [0, 0, 0];
            const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
            return [
                Math.round(sum[0] / cluster.length),
                Math.round(sum[1] / cluster.length),
                Math.round(sum[2] / cluster.length)
            ];
        });
    }

    // Convert centers to hex colors
    return centers.map(center => {
        const toHex = (c: number) => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return `#${toHex(center[0])}${toHex(center[1])}${toHex(center[2])}`;
    });
};

// --- Framing Analysis ---
export const analyzeFraming = async (video: HTMLVideoElement) => {
    if (!blazeModel) return null;

    const returnTensors = false;
    const predictions = await blazeModel.estimateFaces(video, returnTensors, false);

    const checks = {
        ruleOfThirds: false,
        headroom: false,
        lookingRoom: false
    };
    const suggestions: string[] = [];

    if (predictions.length > 0) {
        // Use the largest face (main subject)
        const face = predictions[0] as any;
        const start = face.topLeft as [number, number];
        const end = face.bottomRight as [number, number];

        const faceX = start[0];
        const faceY = start[1];
        const faceW = end[0] - start[0];
        const faceH = end[1] - start[1];
        const faceCenterX = faceX + faceW / 2;
        const faceCenterY = faceY + faceH / 2;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) return null;

        // Rule of Thirds - Check if face center is near intersection points
        const thirdW = width / 3;
        const thirdH = height / 3;

        // Check proximity to rule of thirds lines (both horizontal and vertical)
        const nearThirdX = Math.abs(faceCenterX - thirdW) < faceW / 2 || Math.abs(faceCenterX - 2 * thirdW) < faceW / 2;
        const nearThirdY = Math.abs(faceCenterY - thirdH) < faceH / 2 || Math.abs(faceCenterY - 2 * thirdH) < faceH / 2;

        if (nearThirdX && nearThirdY) {
            checks.ruleOfThirds = true;
        } else {
            suggestions.push("Move subject to align with rule of thirds points");
        }

        // Headroom - Check space above the face (10-30% of frame height)
        const headroomRatio = faceY / height;
        const minHeadroom = 0.1;
        const maxHeadroom = 0.3;

        if (headroomRatio > minHeadroom && headroomRatio < maxHeadroom) {
            checks.headroom = true;
        } else if (headroomRatio < minHeadroom) {
            suggestions.push("Too little headroom. Tilt camera up or move subject down.");
        } else {
            suggestions.push("Adjust camera position for better headroom");
        }

        // Looking Room - Check space in front of face (assuming looking right)
        const spaceRatio = (width - (faceX + faceW)) / width;
        if (spaceRatio >= 0.2) {
            checks.lookingRoom = true;
        } else {
            suggestions.push("Provide more looking room in front of the subject");
        }
    } else {
        suggestions.push("No subject detected for framing analysis.");
    }

    return {
        suggestions,
        checks,
        faces: predictions // Pass raw predictions for drawing
    };
};

// --- Scene Analysis ---
export const analyzeScene = async (video: HTMLVideoElement) => {
    if (!cocoModel) return null;

    // Detect objects (maxNumBoxes: 20)
    const predictions = await cocoModel.detect(video, 20);

    // Expanded unwanted objects list matching Python implementation
    const UNWANTED = [
        'bottle', 'cup', 'backpack', 'handbag', 'laptop', 'book', 'umbrella',
        'cell phone', 'remote', 'keyboard', 'mouse', 'chair', 'couch', 'bed',
        'dining table', 'toilet', 'tv', 'microwave', 'oven', 'toaster', 'sink',
        'refrigerator', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
        'toothbrush', 'wine glass', 'fork', 'knife', 'spoon', 'bowl', 'banana',
        'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
        'donut', 'cake', 'potted plant', 'suitcase', 'frisbee', 'skis', 'snowboard',
        'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
        'surfboard', 'tennis racket', 'tie', 'backpack', 'umbrella', 'handbag'
    ];

    const objects = predictions.map(p => ({
        name: p.class,
        confidence: p.score
    }));

    // Detect unwanted objects
    const unwantedFound = predictions.filter(p => UNWANTED.includes(p.class));
    const unwantedNames = Array.from(new Set(unwantedFound.map(p => p.class)));

    // Detect background people (off-center or small)
    const people = predictions.filter(p => p.class === 'person');
    const width = video.videoWidth;
    const height = video.videoHeight;

    let mainPerson: cocoSsd.DetectedObject | null = null;
    let maxArea = 0;

    // Find main person (centered and largest)
    people.forEach(p => {
        const [x, y, w, h] = p.bbox;
        const area = w * h;
        const centerX = x + w / 2;

        // Check if person is centered (within middle 40% of frame)
        if (centerX > width * 0.3 && centerX < width * 0.7 && area > maxArea) {
            mainPerson = p;
            maxArea = area;
        }
    });

    // Identify background people
    const backgroundPeople = people.filter(p => {
        if (!mainPerson || p === mainPerson) return false;

        const [x, y, w, h] = p.bbox;
        const area = w * h;
        const centerX = x + w / 2;

        // Background if off-center or much smaller than main person
        const offCenter = centerX < width * 0.3 || centerX > width * 0.7;
        const muchSmaller = area < maxArea * 0.5;

        return offCenter || muchSmaller;
    });

    // Combine all clutter
    const allClutter = [...unwantedNames];
    if (backgroundPeople.length > 0) {
        allClutter.push(`${backgroundPeople.length} background person(s)`);
    }

    // Determine status
    let status = "Scene is clear — No unwanted clutter detected.";
    let isClean = true;

    if (allClutter.length > 0) {
        status = `Clutter Detected: ${allClutter.join(', ')}`;
        isClean = false;
    }

    return {
        status,
        is_clean: isClean,
        objects,
        start_points: predictions.map(p => p.bbox) // [x, y, w, h]
    };
};
