# 🎥 CineMind: AI-Powered Cinematic Assistant

CineMind is a premium, real-time filmmaking platform designed to help directors and cinematographers bridge the gap between creative vision and technical execution. By leveraging advanced AI models, CineMind provides on-set guidance, technical analysis, and directorial collaboration.

---

## ✨ Features

### 🤖 Ray AI — The Virtual Director
Inspired by legendary filmmakers, **Ray AI** acts as your digital creative partner. 
- **Director-Specific Insights**: Get advice based on the styles of masters like Satyajit Ray or Wes Anderson.
- **Scene Design**: Receive detailed breakdowns of atmosphere, lighting, and pacing.
- **Collaborative Chat**: Ask for "Cyberpunk lighting" or "Noir-style framing" and get instant directorial notes.

### 📐 Technical Analysis Suite
Experience real-time computer vision analysis directly on your camera feed:
- **Framing Analysis**: Real-time evaluation of Rule of Thirds, Headroom, and Looking Room.
- **Color Palette Analysis**: Smart tracking of Hue, Saturation, and Brightness with mood-based palette suggestions.
- **Scene Awareness**: Powered by YOLOv5/Coco-SSD to detect unwanted objects and ensure a clean frame.
- **Emotion Tracking**: Analyze the emotional core of a performance to match the scene's intended mood.

### 💎 Premium Experience
- **Cinematic UI**: A glassmorphism-inspired interface with smooth Framer Motion animations.
- **Real-time Feedback**: Minimal latency analysis for immediate on-set adjustments.
- **Responsive Design**: Built for both desktop control and mobile monitoring.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **AI/ML**: [TensorFlow.js](https://www.tensorflow.org/js) (BlazeFace, Coco-SSD)
- **Intelligence**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) (GPT-4/5)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- An Azure OpenAI API key (for Ray AI functionality)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cinemind.git
   cd cinemind
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=your_endpoint_here
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5.1-chat
   ```

4. **Launch the platform**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to start your cinematic journey.

---

## 📽️ Documentation & Inspiration

CineMind is dedicated to the legacy of **Satyajit Ray** and the countless directors who have pushed the boundaries of visual storytelling. For a detailed guide on how to use the analysis tools, visit our in-app **Tutorial** section.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*CineMind — Your vision, perfected by AI.*
