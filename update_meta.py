import re

with open("types.ts", "r") as f:
    text = f.read()

target = """  broadcastShowPitchCount?: boolean;
  settingsVersion?: number;
}"""

replacement = """  broadcastShowPitchCount?: boolean;
  broadcastTeamNameSize?: number;
  broadcastPlayerNameSize?: number;
  broadcastScoreSize?: number;
  broadcastTimerSize?: number;
  broadcastInningSize?: number;
  settingsVersion?: number;
}"""

if target in text:
    text = text.replace(target, replacement)
    with open("types.ts", "w") as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
