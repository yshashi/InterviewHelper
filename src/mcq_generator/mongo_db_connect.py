import os
import json
import glob
from pathlib import Path
from pymongo import MongoClient
from tqdm import tqdm
import urllib.parse
from dotenv import load_dotenv

def get_username_password():
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
    if not os.environ.get("MONGO_USERNAME") and current_env_path.exists():
        load_dotenv(dotenv_path=current_env_path)
        print(f"Loaded .env from current directory: {current_env_path}")
    
    # Get the API key from environment
    username = os.environ.get("MONGO_USERNAME")
    password = os.environ.get("MONGO_PASSWORD")
    
    return username, password

def connect_to_mongodb():
    """Connect to MongoDB using the provided credentials"""
    # Replace with your actual password
    username, password = get_username_password()
    
    # URL encode the password to handle special characters
    # encoded_password = urllib.parse.quote_plus(password)
    
    # Construct the connection string
    connection_string = f"mongodb+srv://{username}:{password}@intevriwer-helper.naogb.mongodb.net/interview_helper_db?retryWrites=true&w=majority&appName=intevriwer-helper"
    try:
        # Connect to MongoDB
        client = MongoClient(connection_string)
        # Test the connection
        client.admin.command('ping')
        print("Connected successfully to MongoDB!")
        return client
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

def get_json_files(folder_path):
    """Retrieve all JSON files in the given folder."""
    # print(os.path.join(folder_path, "*.json"))
    # print(src\mcq_generator\questions\angular_angular-cli.json)
    return glob.glob(os.path.join(folder_path, "*.json"))

def load_json_data(filepath):
    """Load JSON data from a given file."""
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data
    except Exception as e:
        print(f"Error loading JSON file {filepath}: {e}")
        return None

def process_data(filename, data):
    """Assign question IDs if not present and format the data."""
    processed_data = []
    for i, question in enumerate(data, 1):
        question["question_id"] = question.get("question_id", i)
        question["source_file"] = filename  # Store file name for reference
        processed_data.append(question)
    return processed_data

def push_to_mongodb(collection, data, filename):
    """Insert or update data in MongoDB collection."""
    if not data:
        return

    try:
        # Check if the document with the given key exists
        existing_doc = collection.find_one({"key": filename})

        if existing_doc:
            # Compare existing questions with new questions
            existing_questions = existing_doc.get("questions", [])
            new_questions = data[0]["questions"]
            
            # Check if the data has actually changed
            if existing_questions != new_questions:
                # Update only if data has changed
                collection.update_one(
                    {"key": filename}, 
                    {"$set": {"questions": new_questions}}
                )
                print(f"Updated existing document for {filename} in MongoDB - Data was different.")
            else:
                print(f"No update needed for {filename} - Data is identical.")
        else:
            # Insert new document
            collection.insert_one(data[0])
            print(f"Inserted new document for {filename} into MongoDB.")
    
    except Exception as e:
        print(f"Error inserting/updating data for {filename}: {e}")

def main(folder_path):
    """Main function to process and upload all JSON files in a folder."""
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["interview_helper_db"]
    collection = db["Mcqs"]
    # print(client)

    # Get all JSON files in the folder
    json_files = get_json_files(folder_path)

    # print(json_files)
    if not json_files:
        print(len(json_files))
        print("No JSON files found in the folder.")
        return

    print(f"Found {len(json_files)} JSON files to process.")

    # Process each file
    for json_file in json_files:
        filename = os.path.basename(json_file).replace('.json','')
        json_data = load_json_data(json_file)

        if json_data:
            p_data = process_data(filename, json_data)
            output_data = [{"key":filename,"questions":p_data}]
            # print("processed data:", processed_data)
            
            push_to_mongodb(collection,output_data, filename)
            # break

    # Close MongoDB connection
    client.close()
    print("MongoDB connection closed.")


if __name__ == "__main__":
    # main(r'src\mcq_generator\topic_wise_full_length_questions')
    main(r'src\mcq_generator\questions')