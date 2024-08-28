import requests
import time

BASE_URL = "https://api.domain.com/api"  # Change this if your Flask app is running on a different address
API_KEY = 'q-'  # Replace with your actual API key
#JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMDk5NzUxMywianRpIjoiM2QyODM5ZDMtZTc0NS00ZWQ1LWFhYzMtMTUxNGFjNzhiYWIwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6ImFkbWluQGV4YW1wbGUuY29tIiwibmJmIjoxNzIwOTk3NTEzLCJjc3JmIjoiMGZhYThlZjktMDgzNS00NDAwLThhNDAtYzVmNzI4ZmE1NGQwIiwiZXhwIjoxNzIxMDAxMTEzfQ.GjBnEix7eRS4Wfbqq5tm7dIZu4oUSC1bl2laP41KEEw'  # Replace with your actual JWT token

HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def test_join(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "join", "username": username}, headers=HEADERS)
    print('JOIN:', response)
    print(f"Join Response: {response.text}")

def test_leave(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "leave", "username": username}, headers=HEADERS)
    print(f"Leave Response: {response.text}")

def test_skip():
    response = requests.get(f"{BASE_URL}/queue", params={"action": "skip"})
    print(f"Skip Response: {response.text}")

def test_position(username):
    response = requests.get(f"{BASE_URL}/queue", params={"action": "position", "username": username}, headers=HEADERS)
    print(f"Position Response: {response.text}")

def test_ninelives(username):
    response = requests.get(f"{BASE_URL}/ninelives", params={"username": username}, headers=HEADERS)
    print(f"NineLives Response: {response.text}")

if __name__ == "__main__":
    # Test cases
    
    usernames = [
        "PixelCrafter",
        "LunaWhisper",
        "QuantumCoder",
        "VividEchoes",
        "StarryTraveler",
        "MysticWanderer",
        "EmberPulse",
        "SilverShadow",
        "CosmicVoyager",
        "NexusNerd",
        "RadiantScribe",
        "MidnightMuser",
        "BlazeTrail",
        "HorizonSeeker",
        "CrystalCipher",
        "VelvetEcho",
        "NovaStrider",
        "UrbanNomad",
        "WhisperingWinds",
        "NeonWanderlust",
        "EmberVeil",
        "ShadowCrafter",
        "AzureDreamer",
        "RogueBard",
        "TwilightDrifter"
    ]

    
    for user in usernames:
        print("Testing join:")
        test_join(user)
        
        print("\nTesting position:")
        test_position(user)
        time.sleep(1)
        """
        print("\nTesting skip:")
        test_skip()
        time.sleep(1)
        """
        #print("\nTesting leave:")
        #test_leave(user)
    
        print("\nTesting nine lives:")
        test_ninelives(user)
    