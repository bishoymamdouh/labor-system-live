import json
import os

path = r'C:\Users\Bishoy Heshmat\.gemini\antigravity\brain\86f54fac-b6c3-4eac-b4ba-d1c523ab99f9\.system_generated\logs\transcript_full.jsonl'
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if 'multi_replace_file_content' in str(data) and 'index.html' in str(data) and 'diff_block_start' in str(data):
            # This is the tool output
            content = data.get('content', '')
            if 'diff_block_start' in content:
                # Find the last matching occurrence if there are multiple
                pass

# Let us just get all tool outputs that contain diff_block_start and index.html
res = []
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'ACTION_RESULT' and 'multi_replace_file_content' in str(data) and 'diff_block_start' in str(data.get('content', '')):
            res.append(data['content'])

if res:
    last_diff = res[-1]
    with open('diff_output.txt', 'w', encoding='utf-8') as out:
        out.write(last_diff)
    print('Diff saved to diff_output.txt')
else:
    print('Not found')
