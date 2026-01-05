from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from bson import ObjectId
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# ==================== MODELS ====================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Project(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: Optional[str] = ""
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class FileCreate(BaseModel):
    project_id: str
    name: str
    path: str
    content: str
    language: str

class File(BaseModel):
    id: str = Field(alias="_id")
    project_id: str
    name: str
    path: str
    content: str
    language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class FileUpdate(BaseModel):
    content: Optional[str] = None
    name: Optional[str] = None
    path: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    session_id: str
    provider: str = "openai"  # openai, anthropic, gemini
    model: str = "gpt-5.2"
    context: Optional[str] = None  # Code context for better assistance

class ChatResponse(BaseModel):
    response: str
    session_id: str

class CodeCompletionRequest(BaseModel):
    code: str
    cursor_position: int
    language: str
    provider: str = "openai"
    model: str = "gpt-5.2"

class CodeCompletionResponse(BaseModel):
    completion: str
    suggestions: List[str]

class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    inputs: Optional[List[str]] = []

class CodeExecutionResponse(BaseModel):
    output: str
    error: Optional[str] = None
    execution_time: float

class AIFileOperation(BaseModel):
    operation: str  # 'create', 'edit', 'refactor'
    file_name: str
    file_path: str
    content: str
    language: str
    description: str

class EnhancedChatRequest(BaseModel):
    message: str
    session_id: str
    project_id: str
    current_file_id: Optional[str] = None
    provider: str = "openai"
    model: str = "gpt-5.2"
    include_project_context: bool = True

class EnhancedChatResponse(BaseModel):
    response: str
    session_id: str
    suggested_operations: List[AIFileOperation] = []
    code_blocks: List[Dict[str, Any]] = []

class ApplyAIOperationRequest(BaseModel):
    project_id: str
    operation: str  # 'create', 'edit', 'refactor'
    file_id: Optional[str] = None
    file_name: str
    file_path: str
    content: str
    language: str

# ==================== PROJECT ENDPOINTS ====================

@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    now = datetime.utcnow()
    project_doc = {
        "_id": str(ObjectId()),
        "name": project.name,
        "description": project.description,
        "created_at": now,
        "updated_at": now
    }
    await db.projects.insert_one(project_doc)
    return Project(**project_doc)

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().sort("updated_at", -1).to_list(100)
    return [Project(**serialize_doc(p)) for p in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**serialize_doc(project))

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Delete project and all its files
    result = await db.projects.delete_one({"_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.files.delete_many({"project_id": project_id})
    return {"message": "Project deleted successfully"}

# ==================== FILE ENDPOINTS ====================

@api_router.post("/files", response_model=File)
async def create_file(file: FileCreate):
    now = datetime.utcnow()
    file_doc = {
        "_id": str(ObjectId()),
        "project_id": file.project_id,
        "name": file.name,
        "path": file.path,
        "content": file.content,
        "language": file.language,
        "created_at": now,
        "updated_at": now
    }
    await db.files.insert_one(file_doc)
    
    # Update project's updated_at
    await db.projects.update_one(
        {"_id": file.project_id},
        {"$set": {"updated_at": now}}
    )
    
    return File(**file_doc)

@api_router.get("/files/project/{project_id}", response_model=List[File])
async def get_project_files(project_id: str):
    files = await db.files.find({"project_id": project_id}).sort("path", 1).to_list(1000)
    return [File(**serialize_doc(f)) for f in files]

@api_router.get("/files/{file_id}", response_model=File)
async def get_file(file_id: str):
    file = await db.files.find_one({"_id": file_id})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return File(**serialize_doc(file))

@api_router.put("/files/{file_id}", response_model=File)
async def update_file(file_id: str, file_update: FileUpdate):
    update_data = {k: v for k, v in file_update.dict(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.files.update_one(
        {"_id": file_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Update project's updated_at
    file_doc = await db.files.find_one({"_id": file_id})
    if file_doc:
        await db.projects.update_one(
            {"_id": file_doc["project_id"]},
            {"$set": {"updated_at": update_data["updated_at"]}}
        )
    
    updated_file = await db.files.find_one({"_id": file_id})
    return File(**serialize_doc(updated_file))

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    file_doc = await db.files.find_one({"_id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    await db.files.delete_one({"_id": file_id})
    
    # Update project's updated_at
    await db.projects.update_one(
        {"_id": file_doc["project_id"]},
        {"$set": {"updated_at": datetime.utcnow()}}
    )
    
    return {"message": "File deleted successfully"}

# ==================== AI CHAT ENDPOINTS ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Create system message for code assistance
        system_message = "You are an expert programming assistant in a mobile IDE. Help users with code, debugging, explanations, and best practices. Be concise and practical."
        if request.context:
            system_message += f"\n\nCurrent code context:\n{request.context}"
        
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=request.session_id,
            system_message=system_message
        ).with_model(request.provider, request.model)
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Store chat history
        await db.chat_history.insert_one({
            "session_id": request.session_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        })
        
        await db.chat_history.insert_one({
            "session_id": request.session_id,
            "role": "assistant",
            "content": response,
            "timestamp": datetime.utcnow()
        })
        
        return ChatResponse(response=response, session_id=request.session_id)
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@api_router.get("/chat/history/{session_id}", response_model=List[ChatMessage])
async def get_chat_history(session_id: str, limit: int = 50):
    messages = await db.chat_history.find(
        {"session_id": session_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [ChatMessage(**msg) for msg in reversed(messages)]

# ==================== ENHANCED AI CHAT (CURSOR-LIKE) ====================

@api_router.post("/chat/enhanced", response_model=EnhancedChatResponse)
async def enhanced_chat(request: EnhancedChatRequest):
    """
    Enhanced AI chat with full project context and code generation capabilities.
    Similar to Cursor AI - can generate, refactor, and create files.
    """
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Build comprehensive context
        context_parts = []
        
        # Get project info
        project = await db.projects.find_one({"_id": request.project_id})
        if project:
            context_parts.append(f"Project: {project['name']}")
            if project.get('description'):
                context_parts.append(f"Description: {project['description']}")
        
        # Get all files in project for context
        if request.include_project_context:
            files = await db.files.find({"project_id": request.project_id}).to_list(100)
            if files:
                context_parts.append("\n=== Project Files ===")
                for f in files:
                    context_parts.append(f"\n--- {f['name']} ({f['language']}) ---")
                    # Limit context size - truncate large files
                    content = f['content'][:1000] if len(f['content']) > 1000 else f['content']
                    context_parts.append(content)
                    if len(f['content']) > 1000:
                        context_parts.append(f"\n... (truncated, {len(f['content'])} chars total)")
        
        # Get current file content if specified
        if request.current_file_id:
            current_file = await db.files.find_one({"_id": request.current_file_id})
            if current_file:
                context_parts.append(f"\n=== Currently Editing: {current_file['name']} ===")
                context_parts.append(current_file['content'])
        
        full_context = "\n".join(context_parts)
        
        # Create enhanced system message
        system_message = """You are an expert AI coding assistant integrated into a mobile IDE (like Cursor AI).

Your capabilities:
1. **Code Generation**: Generate complete, working code for any language
2. **File Creation**: Suggest creating new files when needed
3. **Code Refactoring**: Improve existing code while maintaining functionality
4. **Multi-file Operations**: Work across multiple files in a project
5. **Explanations**: Explain code concepts clearly

When suggesting code:
- Use proper markdown code blocks with language tags (```python, ```javascript, etc.)
- Be concise but complete
- Include comments for complex logic
- Follow best practices

When creating/editing files:
- Suggest the complete file content
- Use descriptive file names
- Include the file extension

Format your responses to be clear and actionable."""
        
        if full_context:
            system_message += f"\n\nCurrent project context:\n{full_context}"
        
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=request.session_id,
            system_message=system_message
        ).with_model(request.provider, request.model)
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Parse response for code blocks and suggested operations
        code_blocks = []
        suggested_operations = []
        
        # Extract code blocks from response
        import re
        code_block_pattern = r'```(\w+)?\n(.*?)```'
        matches = re.finditer(code_block_pattern, response, re.DOTALL)
        
        for match in matches:
            language = match.group(1) or 'text'
            code = match.group(2).strip()
            code_blocks.append({
                'language': language,
                'code': code,
                'can_apply': True
            })
        
        # Store chat history
        await db.chat_history.insert_one({
            "session_id": request.session_id,
            "project_id": request.project_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        })
        
        await db.chat_history.insert_one({
            "session_id": request.session_id,
            "project_id": request.project_id,
            "role": "assistant",
            "content": response,
            "code_blocks": code_blocks,
            "timestamp": datetime.utcnow()
        })
        
        return EnhancedChatResponse(
            response=response,
            session_id=request.session_id,
            suggested_operations=suggested_operations,
            code_blocks=code_blocks
        )
    
    except Exception as e:
        logger.error(f"Enhanced chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@api_router.post("/ai/apply-operation")
async def apply_ai_operation(request: ApplyAIOperationRequest):
    """
    Apply AI-suggested operations: create new file, edit existing file, or refactor code.
    """
    try:
        now = datetime.utcnow()
        
        if request.operation == 'create':
            # Create new file
            file_doc = {
                "_id": str(ObjectId()),
                "project_id": request.project_id,
                "name": request.file_name,
                "path": request.file_path,
                "content": request.content,
                "language": request.language,
                "created_at": now,
                "updated_at": now
            }
            await db.files.insert_one(file_doc)
            
            # Update project timestamp
            await db.projects.update_one(
                {"_id": request.project_id},
                {"$set": {"updated_at": now}}
            )
            
            return {
                "success": True,
                "message": "File created successfully",
                "file_id": file_doc["_id"],
                "operation": "create"
            }
        
        elif request.operation in ['edit', 'refactor']:
            # Update existing file
            if not request.file_id:
                raise HTTPException(status_code=400, detail="file_id required for edit/refactor operations")
            
            result = await db.files.update_one(
                {"_id": request.file_id},
                {"$set": {
                    "content": request.content,
                    "updated_at": now
                }}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="File not found")
            
            # Update project timestamp
            await db.projects.update_one(
                {"_id": request.project_id},
                {"$set": {"updated_at": now}}
            )
            
            return {
                "success": True,
                "message": f"File {request.operation}ed successfully",
                "file_id": request.file_id,
                "operation": request.operation
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid operation: {request.operation}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Apply AI operation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")

# ==================== CODE COMPLETION ENDPOINT ====================

@api_router.post("/code/complete", response_model=CodeCompletionResponse)
async def complete_code(request: CodeCompletionRequest):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Extract code before and after cursor
        code_before = request.code[:request.cursor_position]
        code_after = request.code[request.cursor_position:]
        
        # Create completion prompt
        system_message = f"You are a code completion engine. Complete the code at the cursor position. Return ONLY the completion text, no explanations. Language: {request.language}"
        
        prompt = f"Complete this code at the cursor (marked with <CURSOR>):\n\n{code_before}<CURSOR>{code_after}\n\nProvide 3 short completion suggestions, one per line:"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"completion-{uuid.uuid4()}",
            system_message=system_message
        ).with_model(request.provider, request.model)
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response into suggestions
        suggestions = [s.strip() for s in response.strip().split('\n') if s.strip()][:3]
        main_completion = suggestions[0] if suggestions else ""
        
        return CodeCompletionResponse(
            completion=main_completion,
            suggestions=suggestions
        )
    
    except Exception as e:
        logger.error(f"Code completion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

# ==================== CODE EXECUTION ENDPOINT ====================

@api_router.post("/code/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    try:
        import time
        import subprocess
        import tempfile
        
        start_time = time.time()
        
        if request.language == "python":
            # Execute Python code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                result = subprocess.run(
                    ['python3', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    input='\n'.join(request.inputs) if request.inputs else None
                )
                execution_time = time.time() - start_time
                
                if result.returncode == 0:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=None,
                        execution_time=execution_time
                    )
                else:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=result.stderr,
                        execution_time=execution_time
                    )
            finally:
                os.unlink(temp_file)
        
        elif request.language in ["javascript", "typescript"]:
            # Execute JavaScript/TypeScript code using Node.js
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                result = subprocess.run(
                    ['node', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    input='\n'.join(request.inputs) if request.inputs else None
                )
                execution_time = time.time() - start_time
                
                if result.returncode == 0:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=None,
                        execution_time=execution_time
                    )
                else:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=result.stderr,
                        execution_time=execution_time
                    )
            finally:
                os.unlink(temp_file)
        
        elif request.language == "php":
            # Execute PHP code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.php', delete=False) as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                result = subprocess.run(
                    ['php', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    input='\n'.join(request.inputs) if request.inputs else None
                )
                execution_time = time.time() - start_time
                
                if result.returncode == 0:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=None,
                        execution_time=execution_time
                    )
                else:
                    return CodeExecutionResponse(
                        output=result.stdout,
                        error=result.stderr,
                        execution_time=execution_time
                    )
            finally:
                os.unlink(temp_file)
        
        else:
            return CodeExecutionResponse(
                output="",
                error=f"Language '{request.language}' not supported for execution",
                execution_time=time.time() - start_time
            )
    
    except subprocess.TimeoutExpired:
        return CodeExecutionResponse(
            output="",
            error="Code execution timeout (10 seconds)",
            execution_time=10.0
        )
    except Exception as e:
        logger.error(f"Code execution error: {str(e)}")
        return CodeExecutionResponse(
            output="",
            error=f"Execution error: {str(e)}",
            execution_time=time.time() - start_time
        )

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Mobile IDE API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
