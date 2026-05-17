import os
import re

packs_dir = r"c:\Users\lpfon\Downloads\animus\animus-system\packs\_source"

def scan_dir(path):
    matches = {}
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check for: AC1/AC2/AC3/AC4 (case insensitive), Ancestralidade, Vôo, AP
                found = []
                if re.search(r"\bac\d\b|\bac\s+\d\b", content, re.IGNORECASE):
                    found.append("AC_X")
                if re.search(r"Ancestralidade", content, re.IGNORECASE):
                    found.append("Ancestralidade")
                if re.search(r"Vôo", content, re.IGNORECASE):
                    found.append("Vôo")
                if re.search(r"\bAP\b", content):
                    found.append("AP")
                
                if found:
                    matches[file_path] = found
            except Exception as e:
                pass
    return matches

res = scan_dir(packs_dir)
print(f"Scanned packs database. Found {len(res)} files with matching terms:")
for k, v in res.items():
    print(f"- {os.path.basename(k)}: {v}")
