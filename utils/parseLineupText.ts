export function parseLineupText(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const results = [];
    
    // mapping for positions
    const posMap: Record<string, string> = {
        '投手': 'P', '捕手': 'C', '一壘': '1B', '一壘手': '1B', '二壘': '2B', '二壘手': '2B',
        '三壘': '3B', '三壘手': '3B', '游擊': 'SS', '游擊手': 'SS', '左外': 'LF', '左外野': 'LF',
        '中外': 'CF', '中外野': 'CF', '右外': 'RF', '右外野': 'RF', '指定': 'DH', '指定打擊': 'DH',
        'P': 'P', 'C': 'C', '1B': '1B', '2B': '2B', '3B': '3B', 'SS': 'SS', 'LF': 'LF', 'CF': 'CF', 'RF': 'RF', 'DH': 'DH'
    };
    
    for (const line of lines) {
        // ignore obvious headers
        if (line.match(/先發名單|lineup|打線|打擊順序|先發|bench|板凳/i) && line.length < 10) continue;

        let currentStr = line;
        
        // 1. Remove Batting Order (e.g. 1棒, 第一棒, 1., #1, 1 - )
        // Using a regex to match at the beginning of the string (after ignoring spaces)
        currentStr = currentStr.replace(/^([第]?\d+[棒號]?[\.\-\s、：:]+)/, ' ');
        currentStr = currentStr.replace(/^#\d+[\.\-\s、：:]+/, ' '); // if they use #1 for batting order
        // if still starts with something like 1棒
        currentStr = currentStr.replace(/^第?\d+棒\s*/, ' ');
        
        let position = '';
        let number = '';
        let avg = '.000';
        let name = '';

        // 2. Find position
        // Match known positions
        const posRegex = new RegExp(`(${Object.keys(posMap).join('|')})`, 'i');
        const posMatch = currentStr.match(posRegex);
        if (posMatch) {
            position = posMap[posMatch[0].toUpperCase()] || posMap[posMatch[0]];
            currentStr = currentStr.replace(posMatch[0], ' ');
        } else {
            position = 'DH'; // Default
        }

        // 3. Find number (#24, (24), 24號 or just standalone number if separated)
        const numRegex1 = /(?:#|＃)\s*(\d+)/;
        const numRegex2 = /\(\s*(\d+)\s*\)/;
        const numRegex3 = /(\d+)\s*(?:號|背號)/;
        const numRegex4 = /(?:^|[\s,、\/])(\d{1,3})(?:[\s,、\/]|$)/;

        let numMatch = currentStr.match(numRegex1) || currentStr.match(numRegex2) || currentStr.match(numRegex3);
        if (numMatch) {
            number = numMatch[1];
            currentStr = currentStr.replace(numMatch[0], ' ');
        } else {
            numMatch = currentStr.match(numRegex4);
            if (numMatch) {
                number = numMatch[1];
                currentStr = currentStr.replace(numMatch[0], ' ');
            } else {
                number = '00';
            }
        }

        // 4. Find avg
        const avgRegex = /(0?\.\d{3})/;
        const avgMatch = currentStr.match(avgRegex);
        if (avgMatch) {
            avg = avgMatch[1];
            if (avg.startsWith('0.')) avg = avg.substring(1);
            currentStr = currentStr.replace(avgMatch[0], ' ');
        }

        // 5. Name is what's left
        // Clean up remaining separators and spaces
        name = currentStr.replace(/[,、\/]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!name) name = 'Player';
        
        results.push({ position, number, name, avg });
    }
    return results;
}
