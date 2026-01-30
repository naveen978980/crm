"""
Test cases for employee allocation logic
"""
import unittest
from api import allocate_tasks_to_employees, load_employees, load_tasks

class TestAllocation(unittest.TestCase):
    
    def test_allocate_tasks(self):
        """Test basic task allocation"""
        result = allocate_tasks_to_employees()
        self.assertIsInstance(result, list)
    
    def test_load_employees(self):
        """Test loading employees"""
        employees = load_employees()
        self.assertIsInstance(employees, list)
    
    def test_load_tasks(self):
        """Test loading tasks"""
        tasks = load_tasks()
        self.assertIsInstance(tasks, list)

if __name__ == '__main__':
    unittest.main()
