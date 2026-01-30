"""
API logic for employee allocation and task management
"""
import json
import random

def load_employees():
    """Load employees from JSON file"""
    try:
        with open('employees.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_tasks():
    """Load tasks from JSON file"""
    try:
        with open('tasks.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_tasks(tasks):
    """Save tasks to JSON file"""
    with open('tasks.json', 'w') as f:
        json.dump(tasks, f, indent=2)

def allocate_tasks_to_employees():
    """Allocate unassigned tasks to available employees"""
    employees = load_employees()
    tasks = load_tasks()
    
    available_employees = [emp for emp in employees if emp.get('available', True)]
    unassigned_tasks = [task for task in tasks if not task.get('assigned_to')]
    
    for task in unassigned_tasks:
        if available_employees:
            # Simple round-robin allocation
            employee = available_employees[0]
            task['assigned_to'] = employee['id']
            task['assigned_name'] = employee['name']
            task['status'] = 'assigned'
            
            # Rotate employees list
            available_employees.append(available_employees.pop(0))
    
    save_tasks(tasks)
    print(f"Allocated {len(unassigned_tasks)} tasks")
    return tasks

if __name__ == '__main__':
    allocate_tasks_to_employees()
