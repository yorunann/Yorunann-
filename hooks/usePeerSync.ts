import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { GameState, ActionType } from '../types';

export type RemoteRole = 'editor' | 'viewer';

export interface ConnectedClientInfo {
  id: string;
  name: string;
  clientType: 'remote' | 'obs';
  role: RemoteRole;
  connectedAt: number;
  lastSeen: number;
  transport: 'cloud_mqtt' | 'broadcast_channel';
}

export interface PeerMessage {
  type:
    | 'SYNC_STATE'
    | 'SYNC_LOGOS'
    | 'STATE_CHUNK'
    | 'REQUEST_STATE'
    | 'REQUEST_LOGOS'
    | 'DISPATCH'
    | 'PING'
    | 'PONG'
    | 'HEARTBEAT'
    | 'DEVICE_INFO'
    | 'CLIENT_HELLO'
    | 'ROLE_UPDATE'
    | 'KICK_CLIENT'
    | 'KICKED';
  actionId?: string;
  hostSessionId?: string;
  state?: GameState;
  stateVersion?: number;
  language?: 'en' | 'zh' | 'ja';
  action?: ActionType;
  timestamp?: number;
  device?: string;
  clientId?: string;
  clientName?: string;
  clientType?: 'remote' | 'obs';
  role?: RemoteRole;
  targetClientId?: string;
  logos?: Record<string, string>;
  missingHashes?: string[];
  chunkGroupId?: string;
  chunkIndex?: number;
  totalChunks?: number;
  data?: string;
}

export interface PeerSyncOptions {
  isHost: boolean;
  roomCode: string;
  currentState: GameState;
  language: 'en' | 'zh' | 'ja';
  onRemoteDispatch?: (action: ActionType) => void;
  onRemoteStateUpdate?: (state: GameState, language?: 'en' | 'zh' | 'ja') => void;
  enabled?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const PRIMARY_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const FALLBACK_BROKER = 'wss://broker.emqx.io:8084/mqtt';

const LOGO_HASH_PREFIX = '__LOGO_HASH__:';
const CHUNK_THRESHOLD = 36000;
const CHUNK_SIZE = 28000;
const RETAIN_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
const RETAIN_THROTTLE_MS = 2500;
const RETAIN_MAX_BYTES = 64000;

function hashLogoString(str: string): string {
  let h1 = 0x811c9dc5;
  const len = str.length;
  // Sample deterministically across long data URLs for O(1) hashing speed
  const step = Math.max(1, Math.floor(len / 2048));
  for (let i = 0; i < len; i += step) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return `lg_${len}_${(h1 >>> 0).toString(36)}`;
}

function stripStateLogos(state: GameState): {
  wireState: GameState;
  extractedLogos: Record<string, string>;
} {
  const extractedLogos: Record<string, string> = {};
  const awayLogo = state.awayTeam?.logoUrl || '';
  const homeLogo = state.homeTeam?.logoUrl || '';

  const stripAway = awayLogo.length > 512 && !awayLogo.startsWith(LOGO_HASH_PREFIX);
  const stripHome = homeLogo.length > 512 && !homeLogo.startsWith(LOGO_HASH_PREFIX);

  if (!stripAway && !stripHome) {
    return { wireState: state, extractedLogos };
  }

  let nextAway = state.awayTeam;
  let nextHome = state.homeTeam;

  if (stripAway) {
    const hash = hashLogoString(awayLogo);
    extractedLogos[hash] = awayLogo;
    nextAway = { ...state.awayTeam, logoUrl: `${LOGO_HASH_PREFIX}${hash}` };
  }

  if (stripHome) {
    const hash = hashLogoString(homeLogo);
    extractedLogos[hash] = homeLogo;
    nextHome = { ...state.homeTeam, logoUrl: `${LOGO_HASH_PREFIX}${hash}` };
  }

  return {
    wireState: {
      ...state,
      awayTeam: nextAway,
      homeTeam: nextHome,
    },
    extractedLogos,
  };
}

function rehydrateStateLogos(
  wireState: GameState,
  cache: Map<string, string>
): {
  hydratedState: GameState;
  missingHashes: string[];
} {
  const missingHashes: string[] = [];
  const awayLogo = wireState.awayTeam?.logoUrl || '';
  const homeLogo = wireState.homeTeam?.logoUrl || '';

  const isAwayHash = awayLogo.startsWith(LOGO_HASH_PREFIX);
  const isHomeHash = homeLogo.startsWith(LOGO_HASH_PREFIX);

  if (!isAwayHash && !isHomeHash) {
    return { hydratedState: wireState, missingHashes };
  }

  let nextAway = wireState.awayTeam;
  let nextHome = wireState.homeTeam;

  if (isAwayHash) {
    const hash = awayLogo.slice(LOGO_HASH_PREFIX.length);
    const cached = cache.get(hash);
    if (cached !== undefined) {
      nextAway = { ...wireState.awayTeam, logoUrl: cached };
    } else {
      missingHashes.push(hash);
      nextAway = { ...wireState.awayTeam, logoUrl: '' };
    }
  }

  if (isHomeHash) {
    const hash = homeLogo.slice(LOGO_HASH_PREFIX.length);
    const cached = cache.get(hash);
    if (cached !== undefined) {
      nextHome = { ...wireState.homeTeam, logoUrl: cached };
    } else {
      if (!missingHashes.includes(hash)) {
        missingHashes.push(hash);
      }
      nextHome = { ...wireState.homeTeam, logoUrl: '' };
    }
  }

  return {
    hydratedState: {
      ...wireState,
      awayTeam: nextAway,
      homeTeam: nextHome,
    },
    missingHashes,
  };
}

function publishLiveMqttPayload(client: MqttClient, topic: string, msg: PeerMessage): void {
  if (!client.connected) return;
  const serialized = JSON.stringify(msg);
  if (serialized.length <= CHUNK_THRESHOLD) {
    client.publish(topic, serialized, { retain: false, qos: 0 });
    return;
  }

  const chunkGroupId = `cg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const totalChunks = Math.ceil(serialized.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const slice = serialized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkMsg: PeerMessage = {
      type: 'STATE_CHUNK',
      chunkGroupId,
      chunkIndex: i,
      totalChunks,
      data: slice,
      timestamp: Date.now(),
    };
    client.publish(topic, JSON.stringify(chunkMsg), { retain: false, qos: 0 });
  }
}

export function getDeviceSummary(): string {
  if (typeof navigator === 'undefined') return '遠端裝置';
  const ua = navigator.userAgent;
  let os = '裝置';
  if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android 手機';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'Mac 電腦';
  else if (/Windows/i.test(ua)) os = 'Windows 電腦';
  else if (/Linux/i.test(ua)) os = 'Linux 電腦';

  let browser = '瀏覽器';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${os} (${browser})`;
}

export function usePeerSync({
  isHost,
  roomCode,
  currentState,
  language,
  onRemoteDispatch,
  onRemoteStateUpdate,
  enabled = true,
}: PeerSyncOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedClientsCount, setConnectedClientsCount] = useState<number>(0);
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client unique identity preserved in sessionStorage
  const myClientIdRef = useRef<string>('');
  if (!myClientIdRef.current) {
    if (typeof window !== 'undefined') {
      try {
        let stored = sessionStorage.getItem('bsb_client_id');
        if (!stored) {
          stored = 'cli_' + Math.random().toString(36).substring(2, 9);
          sessionStorage.setItem('bsb_client_id', stored);
        }
        myClientIdRef.current = stored;
      } catch {
        myClientIdRef.current = 'cli_' + Math.random().toString(36).substring(2, 9);
      }
    } else {
      myClientIdRef.current = 'cli_' + Math.random().toString(36).substring(2, 9);
    }
  }
  const myClientId = myClientIdRef.current;

  // Remote role state for client
  const [myRole, setMyRole] = useState<RemoteRole>('editor');
  const myRoleRef = useRef<RemoteRole>('editor');
  myRoleRef.current = myRole;

  // Kicked state
  const [isKicked, setIsKicked] = useState(false);
  const isKickedRef = useRef(false);
  isKickedRef.current = isKicked;

  // Connected clients management (Host only)
  const [connectedClients, setConnectedClients] = useState<ConnectedClientInfo[]>([]);
  const connectedClientsRef = useRef<Map<string, ConnectedClientInfo>>(new Map());

  // Default role for new remotes (Host only)
  const [defaultRole, setDefaultRoleState] = useState<RemoteRole>(() => {
    try {
      const saved = localStorage.getItem('scoreboard_remote_default_role');
      return saved === 'viewer' ? 'viewer' : 'editor';
    } catch {
      return 'editor';
    }
  });
  const defaultRoleRef = useRef<RemoteRole>(defaultRole);
  defaultRoleRef.current = defaultRole;

  const setDefaultRole = useCallback((role: RemoteRole) => {
    setDefaultRoleState(role);
    try {
      localStorage.setItem('scoreboard_remote_default_role', role);
    } catch {}
  }, []);

  // Kicked client IDs blacklist (Host only)
  const kickedClientIdsRef = useRef<Set<string>>(new Set());

  // Network transports & session refs
  const mqttClientRef = useRef<MqttClient | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastHostSeenRef = useRef<number>(0);
  const isMqttSubscribedRef = useRef(false);

  // Host session & versioning refs
  const hostSessionIdRef = useRef<string>('');
  const stateVersionRef = useRef<number>(1);
  const sentLogoHashesRef = useRef<Set<string>>(new Set());

  // Client sync tracking refs
  const syncedHostSessionRef = useRef<string>('');
  const syncedStateVersionRef = useRef<number>(-1);
  const hasAppliedLiveStateRef = useRef<boolean>(false);
  const lastAutoRequestRef = useRef<number>(0);
  const logoCacheRef = useRef<Map<string, string>>(new Map());
  const lastWireStateRef = useRef<GameState | null>(null);
  const lastWireLangRef = useRef<'en' | 'zh' | 'ja' | undefined>(undefined);
  const chunkBufferRef = useRef<Map<string, { chunks: string[]; received: number; total: number; createdAt: number }>>(
    new Map()
  );

  // Retained snapshot throttling refs (Host only)
  const lastRetainPublishAtRef = useRef<number>(0);
  const retainFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRetainRef = useRef<{ topic: string; payload: string } | null>(null);

  // Outbox action queue for client (guarantees zero dropped clicks)
  const pendingActionsRef = useRef<ActionType[]>([]);

  // Synchronized prop refs to avoid unnecessary re-subscriptions
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;

  const currentStateRef = useRef(currentState);
  currentStateRef.current = currentState;

  const currentLanguageRef = useRef(language);
  currentLanguageRef.current = language;

  const onRemoteDispatchRef = useRef(onRemoteDispatch);
  onRemoteDispatchRef.current = onRemoteDispatch;

  const onRemoteStateUpdateRef = useRef(onRemoteStateUpdate);
  onRemoteStateUpdateRef.current = onRemoteStateUpdate;

  // Deduplication refs
  const processedActionIdsRef = useRef<Map<string, number>>(new Map());
  const lastSentActionRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  // Helper: publish retained snapshot throttled (fallback only, never blocks live)
  const scheduleRetainedPublish = useCallback((topic: string, wireMsg: PeerMessage) => {
    const serialized = JSON.stringify(wireMsg);
    if (serialized.length > RETAIN_MAX_BYTES) return;

    const now = Date.now();
    const elapsed = now - lastRetainPublishAtRef.current;

    if (elapsed >= RETAIN_THROTTLE_MS) {
      if (retainFlushTimerRef.current) {
        clearTimeout(retainFlushTimerRef.current);
        retainFlushTimerRef.current = null;
      }
      pendingRetainRef.current = null;
      if (mqttClientRef.current?.connected) {
        try {
          mqttClientRef.current.publish(topic, serialized, { retain: true, qos: 0 });
          lastRetainPublishAtRef.current = now;
        } catch {}
      }
      return;
    }

    pendingRetainRef.current = { topic, payload: serialized };
    if (!retainFlushTimerRef.current) {
      retainFlushTimerRef.current = setTimeout(() => {
        retainFlushTimerRef.current = null;
        const pending = pendingRetainRef.current;
        pendingRetainRef.current = null;
        if (pending && mqttClientRef.current?.connected) {
          try {
            mqttClientRef.current.publish(pending.topic, pending.payload, { retain: true, qos: 0 });
            lastRetainPublishAtRef.current = Date.now();
          } catch {}
        }
      }, RETAIN_THROTTLE_MS - elapsed);
    }
  }, []);

  // Host: publish extracted logos on host/logos if not yet sent (or forced)
  const publishExtractedLogos = useCallback(
    (
      client: MqttClient | null,
      cleanRoom: string,
      extractedLogos: Record<string, string>,
      forceHashes?: string[]
    ) => {
      if (!client?.connected || !cleanRoom) return;
      const toSend: Record<string, string> = {};

      Object.entries(extractedLogos).forEach(([hash, dataUrl]) => {
        const shouldForce = forceHashes ? forceHashes.includes(hash) : false;
        if (shouldForce || !sentLogoHashesRef.current.has(hash)) {
          toSend[hash] = dataUrl;
        }
      });

      const keys = Object.keys(toSend);
      if (keys.length === 0) return;

      if (sentLogoHashesRef.current.size > 20) {
        sentLogoHashesRef.current.clear();
      }
      keys.forEach((k) => sentLogoHashesRef.current.add(k));

      try {
        publishLiveMqttPayload(client, `bsb3/room/${cleanRoom}/host/logos`, {
          type: 'SYNC_LOGOS',
          hostSessionId: hostSessionIdRef.current,
          logos: toSend,
          timestamp: Date.now(),
        });
      } catch {}
    },
    []
  );

  // Host action deduplication handler
  const handleHostIncomingAction = useCallback((action: ActionType, actionId?: string) => {
    if (!onRemoteDispatchRef.current) return;
    if (actionId) {
      const now = Date.now();
      processedActionIdsRef.current.forEach((t, id) => {
        if (now - t > 15000) processedActionIdsRef.current.delete(id);
      });
      if (processedActionIdsRef.current.has(actionId)) {
        return;
      }
      processedActionIdsRef.current.set(actionId, now);
    }
    onRemoteDispatchRef.current(action);
  }, []);

  // Client: apply wire state with logo rehydration
  const applyWireState = useCallback(
    (
      wireState: GameState,
      options: {
        isLive: boolean;
        language?: 'en' | 'zh' | 'ja';
        hostSessionId?: string;
        stateVersion?: number;
      }
    ) => {
      if (!onRemoteStateUpdateRef.current) return;

      if (options.isLive) {
        // Out-of-order guard within the same host session
        if (
          options.hostSessionId &&
          options.hostSessionId === syncedHostSessionRef.current &&
          typeof options.stateVersion === 'number' &&
          options.stateVersion < syncedStateVersionRef.current
        ) {
          return;
        }

        if (options.hostSessionId) {
          syncedHostSessionRef.current = options.hostSessionId;
        }
        if (typeof options.stateVersion === 'number') {
          syncedStateVersionRef.current = options.stateVersion;
        }
        hasAppliedLiveStateRef.current = true;
        lastHostSeenRef.current = Date.now();
        setStatus('connected');
        setErrorMessage(null);
      }

      lastWireStateRef.current = wireState;
      if (options.language) {
        lastWireLangRef.current = options.language;
      }

      const { hydratedState, missingHashes } = rehydrateStateLogos(wireState, logoCacheRef.current);

      if (missingHashes.length > 0 && mqttClientRef.current?.connected) {
        const cleanRoom = roomCodeRef.current.trim().toLowerCase();
        if (cleanRoom) {
          try {
            mqttClientRef.current.publish(
              `bsb3/room/${cleanRoom}/client/action`,
              JSON.stringify({
                type: 'REQUEST_LOGOS',
                clientId: myClientId,
                missingHashes,
                timestamp: Date.now(),
              })
            );
          } catch {}
        }
      }

      onRemoteStateUpdateRef.current(hydratedState, options.language);
    },
    [myClientId]
  );

  // Host: Register or refresh a connected client info
  const registerOrUpdateClient = useCallback(
    (msg: PeerMessage, transport: 'cloud_mqtt' | 'broadcast_channel') => {
      if (!isHost) return;
      const clientId = msg.clientId || 'unknown_client';

      // If blacklisted/kicked, immediately send KICK_CLIENT and drop
      if (kickedClientIdsRef.current.has(clientId)) {
        const kickMsg: PeerMessage = {
          type: 'KICK_CLIENT',
          targetClientId: clientId,
          timestamp: Date.now(),
        };
        if (mqttClientRef.current && mqttClientRef.current.connected) {
          const cleanRoom = roomCodeRef.current.trim().toLowerCase();
          try {
            mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/host/ctrl`, JSON.stringify(kickMsg));
          } catch {}
        }
        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage(kickMsg);
          } catch {}
        }
        return;
      }

      const existing = connectedClientsRef.current.get(clientId);
      const clientType = msg.clientType || (msg.device?.includes('OBS') ? 'obs' : 'remote');
      const assignedRole: RemoteRole = existing
        ? existing.role
        : clientType === 'obs'
        ? 'viewer'
        : defaultRoleRef.current;

      const clientInfo: ConnectedClientInfo = {
        id: clientId,
        name:
          msg.clientName ||
          existing?.name ||
          (clientType === 'obs' ? 'OBS 實況圖層' : '遠端遙控裝置'),
        clientType,
        role: assignedRole,
        connectedAt: existing?.connectedAt || Date.now(),
        lastSeen: Date.now(),
        transport,
      };

      connectedClientsRef.current.set(clientId, clientInfo);
      setConnectedClients(Array.from(connectedClientsRef.current.values()));
      setConnectedClientsCount(connectedClientsRef.current.size);

      // Send role confirmation back to client
      const roleMsg: PeerMessage = {
        type: 'ROLE_UPDATE',
        hostSessionId: hostSessionIdRef.current,
        targetClientId: clientId,
        role: assignedRole,
        timestamp: Date.now(),
      };
      if (mqttClientRef.current && mqttClientRef.current.connected) {
        const cleanRoom = roomCodeRef.current.trim().toLowerCase();
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/host/ctrl`, JSON.stringify(roleMsg));
        } catch {}
      }
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(roleMsg);
        } catch {}
      }
    },
    [isHost]
  );

  // Host: Kick a client
  const kickClient = useCallback(
    (clientId: string) => {
      if (!isHost) return;
      kickedClientIdsRef.current.add(clientId);
      connectedClientsRef.current.delete(clientId);
      setConnectedClients(Array.from(connectedClientsRef.current.values()));
      setConnectedClientsCount(connectedClientsRef.current.size);

      const kickMsg: PeerMessage = {
        type: 'KICK_CLIENT',
        targetClientId: clientId,
        timestamp: Date.now(),
      };

      if (mqttClientRef.current && mqttClientRef.current.connected) {
        const cleanRoom = roomCodeRef.current.trim().toLowerCase();
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/host/ctrl`, JSON.stringify(kickMsg));
        } catch {}
      }
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(kickMsg);
        } catch {}
      }
    },
    [isHost]
  );

  // Host: Unblock all kicked clients
  const unblockKickedClients = useCallback(() => {
    kickedClientIdsRef.current.clear();
  }, []);

  // Host: Change client permission role
  const setClientRole = useCallback(
    (clientId: string, role: RemoteRole) => {
      if (!isHost) return;
      const client = connectedClientsRef.current.get(clientId);
      if (client) {
        client.role = role;
        connectedClientsRef.current.set(clientId, { ...client });
        setConnectedClients(Array.from(connectedClientsRef.current.values()));
      }

      const roleMsg: PeerMessage = {
        type: 'ROLE_UPDATE',
        hostSessionId: hostSessionIdRef.current,
        targetClientId: clientId,
        role,
        timestamp: Date.now(),
      };

      if (mqttClientRef.current && mqttClientRef.current.connected) {
        const cleanRoom = roomCodeRef.current.trim().toLowerCase();
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/host/ctrl`, JSON.stringify(roleMsg));
        } catch {}
      }
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(roleMsg);
        } catch {}
      }
    },
    [isHost]
  );

  // Client: Retry connection after being kicked
  const retryConnectAfterKick = useCallback(() => {
    setIsKicked(false);
    setErrorMessage(null);
    setStatus('connecting');

    const cleanRoom = roomCodeRef.current.trim().toLowerCase();
    const helloMsg: PeerMessage = {
      type: 'CLIENT_HELLO',
      clientId: myClientId,
      clientName: getDeviceSummary(),
      timestamp: Date.now(),
    };

    if (mqttClientRef.current && mqttClientRef.current.connected && cleanRoom) {
      try {
        mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/client/action`, JSON.stringify(helloMsg));
        mqttClientRef.current.publish(
          `bsb3/room/${cleanRoom}/client/action`,
          JSON.stringify({ type: 'REQUEST_STATE', clientId: myClientId, timestamp: Date.now() })
        );
      } catch {}
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(helloMsg);
      } catch {}
    }
  }, [myClientId]);

  // Broadcast state changes to all connected peers and cloud subscribers (Host only)
  const broadcastState = useCallback(
    (stateToBroadcast?: GameState, langToBroadcast?: 'en' | 'zh' | 'ja') => {
      if (!isHost) return;
      stateVersionRef.current += 1;
      const cleanRoom = roomCodeRef.current.trim().toLowerCase();
      if (!cleanRoom) return;

      const targetState = stateToBroadcast || currentStateRef.current;
      const targetLang = langToBroadcast || currentLanguageRef.current;
      const now = Date.now();
      const ver = stateVersionRef.current;
      const hostSessionId = hostSessionIdRef.current;

      // 1. Local BroadcastChannel (0ms latency for same-machine tabs & OBS, keeps full inline logos)
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'SYNC_STATE',
            hostSessionId,
            state: targetState,
            stateVersion: ver,
            language: targetLang,
            timestamp: now,
          } satisfies PeerMessage);
        } catch {}
      }

      // 2. Cloud MQTT WebSocket
      if (mqttClientRef.current && mqttClientRef.current.connected) {
        const { wireState, extractedLogos } = stripStateLogos(targetState);
        const wireMsg: PeerMessage = {
          type: 'SYNC_STATE',
          hostSessionId,
          state: wireState,
          stateVersion: ver,
          language: targetLang,
          timestamp: now,
        };

        try {
          // Immediate non-retained live broadcast (chunked if > 36KB)
          publishLiveMqttPayload(mqttClientRef.current, `bsb3/room/${cleanRoom}/host/live`, wireMsg);
          // Separate lightweight logo channel (only sends unseen hashes)
          publishExtractedLogos(mqttClientRef.current, cleanRoom, extractedLogos);
          // Throttled retained snapshot fallback for cold joins
          scheduleRetainedPublish(`bsb3/room/${cleanRoom}/host/state`, wireMsg);
        } catch {}
      }
    },
    [isHost, publishExtractedLogos, scheduleRetainedPublish]
  );

  // Send action to host (Client only, with outbox queue so no clicks are lost)
  const sendAction = useCallback(
    (action: ActionType) => {
      if (isHost) {
        if (onRemoteDispatchRef.current) {
          onRemoteDispatchRef.current(action);
        }
        return;
      }

      if (isKickedRef.current) {
        console.warn('[PeerSync Client] Cannot send action: remote session disconnected');
        return;
      }

      if (myRoleRef.current === 'viewer') {
        console.warn('[PeerSync Client] Blocked action: read-only viewer mode');
        return;
      }

      const now = Date.now();
      const actionKey = JSON.stringify(action);
      if (actionKey === lastSentActionRef.current.key && now - lastSentActionRef.current.time < 80) {
        return;
      }
      lastSentActionRef.current = { key: actionKey, time: now };

      const actionId = `act_${now}_${Math.random().toString(36).substring(2, 9)}`;
      const msg: PeerMessage = {
        type: 'DISPATCH',
        actionId,
        clientId: myClientId,
        action,
        timestamp: now,
      };

      const cleanRoom = roomCodeRef.current.trim().toLowerCase();

      // 1. Local BroadcastChannel (Instant 0ms if on same computer)
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(msg);
        } catch {}
      }

      // 2. Cloud MQTT
      if (mqttClientRef.current && mqttClientRef.current.connected && cleanRoom) {
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/client/action`, JSON.stringify(msg));
        } catch {
          pendingActionsRef.current.push(action);
        }
      } else {
        // Connection temporarily interrupted: queue action to flush immediately upon reconnect
        pendingActionsRef.current.push(action);
      }
    },
    [isHost, myClientId]
  );

  // Request state from host (Client only)
  const requestState = useCallback(() => {
    const reqMsg: PeerMessage = {
      type: 'REQUEST_STATE',
      clientId: myClientId,
      timestamp: Date.now(),
    };

    const cleanRoom = roomCodeRef.current.trim().toLowerCase();
    if (mqttClientRef.current && mqttClientRef.current.connected && cleanRoom) {
      try {
        mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/client/action`, JSON.stringify(reqMsg));
      } catch {}
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(reqMsg);
      } catch {}
    }
  }, [myClientId]);

  // Reconnect function ref
  const reconnectRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled || !roomCode) {
      setStatus('disconnected');
      return;
    }

    const cleanRoom = roomCode.trim().toLowerCase();
    if (!cleanRoom) return;

    let isDestroyed = false;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let inactivePruneTimer: ReturnType<typeof setInterval> | null = null;
    let watchdogTimer: ReturnType<typeof setInterval> | null = null;
    let fallbackCounter = 0;

    // Reset session/sync tracking on room or role setup
    if (isHost) {
      hostSessionIdRef.current = `hs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      sentLogoHashesRef.current.clear();
    } else {
      syncedHostSessionRef.current = '';
      syncedStateVersionRef.current = -1;
      hasAppliedLiveStateRef.current = false;
      lastWireStateRef.current = null;
      lastWireLangRef.current = undefined;
      chunkBufferRef.current.clear();
    }

    setStatus('connecting');
    setErrorMessage(null);
    lastHostSeenRef.current = 0;
    isMqttSubscribedRef.current = false;

    const hostSubTopic = `bsb3/room/${cleanRoom}/client/#`;
    const hostLiveTopic = `bsb3/room/${cleanRoom}/host/live`;
    const hostLogosTopic = `bsb3/room/${cleanRoom}/host/logos`;
    const hostStateTopic = `bsb3/room/${cleanRoom}/host/state`;
    const hostCtrlTopic = `bsb3/room/${cleanRoom}/host/ctrl`;

    const clientSubTopic = `bsb3/room/${cleanRoom}/host/#`;
    const clientActionTopic = `bsb3/room/${cleanRoom}/client/action`;

    const handleParsedClientMessage = (msg: PeerMessage, isRetained: boolean) => {
      if (isDestroyed) return;

      // Chunk reassembly
      if (
        msg.type === 'STATE_CHUNK' &&
        msg.chunkGroupId &&
        typeof msg.chunkIndex === 'number' &&
        typeof msg.totalChunks === 'number' &&
        typeof msg.data === 'string'
      ) {
        if (isRetained) return;
        const now = Date.now();
        // Prune stale incomplete chunk groups
        chunkBufferRef.current.forEach((buf, key) => {
          if (now - buf.createdAt > 15000) {
            chunkBufferRef.current.delete(key);
          }
        });

        let entry = chunkBufferRef.current.get(msg.chunkGroupId);
        if (!entry) {
          entry = {
            chunks: new Array(msg.totalChunks),
            received: 0,
            total: msg.totalChunks,
            createdAt: now,
          };
          chunkBufferRef.current.set(msg.chunkGroupId, entry);
        }

        if (msg.chunkIndex >= 0 && msg.chunkIndex < entry.total && entry.chunks[msg.chunkIndex] === undefined) {
          entry.chunks[msg.chunkIndex] = msg.data;
          entry.received += 1;
        }

        if (entry.received === entry.total) {
          chunkBufferRef.current.delete(msg.chunkGroupId);
          try {
            const fullMsg = JSON.parse(entry.chunks.join('')) as PeerMessage;
            handleParsedClientMessage(fullMsg, false);
          } catch (e) {
            console.warn('[PeerSync] Chunk decode notice:', e);
          }
        }
        return;
      }

      // Retained messages can NEVER assert live host presence or overwrite live state
      if (isRetained) {
        if (msg.type === 'SYNC_STATE' && msg.state && !hasAppliedLiveStateRef.current) {
          const msgAge = msg.timestamp ? Date.now() - msg.timestamp : Infinity;
          if (msgAge <= RETAIN_MAX_AGE_MS) {
            // Apply as temporary visual preview only; keep status 'connecting' and version -1
            // so live heartbeat immediately reconciles with the active Host.
            applyWireState(msg.state, {
              isLive: false,
              language: msg.language,
            });
          }
        }
        return;
      }

      // Live messages from active Host
      if (msg.type === 'SYNC_STATE' && msg.state) {
        applyWireState(msg.state, {
          isLive: true,
          language: msg.language,
          hostSessionId: msg.hostSessionId,
          stateVersion: msg.stateVersion,
        });
      } else if (msg.type === 'SYNC_LOGOS' && msg.logos) {
        lastHostSeenRef.current = Date.now();
        Object.entries(msg.logos).forEach(([hash, dataUrl]) => {
          if (logoCacheRef.current.size > 12) {
            const firstKey = logoCacheRef.current.keys().next().value;
            if (firstKey) logoCacheRef.current.delete(firstKey);
          }
          logoCacheRef.current.set(hash, dataUrl);
        });
        if (lastWireStateRef.current && onRemoteStateUpdateRef.current) {
          const { hydratedState } = rehydrateStateLogos(lastWireStateRef.current, logoCacheRef.current);
          onRemoteStateUpdateRef.current(hydratedState, lastWireLangRef.current);
        }
      } else if (msg.type === 'HEARTBEAT' || msg.type === 'PONG') {
        const now = Date.now();
        lastHostSeenRef.current = now;
        setStatus('connected');
        setErrorMessage(null);
        if (msg.type === 'PONG' && msg.timestamp) {
          setLatency(Math.max(1, now - msg.timestamp));
        }

        // Self-healing session & version check: if our state doesn't match Host's live version, pull immediately!
        const sessionMismatch =
          Boolean(msg.hostSessionId) && msg.hostSessionId !== syncedHostSessionRef.current;
        const versionMismatch =
          typeof msg.stateVersion === 'number' && msg.stateVersion !== syncedStateVersionRef.current;

        if ((sessionMismatch || versionMismatch) && now - lastAutoRequestRef.current > 1200) {
          lastAutoRequestRef.current = now;
          requestState();
        }
      } else if (msg.type === 'ROLE_UPDATE') {
        lastHostSeenRef.current = Date.now();
        if (msg.targetClientId === myClientId || !msg.targetClientId) {
          if (msg.role) setMyRole(msg.role);
        }
      } else if (msg.type === 'KICK_CLIENT') {
        if (msg.targetClientId === myClientId || !msg.targetClientId) {
          setIsKicked(true);
          setStatus('disconnected');
          setErrorMessage('您的遠端遙控已被主機解除');
        }
      }
    };

    // 1. Local BroadcastChannel for 0ms same-machine tabs / OBS
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel(`bsb3_sync_${cleanRoom}`);
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          if (isDestroyed) return;
          const msg = event.data as PeerMessage;
          if (!msg || !msg.type) return;

          if (isHost) {
            if (msg.type === 'DISPATCH' && msg.action) {
              handleHostIncomingAction(msg.action, msg.actionId);
            } else if (msg.type === 'REQUEST_STATE') {
              registerOrUpdateClient(msg, 'broadcast_channel');
              bc.postMessage({
                type: 'SYNC_STATE',
                hostSessionId: hostSessionIdRef.current,
                state: currentStateRef.current,
                stateVersion: stateVersionRef.current,
                language: currentLanguageRef.current,
                timestamp: Date.now(),
              } satisfies PeerMessage);
            } else if (msg.type === 'CLIENT_HELLO' || msg.type === 'PING') {
              registerOrUpdateClient(msg, 'broadcast_channel');
              bc.postMessage({
                type: 'PONG',
                hostSessionId: hostSessionIdRef.current,
                stateVersion: stateVersionRef.current,
                timestamp: msg.timestamp,
              } satisfies PeerMessage);
            }
          } else {
            handleParsedClientMessage(msg, false);
          }
        };
      } catch (e) {
        console.warn('[PeerSync] BroadcastChannel init note:', e);
      }
    }

    // 2. Cloud MQTT WebSocket PubSub Architecture
    let activeBrokerUrl = PRIMARY_BROKER;
    let client: MqttClient | null = null;
    let setupStartedAt = Date.now();

    const setupMqttClient = (brokerUrl: string) => {
      if (isDestroyed) return;
      setupStartedAt = Date.now();
      if (client) {
        try {
          client.end(true);
        } catch {}
      }

      const uniqueClientId = `bsb_${isHost ? 'host' : 'cli'}_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      try {
        const m = mqtt.connect(brokerUrl, {
          clientId: uniqueClientId,
          clean: true,
          connectTimeout: 10000,
          reconnectPeriod: 2000,
          keepalive: 15,
        });
        client = m;
        mqttClientRef.current = m;

        m.on('connect', () => {
          if (isDestroyed || mqttClientRef.current !== m) return;
          fallbackCounter = 0;

          if (isHost) {
            sentLogoHashesRef.current.clear();
            m.subscribe(hostSubTopic, { qos: 0 }, (err) => {
              if (!err && !isDestroyed && mqttClientRef.current === m) {
                isMqttSubscribedRef.current = true;
                setStatus('connected');
                setErrorMessage(null);

                const { wireState, extractedLogos } = stripStateLogos(currentStateRef.current);
                const liveMsg: PeerMessage = {
                  type: 'SYNC_STATE',
                  hostSessionId: hostSessionIdRef.current,
                  state: wireState,
                  stateVersion: stateVersionRef.current,
                  language: currentLanguageRef.current,
                  timestamp: Date.now(),
                };
                publishLiveMqttPayload(m, hostLiveTopic, liveMsg);
                publishExtractedLogos(m, cleanRoom, extractedLogos, Object.keys(extractedLogos));
                scheduleRetainedPublish(hostStateTopic, liveMsg);
              }
            });
          } else {
            m.subscribe(clientSubTopic, { qos: 0 }, (err) => {
              if (!err && !isDestroyed && mqttClientRef.current === m) {
                isMqttSubscribedRef.current = true;

                const helloPayload = JSON.stringify({
                  type: 'CLIENT_HELLO',
                  clientId: myClientId,
                  clientName: getDeviceSummary(),
                  timestamp: Date.now(),
                } satisfies PeerMessage);
                m.publish(clientActionTopic, helloPayload);
                m.publish(
                  clientActionTopic,
                  JSON.stringify({
                    type: 'REQUEST_STATE',
                    clientId: myClientId,
                    timestamp: Date.now(),
                  } satisfies PeerMessage)
                );

                // Flush pending queued actions
                while (pendingActionsRef.current.length > 0) {
                  const pendingAction = pendingActionsRef.current.shift();
                  if (pendingAction) {
                    m.publish(
                      clientActionTopic,
                      JSON.stringify({
                        type: 'DISPATCH',
                        actionId: `act_flush_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        clientId: myClientId,
                        action: pendingAction,
                        timestamp: Date.now(),
                      } satisfies PeerMessage)
                    );
                  }
                }
              }
            });
          }
        });

        m.on('message', (_topic, payload, packet) => {
          if (isDestroyed || mqttClientRef.current !== m) return;
          try {
            const msg = JSON.parse(payload.toString()) as PeerMessage;
            const isRetained = Boolean((packet as { retain?: boolean } | undefined)?.retain);

            if (isHost) {
              if (isRetained) return;
              if (msg.type === 'DISPATCH' && msg.action) {
                const cid = msg.clientId;
                if (cid && kickedClientIdsRef.current.has(cid)) return;
                if (cid) {
                  const clientObj = connectedClientsRef.current.get(cid);
                  if (clientObj && clientObj.role === 'viewer') return;
                }
                handleHostIncomingAction(msg.action, msg.actionId);
              } else if (msg.type === 'REQUEST_STATE') {
                if (msg.clientId) registerOrUpdateClient(msg, 'cloud_mqtt');
                const { wireState, extractedLogos } = stripStateLogos(currentStateRef.current);
                const respMsg: PeerMessage = {
                  type: 'SYNC_STATE',
                  hostSessionId: hostSessionIdRef.current,
                  state: wireState,
                  stateVersion: stateVersionRef.current,
                  language: currentLanguageRef.current,
                  timestamp: Date.now(),
                };
                publishLiveMqttPayload(m, hostLiveTopic, respMsg);
                publishExtractedLogos(m, cleanRoom, extractedLogos, Object.keys(extractedLogos));
                scheduleRetainedPublish(hostStateTopic, respMsg);
              } else if (msg.type === 'REQUEST_LOGOS' && Array.isArray(msg.missingHashes)) {
                const { extractedLogos } = stripStateLogos(currentStateRef.current);
                publishExtractedLogos(m, cleanRoom, extractedLogos, msg.missingHashes);
              } else if (msg.type === 'CLIENT_HELLO' || msg.type === 'DEVICE_INFO') {
                registerOrUpdateClient(msg, 'cloud_mqtt');
              } else if (msg.type === 'PING' && msg.timestamp) {
                registerOrUpdateClient(msg, 'cloud_mqtt');
                m.publish(
                  hostCtrlTopic,
                  JSON.stringify({
                    type: 'PONG',
                    hostSessionId: hostSessionIdRef.current,
                    stateVersion: stateVersionRef.current,
                    timestamp: msg.timestamp,
                  } satisfies PeerMessage)
                );
              }
            } else {
              handleParsedClientMessage(msg, isRetained);
            }
          } catch (e) {
            console.warn('[PeerSync] Message decode notice:', e);
          }
        });

        m.on('error', () => {
          if (isDestroyed || mqttClientRef.current !== m) return;
          fallbackCounter++;
          if (fallbackCounter > 4) {
            fallbackCounter = 0;
            activeBrokerUrl = activeBrokerUrl === PRIMARY_BROKER ? FALLBACK_BROKER : PRIMARY_BROKER;
            console.log('[PeerSync] Cycling MQTT broker after errors:', activeBrokerUrl);
            setupMqttClient(activeBrokerUrl);
          }
        });

        m.on('close', () => {
          if (mqttClientRef.current !== m) return;
          isMqttSubscribedRef.current = false;
          if (!isDestroyed) {
            setStatus('connecting');
          }
        });
      } catch (err) {
        console.warn('[PeerSync] MQTT init notice:', err);
      }
    };

    setupMqttClient(activeBrokerUrl);

    // 3. Heartbeat & Watchdog Management
    if (isHost) {
      let hostOfflineSince = 0;

      heartbeatTimer = setInterval(() => {
        if (isDestroyed) return;
        const now = Date.now();
        const hbMsg: PeerMessage = {
          type: 'HEARTBEAT',
          hostSessionId: hostSessionIdRef.current,
          stateVersion: stateVersionRef.current,
          timestamp: now,
        };

        if (mqttClientRef.current && mqttClientRef.current.connected) {
          hostOfflineSince = 0;
          try {
            mqttClientRef.current.publish(hostCtrlTopic, JSON.stringify(hbMsg));
          } catch {}
        } else {
          if (hostOfflineSince === 0) {
            hostOfflineSince = now;
          } else if (now - hostOfflineSince >= 15000) {
            hostOfflineSince = now;
            activeBrokerUrl = activeBrokerUrl === PRIMARY_BROKER ? FALLBACK_BROKER : PRIMARY_BROKER;
            setupMqttClient(activeBrokerUrl);
          }
        }

        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage(hbMsg);
          } catch {}
        }
      }, 2500);

      // Host: Prune inactive clients older than 20 seconds
      inactivePruneTimer = setInterval(() => {
        const now = Date.now();
        let changed = false;
        connectedClientsRef.current.forEach((clientObj, id) => {
          if (now - clientObj.lastSeen > 20000) {
            connectedClientsRef.current.delete(id);
            changed = true;
          }
        });
        if (changed) {
          setConnectedClients(Array.from(connectedClientsRef.current.values()));
          setConnectedClientsCount(connectedClientsRef.current.size);
        }
      }, 4000);
    } else {
      // Client: Watchdog, ping, version reconciliation & broker failover loop
      watchdogTimer = setInterval(() => {
        if (isDestroyed || isKickedRef.current) return;
        const now = Date.now();

        if (mqttClientRef.current && mqttClientRef.current.connected) {
          try {
            mqttClientRef.current.publish(
              clientActionTopic,
              JSON.stringify({ type: 'PING', clientId: myClientId, timestamp: now } satisfies PeerMessage)
            );
          } catch {}

          // If connected to MQTT but live Host state hasn't arrived yet, keep requesting
          if (!hasAppliedLiveStateRef.current && now - setupStartedAt > 2500) {
            requestState();
          }
        }

        const silentDuration =
          lastHostSeenRef.current > 0 ? now - lastHostSeenRef.current : now - setupStartedAt;

        if (silentDuration >= 18000) {
          // Prolonged silence (split-brain broker or dead silent WebSocket): force broker cycle & fresh socket
          setStatus('connecting');
          setLatency(null);
          setErrorMessage('正在切換同步節點並重新連線...');
          activeBrokerUrl = activeBrokerUrl === PRIMARY_BROKER ? FALLBACK_BROKER : PRIMARY_BROKER;
          setupMqttClient(activeBrokerUrl);
        } else if (
          (lastHostSeenRef.current > 0 && silentDuration > 10000) ||
          (lastHostSeenRef.current === 0 && silentDuration > 12000)
        ) {
          setStatus('connecting');
          setLatency(null);
          setErrorMessage('與計分板通訊暫停，正在重新同步...');
          requestState();
        }
      }, 3000);
    }

    // 4. Mobile & Desktop Wake/Visibility Lifecycle Handlers
    const handleWakeSync = () => {
      if (isDestroyed) return;
      if (!isHost) {
        if (!mqttClientRef.current || !mqttClientRef.current.connected) {
          try {
            if (mqttClientRef.current) {
              mqttClientRef.current.reconnect();
            } else {
              setupMqttClient(activeBrokerUrl);
            }
          } catch {
            setupMqttClient(activeBrokerUrl);
          }
        }
        requestState();
      } else {
        if (!mqttClientRef.current || !mqttClientRef.current.connected) {
          try {
            if (mqttClientRef.current) {
              mqttClientRef.current.reconnect();
            } else {
              setupMqttClient(activeBrokerUrl);
            }
          } catch {
            setupMqttClient(activeBrokerUrl);
          }
        } else {
          broadcastState();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleWakeSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleWakeSync);
    window.addEventListener('focus', handleWakeSync);

    reconnectRef.current = () => {
      if (isDestroyed) return;
      setStatus('connecting');
      setErrorMessage(null);
      if (!isHost) {
        syncedStateVersionRef.current = -1;
        hasAppliedLiveStateRef.current = false;
      }
      setupMqttClient(activeBrokerUrl);
      if (!isHost) {
        requestState();
      } else {
        broadcastState();
      }
    };

    return () => {
      isDestroyed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleWakeSync);
      window.removeEventListener('focus', handleWakeSync);

      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (inactivePruneTimer) clearInterval(inactivePruneTimer);
      if (watchdogTimer) clearInterval(watchdogTimer);
      if (retainFlushTimerRef.current) {
        clearTimeout(retainFlushTimerRef.current);
        retainFlushTimerRef.current = null;
      }
      pendingRetainRef.current = null;

      if (client) {
        try {
          client.end(true);
        } catch {}
      }
      mqttClientRef.current = null;

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {}
        broadcastChannelRef.current = null;
      }

      setStatus('disconnected');
      setConnectedClientsCount(0);
      setConnectedClients([]);
      setLatency(null);
    };
  }, [
    isHost,
    roomCode,
    enabled,
    applyWireState,
    handleHostIncomingAction,
    myClientId,
    registerOrUpdateClient,
    requestState,
    broadcastState,
    publishExtractedLogos,
    scheduleRetainedPublish,
  ]);

  const reconnect = useCallback(() => {
    reconnectRef.current();
  }, []);

  return {
    status,
    connectedClientsCount,
    connectedClients,
    defaultRole,
    setDefaultRole,
    kickClient,
    unblockKickedClients,
    setClientRole,
    myRole,
    isKicked,
    retryConnectAfterKick,
    latency,
    errorMessage,
    broadcastState,
    sendAction,
    requestState,
    reconnect,
  };
}
