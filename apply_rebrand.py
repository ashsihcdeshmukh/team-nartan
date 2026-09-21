#!/usr/bin/env python3
import os
import re

BASE_DIR = '/Users/ashish/team-nartan'

def rebrand_file(filepath):
    if not os.path.isfile(filepath):
        return
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original = content

    # Specific replacements
    content = content.replace('Creative Edge Dance Studio', 'Team Nartan Dance Studio')
    content = content.replace('Creative Edge Studio Manager', 'Team Nartan Studio Manager')
    content = content.replace('Creative Edge Studio', 'Team Nartan Studio')
    content = content.replace('Creative Edge', 'Team Nartan')
    content = content.replace('creative-edge-studio-app', 'team-nartan-student')
    content = content.replace('creative-edge-admission', 'team-nartan-admission')
    content = content.replace('creative-edge-manager', 'team-nartan-manager')
    content = content.replace('creative-edge-backend', 'team-nartan-backend')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Rebranded: {filepath}")

# Rebrand core html and js files
target_files = [
    f"{BASE_DIR}/app/index.html",
    f"{BASE_DIR}/manager/index.html",
    f"{BASE_DIR}/admission/index.html",
    f"{BASE_DIR}/app/tutorial.html",
    f"{BASE_DIR}/admission/tutorial.html",
    f"{BASE_DIR}/app/manifest.json",
    f"{BASE_DIR}/app/manifest.webmanifest",
    f"{BASE_DIR}/routes/students.js",
    f"{BASE_DIR}/routes/payments.js",
    f"{BASE_DIR}/routes/reminders.js",
    f"{BASE_DIR}/routes/telegram.js",
    f"{BASE_DIR}/routes/chatbot.js"
]

for tf in target_files:
    rebrand_file(tf)

print("✅ Text rebranding complete.")
