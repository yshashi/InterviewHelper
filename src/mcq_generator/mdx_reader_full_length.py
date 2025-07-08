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
import tiktoken

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
        self.model = "gpt-4o-2024-08-06"
    
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
        """
        Save questions to a JSON file. If file exists, append new questions.
        
        Args:
            questions: List of question dictionaries
            filename: Name of the JSON file to save to
        """
        existing_questions = []
        
        # Try to read existing file if it exists
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_questions = json.load(f)
            except json.JSONDecodeError:
                print(f"Warning: Could not read existing file {filename}. Creating new file.")
        
        print("existing_questions:",len(existing_questions))
        print("questions:",len(questions))
        
        # Combine existing and new questions
        all_questions = existing_questions + questions
        print("all questions:",len(all_questions))
        
        # Remove duplicates based on question text
        seen = set()
        unique_questions = []
        for q in all_questions:
            q_text = q.get('question', '')
            if q_text not in seen:
                seen.add(q_text)
                unique_questions.append(q)
        
        print("unique_questions:",len(unique_questions))
        
        # Save combined questions to file
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(unique_questions, f, indent=2, ensure_ascii=False)
            print(f"Successfully saved {len(unique_questions)} questions to {filename}")
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

# Function to convert file path to output JSON name
def convert_to_json_name(file_path):
    path = Path(file_path)  # Get absolute path
    parents = list(path.parents)[:-1]  # Get all parent directories
    
    # Remove "pages" if it exists in the path
    parent_names = [p.name for p in reversed(parents) if p.name != "pages" and  p.name != ".."]
    
    base_name = path.stem  # Get file name without extension
    
    # Construct the output name dynamically
    return f"{'_'.join(parent_names)}_{base_name}.json"


def count_tokens(text, model="gpt-4"):
    # Get the encoding for the specified model
    encoding = tiktoken.encoding_for_model(model)
    # Encode the text into tokens
    tokens = encoding.encode(text)
    return len(tokens)


def main():
    # Set the directory containing your MDX files
    mdx_directory = "..\pages"  # Change this to your local directory
    api_key = load_api_key()
    generator = MCQGenerator(api_key)
    reader = LocalMDXReader(mdx_directory)    # Get all MDX files and their content
    mdx_files_data = reader.process_all_mdx_files()
    counter = 0
    
    print("\n==== MDX File Details ====")
    # print(mdx_files_data)
    output_string = ""
    for index,file_data in tqdm(enumerate(mdx_files_data)):
        # print(file_data['content'])
        output_filename = convert_to_json_name(file_data['path'])
        print(counter)
        if "react" in output_filename:
            output_string += "\n\n" + output_filename + "\n\n" + file_data['content']
            counter += 1
            
            if counter !=0  and counter%1==10:
                # questions = generator.generate_mcqs(output_string, num_questions=9)
                print(count_tokens(output_string))
                output_string = ""
                # if questions:
                    # for i, q in enumerate(questions, 1):
                        # print(f"\nQuestion {i}: {q['question']}")
                        # for option, text in q['options'].items():
                            # print(f"  {option}. {text}")
                        # print(f"Correct answer: {q['correct_answer']}")

                    # generator.save_to_file(questions, f"topic_wise_full_length_questions/react.json")
            
            # if counter == 10:
            #     break






    # print(counter)
    # print(count_tokens(output_string))


    # counter = 0
    # for index,file_data in tqdm(enumerate(mdx_files_data)):
    #     if counter%20==0 and counter !=0:
    #         print("Sleeping")
    #         time.sleep(60) 
    #     # print(f"\nFile: {file_data['path']}")
    #     output_filename = convert_to_json_name(file_data['path'])
    #     # print(f"Metadata: {file_data['metadata']}")
    #     if not os.path.exists(f"questions/{output_filename}"):
    #         print("path doesnot exists")
    #         print(f"questions/{output_filename}")
    #         if file_data['content']:
    #             print(file_data['content'])
    #             questions = generator.generate_mcqs(file_data['content'], num_questions=10)
    #             counter+=1
        
    #         # Print the generated questions
    #             if questions:
    #                 print("\nGenerated MCQs:")
    #                 for i, q in enumerate(questions, 1):
    #                     print(f"\nQuestion {i}: {q['question']}")
    #                     for option, text in q['options'].items():
    #                         print(f"  {option}. {text}")
    #                     print(f"Correct answer: {q['correct_answer']}")
    #                 generator.save_to_file(questions, f"questions/{output_filename}")

if __name__ == "__main__":
    main()