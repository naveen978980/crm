from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Load data files
def load_json(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/api/employees', methods=['GET'])
def get_employees():
    employees = load_json('employees.json')
    return jsonify(employees)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = load_json('tasks.json')
    return jsonify(tasks)

@app.route('/api/mails', methods=['GET'])
def get_mails():
    mails = load_json('mails.json')
    return jsonify(mails)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
