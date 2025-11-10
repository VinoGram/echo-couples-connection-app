#!/usr/bin/env python3
"""
Simple test script to verify ML service connectivity
"""
import requests
import json

ML_SERVICE_URL = "http://localhost:8000"

def test_ml_service():
    print("Testing ML Service connectivity...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    # Test 2: Adaptive questions
    try:
        response = requests.post(f"{ML_SERVICE_URL}/questions/adaptive", 
                               json={"user_id": "test_user", "count": 3}, 
                               timeout=10)
        print(f"Adaptive questions: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Questions received: {len(data.get('questions', []))}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Adaptive questions failed: {e}")
    
    # Test 3: Truth or Dare
    try:
        response = requests.get(f"{ML_SERVICE_URL}/games/truth-or-dare", timeout=10)
        print(f"Truth or Dare: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Truth questions: {len(data.get('truth_questions', []))}")
            print(f"Dare questions: {len(data.get('dare_questions', []))}")
    except Exception as e:
        print(f"Truth or Dare failed: {e}")
    
    return True

if __name__ == "__main__":
    test_ml_service()