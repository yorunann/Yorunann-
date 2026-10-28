import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';
import mqtt, { MqttClient } from 'mqtt';
import { GameState, ActionType } from '../types';

export interface PeerMessage {
  type: 'SYNC_STATE' | 'REQUEST_STATE' | 'DISPATCH' | 'PING' | 'PONG' | 'DEVICE_INFO';
  actionId?: string;
  state?: GameState;
  stateVersion?: number;
  language?: 'en' | 'zh' | 'ja';
  action?: ActionType;
  timestamp?: number;
  device?: string;
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

const PEER_PREFIX = 'bsb-p2p-v3-';

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

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const clientConnRef = useRef<DataConnection | null>(null);
  const mqttClientRef = useRef<MqttClient | null>(null);
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

  // Deduplication & versioning refs to guarantee zero duplicate actions and zero state jitter
  const stateVersionRef = useRef<number>(1);
  const lastProcessedStateVersionRef = useRef<number>(0);
  const processedActionIdsRef = useRef<Map<string, number>>(new Map());
  const lastSentActionRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  // Host action deduplication handler: prevents executing actions twice across WebRTC & MQTT
  const handleHostIncomingAction = useCallback((action: ActionType, actionId?: string) => {
    if (!onRemoteDispatchRef.current) return;
    if (actionId) {
      const now = Date.now();
      // Purge entries older than 15s
      processedActionIdsRef.current.forEach((t, id) => {
        if (now - t > 15000) processedActionIdsRef.current.delete(id);
      });
      if (processedActionIdsRef.current.has(actionId)) {
        console.log('[PeerSync Host] Dropped duplicate incoming actionId:', actionId);
        return;
      }
      processedActionIdsRef.current.set(actionId, now);
    }
    onRemoteDispatchRef.current(action);
  }, []);

  // Client state update deduplication handler: drops outdated or duplicate state broadcasts
  const handleClientIncomingState = useCallback((newState: GameState, newLang?: 'en' | 'zh' | 'ja', version?: number) => {
    if (!onRemoteStateUpdateRef.current) return;
    if (typeof version === 'number') {
      if (version <= lastProcessedStateVersionRef.current) {
        // Discard older or already processed state packet
        return;
      }
      lastProcessedStateVersionRef.current = version;
    }
    setStatus('connected');
    setErrorMessage(null);
    onRemoteStateUpdateRef.current(newState, newLang);
  }, []);

  // Broadcast state changes to all connected peers and cloud MQTT subscribers (Host only)
  const broadcastState = useCallback((stateToBroadcast?: GameState, langToBroadcast?: 'en' | 'zh' | 'ja') => {
    if (!isHost) return;
    stateVersionRef.current += 1;
    const msg: PeerMessage = {
      type: 'SYNC_STATE',
      state: stateToBroadcast || currentStateRef.current,
      stateVersion: stateVersionRef.current,
      language: langToBroadcast || currentLanguageRef.current,
      timestamp: Date.now(),
    };

    // 1. WebRTC DataConnection
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('[PeerSync] Failed to send state update to client', e);
        }
      }
    });

    // 2. Cloud MQTT WebSocket: retained message for instant sync when OBS opens
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const cleanRoom = roomCodeRef.current.trim().toLowerCase();
      if (cleanRoom) {
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/state`, JSON.stringify(msg), { retain: true, qos: 0 });
        } catch (e) {}
      }
    }
  }, [isHost]);

  // Send action to host (Client only)
  const sendAction = useCallback((action: ActionType) => {
    if (isHost) {
      if (onRemoteDispatchRef.current) {
        onRemoteDispatchRef.current(action);
      }
      return;
    }

    const now = Date.now();
    // Debounce rapid tap bounce (< 100ms for exact same action)
    const actionKey = JSON.stringify(action);
    if (actionKey === lastSentActionRef.current.key && now - lastSentActionRef.current.time < 100) {
      return;
    }
    lastSentActionRef.current = { key: actionKey, time: now };

    // Unique action ID for deduplication on host
    const actionId = `act_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const msg: PeerMessage = {
      type: 'DISPATCH',
      actionId,
      action,
      timestamp: now,
    };

    // Prefer fast direct WebRTC DataConnection if available
    let sentViaWebRtc = false;
    const conn = clientConnRef.current;
    if (conn && conn.open) {
      try {
        conn.send(msg);
        sentViaWebRtc = true;
      } catch (e) {
        console.error('[PeerSync] Error sending action to host via WebRTC', e);
      }
    }

    // Only fallback to Cloud MQTT if WebRTC is not open
    if (!sentViaWebRtc && mqttClientRef.current && mqttClientRef.current.connected) {
      const cleanRoom = roomCodeRef.current.trim().toLowerCase();
      if (cleanRoom) {
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/client_to_host`, JSON.stringify(msg));
        } catch (e) {}
      }
    }
  }, [isHost]);

  // Request state from host (Client only)
  const requestState = useCallback(() => {
    // 1. WebRTC
    const conn = clientConnRef.current;
    if (conn && conn.open) {
      conn.send({ type: 'REQUEST_STATE', timestamp: Date.now() });
    }
    // 2. Cloud MQTT
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const cleanRoom = roomCodeRef.current.trim().toLowerCase();
      if (cleanRoom) {
        try {
          mqttClientRef.current.publish(`bsb3/room/${cleanRoom}/client_to_host`, JSON.stringify({
            type: 'REQUEST_STATE',
            timestamp: Date.now(),
          }));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomCode) {
      setStatus('disconnected');
      return;
    }

    const cleanRoom = roomCode.trim().toLowerCase();
    if (!cleanRoom) return;

    let isDestroyed = false;
    setStatus('connecting');
    setErrorMessage(null);

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];

    const hostPeerId = `${PEER_PREFIX}${cleanRoom}`;

    let reconnectTimer: any = null;
    let clientConnectTimer: any = null;
    let heartbeatTimer: any = null;
    let reconnectAttempts = 0;

    // Cloud MQTT WebSocket pub/sub (Works 100% on any deployed website / OBS Studio without WebRTC NAT/STUN issues)
    const stateTopic = `bsb3/room/${cleanRoom}/state`;
    const actionTopic = `bsb3/room/${cleanRoom}/client_to_host`;
    const clientId = `bsb_${isHost ? 'host' : 'obs'}_${Math.random().toString(16).substring(2, 8)}`;

    let mqttClient: MqttClient | null = null;
    try {
      mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2500,
      });
      mqttClientRef.current = mqttClient;

      mqttClient.on('connect', () => {
        if (isDestroyed) return;
        console.log(`[Cloud Sync] Connected to broker as ${isHost ? 'Host' : 'Client'}`);
        setStatus('connected');
        setErrorMessage(null);

        if (isHost) {
          mqttClient?.subscribe(actionTopic);
          // Broadcast current state with retain: true so OBS receives it instantly
          const payload = JSON.stringify({
            type: 'SYNC_STATE',
            state: currentStateRef.current,
            language: currentLanguageRef.current,
            timestamp: Date.now(),
          });
          mqttClient?.publish(stateTopic, payload, { retain: true, qos: 0 });
        } else {
          // Client (OBS / Remote) subscribes to state
          mqttClient?.subscribe(stateTopic, { qos: 0 }, (err) => {
            if (!err) {
              mqttClient?.publish(actionTopic, JSON.stringify({ type: 'REQUEST_STATE', timestamp: Date.now() }));
            }
          });
        }
      });

      mqttClient.on('message', (topic, payload) => {
        if (isDestroyed) return;
        try {
          const msg = JSON.parse(payload.toString()) as PeerMessage;
          if (topic === stateTopic && msg.type === 'SYNC_STATE' && msg.state) {
            if (!isHost) {
              handleClientIncomingState(msg.state, msg.language, msg.stateVersion);
            }
          } else if (topic === actionTopic && isHost) {
            if (msg.type === 'DISPATCH' && msg.action) {
              handleHostIncomingAction(msg.action, msg.actionId);
            } else if (msg.type === 'REQUEST_STATE') {
              const resp = JSON.stringify({
                type: 'SYNC_STATE',
                state: currentStateRef.current,
                stateVersion: stateVersionRef.current,
                language: currentLanguageRef.current,
                timestamp: Date.now(),
              });
              mqttClient?.publish(stateTopic, resp, { retain: true, qos: 0 });
            }
          }
        } catch (e) {
          console.warn('[Cloud Sync] Failed to parse message', e);
        }
      });

      mqttClient.on('error', (err) => {
        console.warn('[Cloud Sync] Notice:', err);
      });
    } catch (e) {
      console.warn('[Cloud Sync] Init error:', e);
    }

    const connectClientToHost = () => {
      if (isDestroyed || !peerRef.current || peerRef.current.destroyed || isHost) return;
      if (clientConnRef.current && clientConnRef.current.open) return;

      console.log(`[PeerSync] Connecting client to host peer ${hostPeerId}...`);
      try {
        const conn = peerRef.current.connect(hostPeerId, {
          reliable: true,
        });
        clientConnRef.current = conn;

        conn.on('open', () => {
          if (isDestroyed) return;
          console.log('[PeerSync] Connected to remote host scoreboard!');
          setStatus('connected');
          setErrorMessage(null);
          // Request full state immediately
          conn.send({
            type: 'REQUEST_STATE',
            device: typeof navigator !== 'undefined' ? navigator.userAgent : 'mobile',
            timestamp: Date.now(),
          });
          // Repeat request once shortly after to ensure initial sync
          setTimeout(() => {
            if (!isDestroyed && conn.open) {
              conn.send({ type: 'REQUEST_STATE', timestamp: Date.now() });
            }
          }, 350);
        });

        conn.on('data', (data: any) => {
          if (isDestroyed) return;
          const msg = data as PeerMessage;
          if (msg.type === 'SYNC_STATE' && msg.state) {
            handleClientIncomingState(msg.state, msg.language, msg.stateVersion);
          } else if (msg.type === 'PONG' && msg.timestamp) {
            const rtt = Date.now() - msg.timestamp;
            setLatency(rtt);
          }
        });

        conn.on('close', () => {
          if (isDestroyed) return;
          console.warn('[PeerSync] Connection to host closed; scheduling auto-retry...');
          setStatus('disconnected');
          setLatency(null);
          if (clientConnectTimer) clearTimeout(clientConnectTimer);
          clientConnectTimer = setTimeout(connectClientToHost, 2500);
        });

        conn.on('error', (err) => {
          if (isDestroyed) return;
          console.warn('[PeerSync] Client connection error:', err);
          setStatus('error');
          if (clientConnectTimer) clearTimeout(clientConnectTimer);
          clientConnectTimer = setTimeout(connectClientToHost, 3000);
        });
      } catch (e) {
        console.warn('[PeerSync] connectClientToHost invocation failed:', e);
        if (clientConnectTimer) clearTimeout(clientConnectTimer);
        clientConnectTimer = setTimeout(connectClientToHost, 3000);
      }
    };

    const scheduleReconnect = () => {
      if (isDestroyed || !peerRef.current || peerRef.current.destroyed) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const delay = Math.min(1500 * Math.pow(1.5, Math.min(reconnectAttempts, 5)), 12000);
      reconnectTimer = setTimeout(() => {
        if (isDestroyed || !peerRef.current || peerRef.current.destroyed) return;
        if (peerRef.current.disconnected) {
          try {
            reconnectAttempts++;
            console.log(`[PeerSync] Reconnecting to signaling server (attempt ${reconnectAttempts})...`);
            peerRef.current.reconnect();
          } catch (e) {
            console.warn('[PeerSync] Reconnection invocation error', e);
          }
        }
      }, delay);
    };

    const initPeer = () => {
      if (isDestroyed) return;
      try {
        if (peerRef.current) {
          try {
            peerRef.current.destroy();
          } catch (e) {}
        }

        const peer = isHost
          ? new Peer(hostPeerId, {
              debug: 0,
              config: { iceServers },
            })
          : new Peer({
              debug: 0,
              config: { iceServers },
            });

        peerRef.current = peer;

        peer.on('open', (id) => {
          if (isDestroyed) return;
          reconnectAttempts = 0;
          if (reconnectTimer) clearTimeout(reconnectTimer);
          console.log(`[PeerSync] Peer opened as ${isHost ? 'Host' : 'Client'}, ID: ${id}`);
          
          if (isHost) {
            setStatus('connected');
            setErrorMessage(null);
          } else {
            connectClientToHost();
          }
        });

        if (isHost) {
          peer.on('connection', (conn) => {
            if (isDestroyed) return;
            console.log('[PeerSync Host] Incoming connection from client:', conn.peer);

            conn.on('open', () => {
              if (isDestroyed) return;
              connectionsRef.current.set(conn.peer, conn);
              setConnectedClientsCount(connectionsRef.current.size);

              // Immediately push full current state and lineup to the newly connected client
              conn.send({
                type: 'SYNC_STATE',
                state: currentStateRef.current,
                language: currentLanguageRef.current,
                timestamp: Date.now(),
              });
            });

            conn.on('data', (data: any) => {
              if (isDestroyed) return;
              const msg = data as PeerMessage;
              if (msg.type === 'DISPATCH' && msg.action) {
                handleHostIncomingAction(msg.action, msg.actionId);
              } else if (msg.type === 'REQUEST_STATE') {
                conn.send({
                  type: 'SYNC_STATE',
                  state: currentStateRef.current,
                  stateVersion: stateVersionRef.current,
                  language: currentLanguageRef.current,
                  timestamp: Date.now(),
                });
              } else if (msg.type === 'PING' && msg.timestamp) {
                conn.send({
                  type: 'PONG',
                  timestamp: msg.timestamp,
                });
              }
            });

            conn.on('close', () => {
              connectionsRef.current.delete(conn.peer);
              setConnectedClientsCount(connectionsRef.current.size);
            });

            conn.on('error', (e) => {
              console.warn('[PeerSync Host] Client connection error', e);
              connectionsRef.current.delete(conn.peer);
              setConnectedClientsCount(connectionsRef.current.size);
            });
          });
        }

        peer.on('error', (err: any) => {
          if (isDestroyed) return;
          const msg = String(err?.message || err || '');
          const errType = err?.type || '';

          if (errType === 'network' || errType === 'server-error' || errType === 'socket-closed' || errType === 'socket-error' || msg.includes('Lost connection to server')) {
            console.log('[PeerSync] Signaling server connection lost temporarily; will reconnect automatically');
            scheduleReconnect();
            return;
          }

          if (errType === 'unavailable-id') {
            console.warn('[PeerSync] Room code temporarily locked by server; destroying and recreating in 2s...');
            setErrorMessage('房間代碼連線中...');
            setTimeout(() => {
              if (!isDestroyed) {
                initPeer();
              }
            }, 2000);
          } else if (errType === 'peer-unavailable') {
            console.log('[PeerSync] Host not found yet, will retry connecting in 2.5s:', err);
            setErrorMessage('等待連線至計分板...');
            setStatus('connecting');
            if (clientConnectTimer) clearTimeout(clientConnectTimer);
            clientConnectTimer = setTimeout(connectClientToHost, 2500);
          } else {
            console.warn('[PeerSync] Peer notice:', err);
            setErrorMessage(msg || '連線服務暫時無法存取');
            setStatus('error');
          }
        });

        peer.on('disconnected', () => {
          if (isDestroyed) return;
          console.log('[PeerSync] Peer disconnected from signaling server; scheduling reconnect...');
          scheduleReconnect();
        });
      } catch (err: any) {
        console.warn('[PeerSync] Initialization failed', err);
        setStatus('error');
        setErrorMessage(err?.message || '初始化 P2P 服務失敗');
      }
    };

    initPeer();

    // Periodic heartbeat sync for Host: push state every 3.5s to all connected peers
    if (isHost) {
      heartbeatTimer = setInterval(() => {
        if (connectionsRef.current.size > 0) {
          const msg: PeerMessage = {
            type: 'SYNC_STATE',
            state: currentStateRef.current,
            stateVersion: stateVersionRef.current,
            language: currentLanguageRef.current,
            timestamp: Date.now(),
          };
          connectionsRef.current.forEach((conn) => {
            if (conn.open) {
              try {
                conn.send(msg);
              } catch (e) {}
            }
          });
        }
      }, 3500);
    }

    // Ping interval for client to measure latency & auto-reconnect check
    let pingInterval: any = null;
    if (!isHost) {
      pingInterval = setInterval(() => {
        const conn = clientConnRef.current;
        if (conn && conn.open) {
          conn.send({ type: 'PING', timestamp: Date.now() });
        } else {
          // If disconnected, try to reconnect
          connectClientToHost();
        }
      }, 4000);
    }

    const handleBeforeUnload = () => {
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isDestroyed = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (clientConnectTimer) clearTimeout(clientConnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (pingInterval) clearInterval(pingInterval);
      connectionsRef.current.forEach((conn) => conn.close());
      connectionsRef.current.clear();
      if (clientConnRef.current) {
        clientConnRef.current.close();
        clientConnRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (mqttClient) {
        try {
          mqttClient.end(true);
        } catch (e) {}
      }
      mqttClientRef.current = null;
      setStatus('disconnected');
      setConnectedClientsCount(0);
      setLatency(null);
    };
  }, [isHost, roomCode, enabled]);

  return {
    status,
    connectedClientsCount,
    latency,
    errorMessage,
    broadcastState,
    sendAction,
    requestState,
  };
}
