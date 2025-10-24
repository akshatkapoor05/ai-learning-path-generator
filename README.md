AI-Powered Job Description to Learning Path Generator

This is a smart web application that transforms any job description into a comprehensive, interactive learning roadmap.
It goes beyond simple lists by using a novel, multi-API approach:
1. Google Gemini analyzes the job description to extract a structured learning path.
2. Exa AI's Search API finds the most relevant tutorials, project ideas, and interview questions for each step.
3. Exa AI's Get Contents API + Gemini work together to provide on-demand, synthesized explanations of key concepts, creating an interactive learning tool instead of just a list of links.

<img width="1914" height="872" alt="image" src="https://github.com/user-attachments/assets/932a9214-d9b2-46f6-ac94-76702c0f1281" />


Core Features
1. Smart JD Analysis: Paste any job description and instantly get a prioritized, step-by-step learning path.
2. Comprehensive Resources: Gathers links for:
    Tutorials: The best guides to learn a skill.
    Project Ideas: Practical projects to build your portfolio.
    Interview Prep: Common questions related to the skill.
    
3. Novel "Key Concepts" Synthesizer: This is the app's most powerful feature.
    Don't know what "TypeScript" is? Click "Explain This."
    The app searches the web for simple explanations using Exa.
    It reads the content of the top results.
    It uses Gemini to synthesize a single, clear, beginner-friendly paragraph explaining the concept.
    
4. Detailed Analytics: Understand the estimated timeline and difficulty for each skill in your new roadmap.
5. Secure Backend Proxy: All API calls are routed through a Node.js server, keeping your secret API keys safe and avoiding all browser-side CORS issues.

Tech Stack
    Frontend: HTML5, CSS3, JavaScript (ES6+ Modules)

    Backend: Node.js, Express.js

    Core APIs:
        Google Gemini (gemini-2.5-flash-preview-09-2025): For job description analysis and content synthesis.
        Exa AI: For deep web search (/search) and content extraction (/contents).

    Backend Libraries:
        axios: For making server-side API calls.
        cors: To allow the frontend and backend to communicate.
        dotenv: To securely manage environment variables.
        
How It Works (Architecture)
This app uses a secure client-server model to protect API keys and enable powerful, cross-domain requests.graph TD
    A[Frontend (index.html)] -- 1. Paste JD --> B(Backend Server (server.js));
    B -- 2. /api/analyze --> C[Google Gemini API];
    C -- 3. Structured JSON Path --> B;
    B -- 4. Learning Path --> A;

    A -- 5. (Loop) /api/search (tutorial) --> B;
    A -- 6. (Loop) /api/search (project) --> B;
    A -- 7. (Loop) /api/search (interview) --> B;
    B -- 8. (Multiple) --> D[Exa Search API];
    D -- 9. Link Results --> B;
    B -- 10. Link Results --> A;
    
    A -- 11. (On-Demand) /api/explain --> B;
    B -- 12. Search --> D;
    D -- 13. Search Results (IDs) --> B;
    B -- 14. Get Contents --> E[Exa Contents API];
    E -- 15. Raw Text --> B;
    B -- 16. Synthesize Text --> C;
    C -- 17. Synthesized Paragraph --> B;
    B -- 18. Explanation --> A;

Setup & InstallationTo run this project locally, you'll need Node.js and npm installed.
1. Clone the repository:git clone [https://github.com/akshatkapoor05/ai-learning-path-generator.git]
cd YOUR_REPO_NAME
2. Install backend dependencies:npm install
3. Create your environment file:Create a file named .env in the root of the project directory. This file will hold your secret API keys.
4. Add your API keys to .env:Open the .env file and add your keys. Do not use quotes.GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
EXA_API_KEY=YOUR_EXA_API_KEY
5. IMPORTANT: Create a .gitignore file:Create a file named .gitignore in the root of the project directory. This will prevent you from accidentally uploading your secret keys to GitHub.# Node.js dependencies
node_modules/

# Environment variables
.env
6. Run the server:node server.js
Your server will start, usually on http://localhost:3000.7. Open the app:You can now open the index.html file directly in your browser. It will automatically connect to your local server.
