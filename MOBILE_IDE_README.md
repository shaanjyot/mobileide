# Mobile IDE - Cursor Clone for Mobile 📱💻

A professional mobile code editor with AI assistance, built with React Native (Expo) and FastAPI. Code anywhere, anytime with multi-language support and intelligent AI features.

## 🌟 Features

### Core Functionality
- **Multi-Language Code Editor** - Write and edit code with syntax highlighting for:
  - JavaScript/TypeScript
  - Python
  - PHP
  - HTML/CSS
  - JSON

- **Real-Time Code Execution** - Run your code instantly:
  - Python scripts
  - JavaScript/Node.js code
  - PHP scripts
  - Secure subprocess execution with timeout protection

- **AI-Powered Assistant** - Get coding help from multiple LLM providers:
  - OpenAI (GPT-5.2, GPT-5, GPT-4.1)
  - Anthropic Claude (Sonnet 4.5, Opus 4.5)
  - Google Gemini (Gemini 3 Flash, Gemini 3 Pro)
  - Switch between providers on the fly

- **Code Completion** - AI-powered code suggestions and completions

- **Project Management**
  - Create and organize multiple projects
  - File explorer with file operations
  - Cloud storage with MongoDB
  - Recent projects tracking

- **Beautiful UI**
  - Dark theme optimized for coding
  - Touch-friendly interface
  - Syntax highlighting with atom-one-dark theme
  - Responsive design for all screen sizes

## 🚀 Technology Stack

### Frontend
- **React Native with Expo** - Cross-platform mobile framework
- **Expo Router** - File-based navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **React Native Syntax Highlighter** - Code syntax highlighting
- **Expo Vector Icons** - Beautiful icons

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Cloud database
- **Emergent Integrations** - Multi-LLM support
- **Subprocess** - Secure code execution

## 📱 How to Use

### 1. Home Screen
- View features and capabilities
- Click "Get Started" to begin

### 2. Projects
- Create new projects with descriptions
- View all your projects
- Tap a project to open editor
- Long-press to delete projects

### 3. Code Editor
- **Files Sidebar** - Browse and manage files
- **Toolbar** - Quick access to features:
  - 💬 AI Chat - Get coding help
  - ✏️ Edit - Enable editing mode
  - 💾 Save - Save your changes
  - ▶️ Run - Execute your code
- **Editor Area** - Write and view code
- **Output Panel** - View execution results

### 4. AI Assistant
- **Chat Interface** - Ask coding questions
- **Provider Selection** - Switch between OpenAI, Claude, Gemini
- **Model Selection** - Choose specific models
- **Context-Aware** - Automatically includes current file context

### 5. Code Execution
- Write your code
- Click the Run button
- View output and errors
- Execution time tracking

## 🎯 Use Cases

1. **Learning to Code**
   - Practice coding on the go
   - Get instant AI help
   - Run code to see results

2. **Quick Prototyping**
   - Test code snippets
   - Try different approaches
   - Experiment with languages

3. **Code Review**
   - Review code anywhere
   - Ask AI for explanations
   - Share insights with team

4. **Algorithm Practice**
   - Solve coding challenges
   - Test solutions instantly
   - Get AI hints when stuck

## 🔐 Security Features

- Secure code execution with subprocess isolation
- 10-second timeout protection
- Input sanitization
- No direct shell access

## 📡 API Endpoints

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/{id}` - Get project
- `DELETE /api/projects/{id}` - Delete project

### Files
- `POST /api/files` - Create file
- `GET /api/files/project/{id}` - List project files
- `GET /api/files/{id}` - Get file
- `PUT /api/files/{id}` - Update file
- `DELETE /api/files/{id}` - Delete file

### AI Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history/{session_id}` - Get history

### Code Execution
- `POST /api/code/execute` - Execute code
- `POST /api/code/complete` - Get completions

## 🎨 UI/UX Highlights

- **Dark Theme** - Easy on the eyes for long coding sessions
- **Touch Optimized** - Large touch targets for mobile
- **Gesture Support** - Natural mobile interactions
- **Keyboard Aware** - Smart keyboard handling
- **Loading States** - Clear feedback for all operations
- **Error Handling** - User-friendly error messages

## 🔑 LLM Integration

Uses **Emergent LLM Key** for seamless AI access:
- Single key for multiple providers
- No need to manage separate API keys
- Pay-as-you-go pricing
- Auto top-up available

## 📊 Supported Languages

### Execution
- ✅ Python 3
- ✅ JavaScript (Node.js)
- ✅ PHP

### Syntax Highlighting
- ✅ JavaScript
- ✅ TypeScript
- ✅ Python
- ✅ PHP
- ✅ HTML
- ✅ CSS
- ✅ JSON

## 🛠️ Technical Details

### Backend Dependencies
- `fastapi` - Web framework
- `motor` - Async MongoDB driver
- `emergentintegrations` - Multi-LLM support
- `uvicorn` - ASGI server
- `python-dotenv` - Environment variables

### Frontend Dependencies
- `expo` - Mobile framework
- `react-native` - Mobile UI
- `expo-router` - Navigation
- `zustand` - State management
- `axios` - HTTP client
- `react-native-syntax-highlighter` - Syntax highlighting

## 🎯 Future Enhancements

Potential features for future versions:
- Git integration
- Collaborative editing
- More language support
- Debugging tools
- Package/dependency management
- Terminal access
- Code templates
- Export/import projects

## 💡 Tips

1. **Save Regularly** - Save your work frequently
2. **Use AI Chat** - Don't hesitate to ask for help
3. **Test Code** - Run code often to catch errors early
4. **Organize Projects** - Use descriptive names and descriptions
5. **Switch Models** - Try different AI models for better results

## 🐛 Known Limitations

- Code execution limited to 10 seconds
- No package installation for executed code
- Basic syntax highlighting (no IntelliSense)
- Cloud storage requires internet connection

## 📝 Notes

- All projects and files are stored in MongoDB
- Code execution runs in isolated subprocesses
- AI responses may vary by model and provider
- Execution timeout prevents infinite loops

---

**Built with ❤️ using React Native, FastAPI, and AI**
