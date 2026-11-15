with open('components/LineupImportModal.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    'onClick={() => { setIsConfirming(false); onClose(); }}',
    'onClick={onClose}'
)

with open('components/LineupImportModal.tsx', 'w') as f:
    f.write(code)

