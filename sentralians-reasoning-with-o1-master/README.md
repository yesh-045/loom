

<h1 align='center'>loom</h1>

<p align='center'>
<strong>loom</strong> is an AI-powered educational platform that enhances learning through interactivity. It generates custom flashcards, quizzes, physics simulations, and math problem visualizations, providing an engaging, real-time learning experience.
<br><br>

<p align='center'>
<i>Created by: Loomyn</i>
<br>

## Features
🧠 <strong>Powerpoints, Flashcards, and Quizzes!</strong><br>
Turn facts into fun! Simply make a request in order reinforce your knowledge!
<video src="https://github.com/user-attachments/assets/14a8390f-2a50-4362-a6b4-716fcd649d61" controls="controls" style="max-width: 730px;">
</video>

🔤 <strong>Spelling Challenges</strong><br>
Hone your spelling skills with any topic you want!
<video src="https://github.com/user-attachments/assets/c9a08cff-7753-458d-a058-17d1ee714321" controls="controls" style="max-width: 730px;">
</video>

🎨 <strong>Drawing board on a canvas</strong><br>
Visualize ideas or physics problems on a canvas!

🎤 <strong>Speech-to-Text & Text-to-Speech</strong><br>
Practice pronunciation, engage in conversations, and get audio responses powered by ElevenLabs!

🗣️ <strong>Voice Training & Custom Voices</strong><br>
Create custom voice clones and practice speaking with personalized feedback!

🎯 <strong>Speech Practice Exercises</strong><br>
Improve your speaking skills with pronunciation, conversation, and reading practice exercises!
<video src="https://github.com/user-attachments/assets/6b34a8ec-166e-459c-845b-e41303a50b91" controls="controls" style="max-width: 730px;">
</video>

⚙️ <strong>Physics-based simulations</strong><br>
Experience science in action, watch the laws of physics come to life!
<video src="https://github.com/user-attachments/assets/42030fc3-e23b-45e9-9938-a642b3fcf5d4" controls="controls" style="max-width: 730px;">
</video>


## Getting Started

This guide is for developers looking to set up loom on their local machine. Please follow the steps below carefully.

### 1. Install Dependencies

Make sure you are in the root folder, then run the following command to install all necessary dependencies:

```bash
npm install
```

### 2. Setup Environment Variables

After installing the dependencies, create a `.env` file in the root directory (at the same level as `README.md` and `package.json`). You can copy the `.env.example` file and populate it with your actual values:

```bash
cp .env.example .env
```

Then populate the `.env` file with the following values:

```bash
AIML_API_KEY=your_aiml_api_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DATABASE_URL=your_mongodb_atlas_connection_string

# Cloudinary for file storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

```

### 3. Database Setup

To push the schema into your MongoDB cluster, run:

```bash
npx prisma db push
```

It is recommended to use MongoDB Atlas for hosting your clusters. Check out the official [MongoDB Atlas](https://www.mongodb.com/docs/atlas/) documentation for more info.

### 4. API Endpoints

The application includes several API endpoints for different functionalities:

#### Speech & Audio APIs
- `/api/text-to-speech` - Convert text to speech using ElevenLabs
- `/api/speech-response` - Generate AI response and convert to speech
- `/api/speech-practice` - Analyze speech practice and provide feedback
- `/api/voice-training` - Create custom voice clones and manage voices

#### AI & Content APIs
- `/api/generate-ai-response` - Generate AI responses using Gemini
- `/api/image` - Upload and manage images via Cloudinary

#### Authentication
- Simple stub authentication - no real authentication required, just click to enter the app

### 4. Start Development Server

After installing dependencies and setting up the database, run the following command in the root directory to start the development server:

```bash
npm run dev
```
