import os
import glob
import re
import json
from typing import List, Dict, Any
from openai import OpenAI
from pathlib import Path
from tqdm import tqdm
from dotenv import load_dotenv
import time


class LocalMDXReader:
    def __init__(self, directory_path="pages"):
        """
        Initialize the reader with the directory path containing MDX files
        
        Args:
            directory_path (str): Path to the directory containing MDX files
        """
        self.directory_path = directory_path
    
    def get_mdx_files(self):
        """
        Get all MDX files from the specified directory and its subdirectories
        
        Returns:
            list: List of file paths with .mdx extension
        """
        # Get all .mdx files in the directory and subdirectories
        mdx_pattern = os.path.join(self.directory_path, "**", "*.mdx")
        mdx_files = glob.glob(mdx_pattern, recursive=True)
        
        return mdx_files
    
    def parse_frontmatter(self, content):
        """
        Parse frontmatter from MDX content
        
        Args:
            content (str): Content of the MDX file
            
        Returns:
            tuple: (metadata, content_without_frontmatter)
        """
        # Check if content starts with frontmatter delimiter
        if not content.startswith('---'):
            return {}, content
        
        # Find the second frontmatter delimiter
        parts = content.split('---', 2)
        if len(parts) < 3:
            return {}, content
        
        # Extract frontmatter and content
        frontmatter_str = parts[1].strip()
        content_without_frontmatter = parts[2].strip()
        
        # Parse frontmatter into dictionary
        metadata = {}
        for line in frontmatter_str.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip()
        
        return metadata, content_without_frontmatter
    
    def read_mdx_file(self, file_path):
        """
        Read content of a specific MDX file
        
        Args:
            file_path (str): Path to the MDX file
            
        Returns:
            dict: Dictionary containing the metadata and content of the MDX file
        """
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Parse frontmatter and content
            metadata, content_without_frontmatter = self.parse_frontmatter(content)
            
            return {
                'path': file_path,
                'filename': os.path.basename(file_path),
                'metadata': metadata,
                'content': content_without_frontmatter,
                'raw_content': content
            }
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return {
                'path': file_path,
                'filename': os.path.basename(file_path),
                'metadata': {},
                'content': None,
                'raw_content': None,
                'error': str(e)
            }
    
    def process_all_mdx_files(self):
        """
        Process all MDX files in the directory
        
        Returns:
            list: List of dictionaries containing file information and content
        """
        mdx_files = self.get_mdx_files()
        result = []
        
        print(f"Found {len(mdx_files)} MDX files in {self.directory_path}")
        
        for file_path in mdx_files:
            print(f"Processing {file_path}...")
            file_data = self.read_mdx_file(file_path)
            # print(file_data)
            # break
            result.append(file_data)
        
        return result
    
    def extract_links(self, mdx_files_data):
        """
        Extract all links from the MDX files
        
        Args:
            mdx_files_data (list): List of dictionaries containing file information and content
            
        Returns:
            dict: Dictionary mapping file paths to their links
        """
        links_by_file = {}
        
        # Regular expression to find markdown and HTML links
        markdown_link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        html_link_pattern = r'<a\s+[^>]*href=["\'](.*?)["\'][^>]*>(.*?)<\/a>'
        
        for file_data in mdx_files_data:
            file_path = file_data['path']
            content = file_data['content']
            
            if content is None:
                links_by_file[file_path] = []
                continue
            
            # Find markdown links
            markdown_links = re.findall(markdown_link_pattern, content)
            
            # Find HTML links
            html_links = re.findall(html_link_pattern, content)
            
            # Combine links
            all_links = [
                {'text': text, 'url': url} for text, url in markdown_links
            ] + [
                {'text': text, 'url': url} for url, text in html_links
            ]
            
            links_by_file[file_path] = all_links
        
        return links_by_file
    
class MCQGenerator:
    def __init__(self, api_key: str):
        """Initialize the MCQ Generator with your OpenAI API key."""
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4"
    
    def generate_mcqs(self, text: str, num_questions: int = 5) -> List[Dict[str, Any]]:
        """
        Generate multiple-choice questions from the provided text.
        
        Args:
            text: The text to generate questions from
            num_questions: Number of questions to generate (default: 5)
            
        Returns:
            A list of dictionaries, each containing a question, options, and the correct answer
        """
        prompt = f"""
        Generate {num_questions} multiple-choice questions based on the following text. 
        For each question, provide four options (A, B, C, D) with exactly one correct answer.
        
        Format the output as a JSON array of objects with the following structure:
        [
            {{
                "question": "The question text",
                "options": {{
                    "A": "First option",
                    "B": "Second option",
                    "C": "Third option",
                    "D": "Fourth option"
                }},
                "correct_answer": "The letter of the correct option (A, B, C, or D)"
            }},
            ...
        ]
        
        Here is the text:
        {text}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
            )
            
            # Extract the JSON content from the response
            content = response.choices[0].message.content
            
            # Parse the JSON string into a Python object
            questions = json.loads(content)
            
            return questions
            
        except Exception as e:
            print(f"Error generating MCQs: {e}")
            return []
    
    def save_to_file(self, questions: List[Dict[str, Any]], filename: str = "mcqs.json") -> None:
        """Save the generated questions to JSON files in both src and public directories."""
        try:
            src_path = os.path.join(os.path.dirname(__file__), "questions", os.path.basename(filename))
            os.makedirs(os.path.dirname(src_path), exist_ok=True)
            with open(src_path, 'w') as f:
                json.dump(questions, f, indent=2)
            print(f"MCQs saved to {src_path}")
            
            public_dir = os.path.join(os.path.dirname(__file__), "../..", "public", "mcq_generator", "questions")
            os.makedirs(public_dir, exist_ok=True)
            public_path = os.path.join(public_dir, os.path.basename(filename))
            with open(public_path, 'w') as f:
                json.dump(questions, f, indent=2)
            print(f"MCQs saved to {public_path}")
        except Exception as e:
            print(f"Error saving to file: {e}")

def load_api_key():
    """
    Load OpenAI API key from .env file in parent directory or current directory
    """
    # First try to load from parent directory
    parent_env_path = Path(__file__).parent.parent.parent / '.env'
    if parent_env_path.exists():
        load_dotenv(dotenv_path=parent_env_path)
        print(f"Loaded .env from parent directory: {parent_env_path}")
    
    # If not found in parent directory, try current directory
    current_env_path = Path(__file__).parent / '.env'
    if not os.environ.get("OPENAI_API_KEY") and current_env_path.exists():
        load_dotenv(dotenv_path=current_env_path)
        print(f"Loaded .env from current directory: {current_env_path}")
    
    # Get the API key from environment
    api_key = os.environ.get("OPENAI_API_KEY")
    
    return api_key


def main():
    # Set the directory containing your MDX files
    mdx_directory = "..\pages"  # Change this to your local directory
    api_key = load_api_key()
    generator = MCQGenerator(api_key)
    reader = LocalMDXReader(mdx_directory)    # Get all MDX files and their content
    mdx_files_data = reader.process_all_mdx_files()
    
    print("\n==== MDX File Details ====")
    # print(mdx_files_data)

    for index,file_data in tqdm(enumerate(mdx_files_data)):
        if index%20==0 and index !=0:
            print("Sleeping")
            time.sleep(60) 
        print(f"\nFile: {file_data['path']}")
        print(f"Metadata: {file_data['metadata']}")
        if file_data['content']:
            # print(mcqs)
            questions = generator.generate_mcqs(file_data['content'], num_questions=10)
    
    # Print the generated questions
            if questions:
                print("\nGenerated MCQs:")
                for i, q in enumerate(questions, 1):
                    print(f"\nQuestion {i}: {q['question']}")
                    for option, text in q['options'].items():
                        print(f"  {option}. {text}")
                    print(f"Correct answer: {q['correct_answer']}")
            generator.save_to_file(questions, f"{Path(file_data['path']).stem}.json")

if __name__ == "__main__":
    main()