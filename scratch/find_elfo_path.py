import os

packs_dir = r"c:\Users\lpfon\Downloads\animus\animus-system\packs\_source"

for root, dirs, files in os.walk(packs_dir):
    for file in files:
        if "elfo" in file.lower() or "elfo000000000000" in file:
            print(os.path.join(root, file))
