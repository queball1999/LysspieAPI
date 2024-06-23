import requests
import time

BASE_URL = "http://172.31.80.1:5000"  # Change this if your Flask app is running on a different address

def test_join(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "join", "username": username})
    print(f"Join Response: {response.text}")

def test_leave(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "leave", "username": username})
    print(f"Leave Response: {response.text}")

def test_skip():
    response = requests.get(f"{BASE_URL}/queue", params={"action": "skip"})
    print(f"Skip Response: {response.text}")

def test_position(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "position", "username": username})
    print(f"Position Response: {response.text}")

def test_ninelives(username):
    response = requests.get(f"{BASE_URL}/ninelives", params={"username": username})
    print(f"NineLives Response: {response.text}")

if __name__ == "__main__":
    # Test cases
    test_username = "testuser"
    
    print("Testing join:")
    test_join(test_username)
    time.sleep(5)
    
    print("\nTesting position:")
    test_position(test_username)
    time.sleep(5)
    
    print("\nTesting leave:")
    test_leave(test_username)
    time.sleep(5)
    
    print("\nTesting skip:")
    test_skip()
    time.sleep(5)
    
    print("\nTesting nine lives:")
    test_ninelives(test_username)
