#!/usr/bin/env python3
"""
Mobile IDE Backend API Test Suite
Tests all backend endpoints for the Mobile IDE application
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://pocket-cursor.preview.emergentagent.com/api"

class MobileIDEAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_project_id = None
        self.test_file_id = None
        self.test_session_id = str(uuid.uuid4())
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message="", response=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_create_project(self):
        """Test project creation"""
        try:
            project_data = {
                "name": "React Native Calculator",
                "description": "A mobile calculator app with advanced features"
            }
            
            response = self.session.post(
                f"{self.base_url}/projects",
                json=project_data
            )
            
            if response.status_code == 200:
                data = response.json()
                # Handle both 'id' and '_id' fields
                project_id = data.get("id") or data.get("_id")
                if project_id and data["name"] == project_data["name"]:
                    self.test_project_id = project_id
                    self.log_result("Create Project", True, f"Created project with ID: {self.test_project_id}")
                    return True
                else:
                    self.log_result("Create Project", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Create Project", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Create Project", False, f"Exception: {str(e)}")
            return False

    def test_get_projects(self):
        """Test getting all projects"""
        try:
            response = self.session.get(f"{self.base_url}/projects")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    project_found = any(p.get("id") == self.test_project_id for p in data)
                    if project_found:
                        self.log_result("Get Projects", True, f"Found {len(data)} projects including test project")
                        return True
                    else:
                        self.log_result("Get Projects", False, "Test project not found in list")
                        return False
                else:
                    self.log_result("Get Projects", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_result("Get Projects", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Get Projects", False, f"Exception: {str(e)}")
            return False

    def test_get_project_by_id(self):
        """Test getting project by ID"""
        if not self.test_project_id:
            self.log_result("Get Project by ID", False, "No test project ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.test_project_id:
                    self.log_result("Get Project by ID", True, f"Retrieved project: {data['name']}")
                    return True
                else:
                    self.log_result("Get Project by ID", False, f"ID mismatch: {data}")
                    return False
            else:
                self.log_result("Get Project by ID", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Get Project by ID", False, f"Exception: {str(e)}")
            return False

    def test_create_file(self):
        """Test file creation"""
        if not self.test_project_id:
            self.log_result("Create File", False, "No test project ID available")
            return False
            
        try:
            file_data = {
                "project_id": self.test_project_id,
                "name": "Calculator.js",
                "path": "/src/components/Calculator.js",
                "content": "import React, { useState } from 'react';\n\nconst Calculator = () => {\n  const [display, setDisplay] = useState('0');\n  \n  return (\n    <div className=\"calculator\">\n      <div className=\"display\">{display}</div>\n    </div>\n  );\n};\n\nexport default Calculator;",
                "language": "javascript"
            }
            
            response = self.session.post(
                f"{self.base_url}/files",
                json=file_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == file_data["name"]:
                    self.test_file_id = data["id"]
                    self.log_result("Create File", True, f"Created file with ID: {self.test_file_id}")
                    return True
                else:
                    self.log_result("Create File", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Create File", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Create File", False, f"Exception: {str(e)}")
            return False

    def test_get_project_files(self):
        """Test getting files for a project"""
        if not self.test_project_id:
            self.log_result("Get Project Files", False, "No test project ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/files/project/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    file_found = any(f.get("id") == self.test_file_id for f in data)
                    if file_found:
                        self.log_result("Get Project Files", True, f"Found {len(data)} files including test file")
                        return True
                    else:
                        self.log_result("Get Project Files", False, "Test file not found in project files")
                        return False
                else:
                    self.log_result("Get Project Files", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_result("Get Project Files", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Get Project Files", False, f"Exception: {str(e)}")
            return False

    def test_get_file_by_id(self):
        """Test getting file by ID"""
        if not self.test_file_id:
            self.log_result("Get File by ID", False, "No test file ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/files/{self.test_file_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.test_file_id:
                    self.log_result("Get File by ID", True, f"Retrieved file: {data['name']}")
                    return True
                else:
                    self.log_result("Get File by ID", False, f"ID mismatch: {data}")
                    return False
            else:
                self.log_result("Get File by ID", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Get File by ID", False, f"Exception: {str(e)}")
            return False

    def test_update_file(self):
        """Test file update"""
        if not self.test_file_id:
            self.log_result("Update File", False, "No test file ID available")
            return False
            
        try:
            update_data = {
                "content": "import React, { useState } from 'react';\n\nconst Calculator = () => {\n  const [display, setDisplay] = useState('0');\n  const [operation, setOperation] = useState(null);\n  \n  const handleNumber = (num) => {\n    setDisplay(display === '0' ? num : display + num);\n  };\n  \n  return (\n    <div className=\"calculator\">\n      <div className=\"display\">{display}</div>\n      <button onClick={() => handleNumber('1')}>1</button>\n    </div>\n  );\n};\n\nexport default Calculator;"
            }
            
            response = self.session.put(
                f"{self.base_url}/files/{self.test_file_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "handleNumber" in data.get("content", ""):
                    self.log_result("Update File", True, "File content updated successfully")
                    return True
                else:
                    self.log_result("Update File", False, "Content not updated properly")
                    return False
            else:
                self.log_result("Update File", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Update File", False, f"Exception: {str(e)}")
            return False

    def test_ai_chat_openai(self):
        """Test AI chat with OpenAI"""
        try:
            chat_data = {
                "message": "How do I implement a calculator function in JavaScript?",
                "session_id": self.test_session_id,
                "provider": "openai",
                "model": "gpt-5.2",
                "context": "function add(a, b) { return a + b; }"
            }
            
            response = self.session.post(
                f"{self.base_url}/chat",
                json=chat_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and data["session_id"] == self.test_session_id:
                    self.log_result("AI Chat (OpenAI)", True, f"Got response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_result("AI Chat (OpenAI)", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("AI Chat (OpenAI)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("AI Chat (OpenAI)", False, f"Exception: {str(e)}")
            return False

    def test_ai_chat_anthropic(self):
        """Test AI chat with Anthropic"""
        try:
            chat_data = {
                "message": "Explain React hooks in simple terms",
                "session_id": self.test_session_id,
                "provider": "anthropic",
                "model": "claude-sonnet-4-5-20250929"
            }
            
            response = self.session.post(
                f"{self.base_url}/chat",
                json=chat_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and data["session_id"] == self.test_session_id:
                    self.log_result("AI Chat (Anthropic)", True, f"Got response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_result("AI Chat (Anthropic)", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("AI Chat (Anthropic)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("AI Chat (Anthropic)", False, f"Exception: {str(e)}")
            return False

    def test_ai_chat_gemini(self):
        """Test AI chat with Gemini"""
        try:
            chat_data = {
                "message": "What are the best practices for mobile app development?",
                "session_id": self.test_session_id,
                "provider": "gemini",
                "model": "gemini-3-flash-preview"
            }
            
            response = self.session.post(
                f"{self.base_url}/chat",
                json=chat_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and data["session_id"] == self.test_session_id:
                    self.log_result("AI Chat (Gemini)", True, f"Got response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_result("AI Chat (Gemini)", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("AI Chat (Gemini)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("AI Chat (Gemini)", False, f"Exception: {str(e)}")
            return False

    def test_chat_history(self):
        """Test getting chat history"""
        try:
            response = self.session.get(f"{self.base_url}/chat/history/{self.test_session_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("Chat History", True, f"Retrieved {len(data)} chat messages")
                    return True
                else:
                    self.log_result("Chat History", False, f"Expected non-empty list, got: {data}")
                    return False
            else:
                self.log_result("Chat History", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Chat History", False, f"Exception: {str(e)}")
            return False

    def test_code_execution_python(self):
        """Test Python code execution"""
        try:
            code_data = {
                "code": "print('Hello from Python!')\nresult = 2 + 3\nprint(f'2 + 3 = {result}')",
                "language": "python",
                "inputs": []
            }
            
            response = self.session.post(
                f"{self.base_url}/code/execute",
                json=code_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "output" in data and "Hello from Python!" in data["output"]:
                    self.log_result("Code Execution (Python)", True, f"Output: {data['output'].strip()}")
                    return True
                else:
                    self.log_result("Code Execution (Python)", False, f"Unexpected output: {data}")
                    return False
            else:
                self.log_result("Code Execution (Python)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Code Execution (Python)", False, f"Exception: {str(e)}")
            return False

    def test_code_execution_javascript(self):
        """Test JavaScript code execution"""
        try:
            code_data = {
                "code": "console.log('Hello from JavaScript!');\nconst result = 5 * 4;\nconsole.log(`5 * 4 = ${result}`);",
                "language": "javascript",
                "inputs": []
            }
            
            response = self.session.post(
                f"{self.base_url}/code/execute",
                json=code_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "output" in data and "Hello from JavaScript!" in data["output"]:
                    self.log_result("Code Execution (JavaScript)", True, f"Output: {data['output'].strip()}")
                    return True
                else:
                    self.log_result("Code Execution (JavaScript)", False, f"Unexpected output: {data}")
                    return False
            else:
                self.log_result("Code Execution (JavaScript)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Code Execution (JavaScript)", False, f"Exception: {str(e)}")
            return False

    def test_code_execution_php(self):
        """Test PHP code execution"""
        try:
            code_data = {
                "code": "<?php\necho 'Hello from PHP!' . PHP_EOL;\n$result = 10 / 2;\necho '10 / 2 = ' . $result . PHP_EOL;\n?>",
                "language": "php",
                "inputs": []
            }
            
            response = self.session.post(
                f"{self.base_url}/code/execute",
                json=code_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "output" in data and "Hello from PHP!" in data["output"]:
                    self.log_result("Code Execution (PHP)", True, f"Output: {data['output'].strip()}")
                    return True
                else:
                    self.log_result("Code Execution (PHP)", False, f"Unexpected output: {data}")
                    return False
            else:
                self.log_result("Code Execution (PHP)", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Code Execution (PHP)", False, f"Exception: {str(e)}")
            return False

    def test_code_completion(self):
        """Test code completion"""
        try:
            completion_data = {
                "code": "function calculateSum(a, b) {\n  return ",
                "cursor_position": 35,
                "language": "javascript",
                "provider": "openai",
                "model": "gpt-5.2"
            }
            
            response = self.session.post(
                f"{self.base_url}/code/complete",
                json=completion_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "completion" in data and "suggestions" in data:
                    self.log_result("Code Completion", True, f"Got completion: {data['completion']}")
                    return True
                else:
                    self.log_result("Code Completion", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Code Completion", False, f"HTTP {response.status_code}", response)
                return False
        except Exception as e:
            self.log_result("Code Completion", False, f"Exception: {str(e)}")
            return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test invalid project ID
            response = self.session.get(f"{self.base_url}/projects/invalid-id")
            if response.status_code == 404:
                self.log_result("Error Handling (Invalid Project)", True, "Correctly returned 404 for invalid project ID")
            else:
                self.log_result("Error Handling (Invalid Project)", False, f"Expected 404, got {response.status_code}")
                return False

            # Test invalid file ID
            response = self.session.get(f"{self.base_url}/files/invalid-id")
            if response.status_code == 404:
                self.log_result("Error Handling (Invalid File)", True, "Correctly returned 404 for invalid file ID")
            else:
                self.log_result("Error Handling (Invalid File)", False, f"Expected 404, got {response.status_code}")
                return False

            return True
        except Exception as e:
            self.log_result("Error Handling", False, f"Exception: {str(e)}")
            return False

    def cleanup(self):
        """Clean up test data"""
        try:
            # Delete test file
            if self.test_file_id:
                response = self.session.delete(f"{self.base_url}/files/{self.test_file_id}")
                if response.status_code == 200:
                    self.log_result("Cleanup (Delete File)", True, "Test file deleted")
                else:
                    self.log_result("Cleanup (Delete File)", False, f"HTTP {response.status_code}", response)

            # Delete test project
            if self.test_project_id:
                response = self.session.delete(f"{self.base_url}/projects/{self.test_project_id}")
                if response.status_code == 200:
                    self.log_result("Cleanup (Delete Project)", True, "Test project deleted")
                else:
                    self.log_result("Cleanup (Delete Project)", False, f"HTTP {response.status_code}", response)

        except Exception as e:
            self.log_result("Cleanup", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("MOBILE IDE BACKEND API TEST SUITE")
        print("=" * 60)
        print(f"Testing backend at: {self.base_url}")
        print()

        # Basic API tests
        self.test_health_check()
        
        # Project management tests
        self.test_create_project()
        self.test_get_projects()
        self.test_get_project_by_id()
        
        # File management tests
        self.test_create_file()
        self.test_get_project_files()
        self.test_get_file_by_id()
        self.test_update_file()
        
        # AI integration tests
        self.test_ai_chat_openai()
        self.test_ai_chat_anthropic()
        self.test_ai_chat_gemini()
        self.test_chat_history()
        
        # Code execution tests
        self.test_code_execution_python()
        self.test_code_execution_javascript()
        self.test_code_execution_php()
        
        # Code completion test
        self.test_code_completion()
        
        # Error handling tests
        self.test_error_handling()
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Total: {self.results['passed'] + self.results['failed']}")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        print("=" * 60)
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = MobileIDEAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)