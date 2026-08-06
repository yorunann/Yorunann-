const fs = require('fs');
let content = fs.readFileSync('components/UserGuideModal.tsx', 'utf-8');

// Just replace the component definition to accept language
content = content.replace('export const UserGuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {', 'export const UserGuideModal = ({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: "en" | "zh" | "ja" }) => {');

// Helper to replace text based on language
// This requires me to do a lot of regex or string replaces, which is risky.
fs.writeFileSync('components/UserGuideModal.tsx', content);
