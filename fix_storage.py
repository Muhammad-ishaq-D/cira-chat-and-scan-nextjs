import os
import re

src_dir = r"c:\Users\Admin\Desktop\INSTLY Technology\AskCira\v3\cira-chat-and-scan-nextjs\src"

replacements = {
    r"\bsessionStorage\.getItem": "globalThis?.sessionStorage?.getItem",
    r"\bsessionStorage\.setItem": "globalThis?.sessionStorage?.setItem",
    r"\bsessionStorage\.removeItem": "globalThis?.sessionStorage?.removeItem",
    r"\blocalStorage\.getItem": "globalThis?.localStorage?.getItem",
    r"\blocalStorage\.setItem": "globalThis?.localStorage?.setItem",
    r"\blocalStorage\.removeItem": "globalThis?.localStorage?.removeItem",
    r"\[sessionStorage,\s*localStorage\]": "[globalThis?.sessionStorage, globalThis?.localStorage]"
}

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            process_file(os.path.join(root, file))

print("Storage replacements complete.")
