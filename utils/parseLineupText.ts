export function parseLineupText(text: string) {
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const results = [];

    // mapping for multi-character positions
    const MULTI_POS_MAP: Record<string, string> = {
        // Chinese multi-char
        '先發投手': 'P', '中繼投手': 'P', '後援投手': 'P', '終結者': 'P', '投手': 'P',
        '捕手': 'C',
        '一壘手': '1B', '一壘': '1B',
        '二壘手': '2B', '二壘': '2B',
        '三壘手': '3B', '三壘': '3B',
        '游擊手': 'SS', '游擊': 'SS',
        '左外野手': 'LF', '左外野': 'LF', '左外': 'LF',
        '中外野手': 'CF', '中外野': 'CF', '中外': 'CF',
        '右外野手': 'RF', '右外野': 'RF', '右外': 'RF',
        '指定打擊': 'DH', '指定': 'DH', '指打': 'DH',
        '外野手': 'OF', '外野': 'OF',
        '內野手': 'IF', '內野': 'IF',
        '代打': 'PH', '代跑': 'PR',
        // Japanese multi-char
        'ピッチャー': 'P', 'キャッチャー': 'C', 'ファースト': '1B', 'セカンド': '2B',
        'サード': '3B', 'ショート': 'SS', 'レフト': 'LF', 'センター': 'CF', 'ライト': 'RF',
        '指名打者': 'DH',
        '一塁手': '1B', '二塁手': '2B', '三塁手': '3B', '遊撃手': 'SS', '左翼手': 'LF', '中堅手': 'CF', '右翼手': 'RF',
        '一塁': '1B', '二塁': '2B', '三塁': '3B', '遊撃': 'SS', '左翼': 'LF', '中堅': 'CF', '右翼': 'RF'
    };

    const SINGLE_CH_POS_MAP: Record<string, string> = {
        '投': 'P', '捕': 'C', '一': '1B', '二': '2B', '三': '3B',
        '游': 'SS', '遊': 'SS', '左': 'LF', '中': 'CF', '右': 'RF', '指': 'DH'
    };

    const EN_POS_MAP: Record<string, string> = {
        '1B': '1B', '2B': '2B', '3B': '3B', 'SS': 'SS', 'LF': 'LF', 'CF': 'CF', 'RF': 'RF',
        'DH': 'DH', 'OF': 'OF', 'IF': 'IF', 'SP': 'P', 'RP': 'P', 'CP': 'P', 'PH': 'PH', 'PR': 'PR',
        'P': 'P', 'C': 'C'
    };

    for (const rawLine of rawLines) {
        // ignore obvious headers
        if (rawLine.match(/^(先發名單|lineup|打線|打擊順序|先發|bench|板凳|order|roster|away|home)/i) && rawLine.length < 15) continue;

        // 1. Normalize line: fullwidth digits & letters & symbols
        let s = rawLine.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
        s = s.replace(/[Ａ-Ｚａ-ｚ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
        s = s.replace(/[，、]/g, ' ')
             .replace(/[：]/g, ':')
             .replace(/[＃]/g, '#')
             .replace(/[（]/g, '(')
             .replace(/[）]/g, ')')
             .replace(/[［]/g, '[')
             .replace(/[］]/g, ']')
             .replace(/[－—–]/g, '-')
             .replace(/\t/g, ' ')
             .trim();

        let position = '';
        let number = '';
        let avg = '.000';
        let name = '';

        // 2. Remove explicit Batting Order at the start:
        // 2a. "第1棒", "1棒", "第一棒", "1番", "第1番"
        s = s.replace(/^第?([一二三四五六七八九十\d]+)[棒番][\s\.\:\-]*/i, ' ');

        // 2b. "1.", "1-", "1:", "1)", "1/" with punctuation explicitly denoting order (1-12)
        s = s.replace(/^[#＃]?([1-9]|1[0-2])[\.\-\:\)\/]+[\s]*/i, ' ');

        // 3. Extract Batting Average (e.g. .305, 0.280, 1.000)
        const avgMatch = s.match(/(?:\s|^|\(|\[|\-)(0?\.\d{2,4})(?:\s|$|\)|\]|\-|\/)/);
        if (avgMatch) {
            let matchedAvg = avgMatch[1];
            if (matchedAvg.startsWith('0.')) matchedAvg = matchedAvg.substring(1);
            avg = matchedAvg;
            s = s.replace(avgMatch[0], ' ');
        }

        // 4. Extract Explicit Jersey Numbers (#24, 24號, 背號24, No.24, (24))
        const explicitNumMatch = s.match(/(?:#|No\.|背號|號碼)\s*(\d{1,3})/i) ||
                                 s.match(/(\d{1,3})\s*(?:號|番)/i) ||
                                 s.match(/\(\s*(\d{1,3})\s*\)/);
        if (explicitNumMatch) {
            number = explicitNumMatch[1];
            s = s.replace(explicitNumMatch[0], ' ');
        }

        // 5. Extract Position
        // 5a. Multi-character position match
        const multiPosKeys = Object.keys(MULTI_POS_MAP).sort((a, b) => b.length - a.length);
        for (const k of multiPosKeys) {
            const idx = s.indexOf(k);
            if (idx !== -1) {
                position = MULTI_POS_MAP[k];
                s = s.substring(0, idx) + ' ' + s.substring(idx + k.length);
                break;
            }
        }

        // 5b. English position match with word boundaries (\bSS\b, \b2B\b, \bP\b, etc.)
        if (!position) {
            const enPosRegex = /\b(1B|2B|3B|SS|LF|CF|RF|DH|OF|IF|SP|RP|CP|PH|PR|P|C)\b/i;
            const enMatch = s.match(enPosRegex);
            if (enMatch) {
                const matchedUpper = enMatch[1].toUpperCase();
                position = EN_POS_MAP[matchedUpper] || matchedUpper;
                s = s.replace(enMatch[0], ' ');
            }
        }

        // 5c. Single character Chinese position (投, 捕, 一, 二, 三, 游, 遊, 左, 中, 右, 指)
        // Only match if it's a standalone token or surrounded by whitespace / start / end / punctuation / digits
        if (!position) {
            const singleChKeys = Object.keys(SINGLE_CH_POS_MAP).join('');
            const singleChRegex = new RegExp(`(?:^|[\\s\\(\\)\\[\\]\\-\\/:,])([${singleChKeys}])(?=[\\s\\(\\)\\[\\]\\-\\/:,]|$|\\d)`, 'g');
            const chMatch = singleChRegex.exec(s);
            if (chMatch) {
                const char = chMatch[1];
                position = SINGLE_CH_POS_MAP[char];
                const matchIndex = chMatch.index + chMatch[0].indexOf(char);
                s = s.substring(0, matchIndex) + ' ' + s.substring(matchIndex + 1);
            }
        }

        // 6. Handle numbers and remaining potential batting order
        const numTokenRegex = /\b\d{1,3}\b/g;
        const allNums: { val: string; index: number }[] = [];
        let m: RegExpExecArray | null;
        while ((m = numTokenRegex.exec(s)) !== null) {
            allNums.push({ val: m[0], index: m.index });
        }

        if (!number) {
            if (allNums.length === 1) {
                // If only 1 number in line (e.g. "99 張育成", "77 Peter", "LIKEY 22")
                number = allNums[0].val;
                s = s.substring(0, allNums[0].index) + ' ' + s.substring(allNums[0].index + allNums[0].val.length);
            } else if (allNums.length >= 2) {
                // e.g. "1 王柏融 24" -> first is order (1), second is number (24)
                // e.g. "陳子豪 1 9" -> 1 is order, 9 is number
                const firstNum = parseInt(allNums[0].val, 10);
                const secondNum = allNums[1].val;
                
                if (firstNum <= 12) {
                    number = secondNum;
                    s = s.replace(new RegExp(`\\b${allNums[0].val}\\b`), ' ');
                    s = s.replace(new RegExp(`\\b${allNums[1].val}\\b`), ' ');
                } else {
                    number = allNums[0].val;
                    s = s.replace(new RegExp(`\\b${allNums[0].val}\\b`), ' ');
                }
            }
        }

        // Default position & number if still not found
        if (!position) position = 'DH';
        if (!number) number = '00';

        // 7. Name is what's left
        name = s.replace(/[,\/\|\-_:;\(\)\[\]]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

        // Clean up leading/trailing dashes/colons but keep periods if inside/end of name like "Jr."
        name = name.replace(/^[\-_:;#\s]+|[\-_:;#\s]+$/g, '').trim();

        if (!name) name = 'Player';

        results.push({ position, number, name, avg });
    }

    return results;
}
