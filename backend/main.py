"""
Main entry point for the CRM backend application
"""
import json
from fetch import fetch_gmail_messages
from api import allocate_tasks_to_employees

def main():
    print("Starting CRM Backend...")
    
    # Fetch emails from Gmail
    print("Fetching emails from Gmail...")
    messages = fetch_gmail_messages()
    
    # Save messages to file
    with open('mails.json', 'w') as f:
        json.dump(messages, f, indent=2)
    
    print(f"Fetched {len(messages)} emails")
    
    # Allocate tasks to employees
    print("Allocating tasks to employees...")
    allocate_tasks_to_employees()
    
    print("CRM Backend processing complete!")

if __name__ == '__main__':
    main()
