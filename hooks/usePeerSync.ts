import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { GameState, ActionType } from '../types';

export interface PeerMessage {
  type: 'SYNC_STATE' | 'REQUEST_STATE' | 'DISPATCH' | 'PING' | 'PONG' | 'DEVICE_INFO';
  state?: GameState;
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

  const currentStateRef = useRef(currentState);
  currentStateRef.current = currentState;

  const currentLanguageRef = useRef(language);
  currentLanguageRef.current = language;

  const onRemoteDispatchRef = useRef(onRemoteDispatch);
  onRemoteDispatchRef.current = onRemoteDispatch;

  const onRemoteStateUpdateRef = useRef(onRemoteStateUpdate);
  onRemoteStateUpdateRef.current = onRemoteStateUpdate;

  // Broadcast state changes to all connected peers (Host only)
  const broadcastState = useCallback((stateToBroadcast?: GameState, langToBroadcast?: 'en' | 'zh' | 'ja') => {
    if (!isHost) return;
    const msg: PeerMessage = {
      type: 'SYNC_STATE',
      state: stateToBroadcast || currentStateRef.current,
      language: langToBroadcast || currentLanguageRef.current,
      timestamp: Date.now(),
    };

    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('[PeerSync] Failed to send state update to client', e);
        }
      }
    });
  }, [isHost]);

  // Send action to host (Client only)
  const sendAction = useCallback((action: ActionType) => {
    if (isHost) {
      // Local host can dispatch directly
      if (onRemoteDispatchRef.current) {
        onRemoteDispatchRef.current(action);
      }
      return;
    }

    const conn = clientConnRef.current;
    if (conn && conn.open) {
      try {
        const msg: PeerMessage = {
          type: 'DISPATCH',
          action,
          timestamp: Date.now(),
        };
        conn.send(msg);
      } catch (e) {
        console.error('[PeerSync] Error sending action to host', e);
      }
    } else {
      console.warn('[PeerSync] Client not connected to host, action cannot be sent');
    }
  }, [isHost]);

  // Request state from host (Client only)
  const requestState = useCallback(() => {
    const conn = clientConnRef.current;
    if (conn && conn.open) {
      conn.send({ type: 'REQUEST_STATE', timestamp: Date.now() });
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
    let reconnectAttempts = 0;

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

    try {
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
        } else {
          // Connect to the host
          console.log(`[PeerSync] Connecting to host peer ${hostPeerId}...`);
          const conn = peer.connect(hostPeerId, {
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
          });

          conn.on('data', (data: any) => {
            if (isDestroyed) return;
            const msg = data as PeerMessage;
            if (msg.type === 'SYNC_STATE' && msg.state) {
              if (onRemoteStateUpdateRef.current) {
                onRemoteStateUpdateRef.current(msg.state, msg.language);
              }
            } else if (msg.type === 'PONG' && msg.timestamp) {
              const rtt = Date.now() - msg.timestamp;
              setLatency(rtt);
            }
          });

          conn.on('close', () => {
            if (isDestroyed) return;
            console.warn('[PeerSync] Connection to host closed');
            setStatus('disconnected');
            setLatency(null);
          });

          conn.on('error', (err) => {
            if (isDestroyed) return;
            console.warn('[PeerSync] Client connection error:', err);
            setStatus('error');
            setErrorMessage(err?.message || '連線錯誤');
          });
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

            // Send current game state to client
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
              if (onRemoteDispatchRef.current) {
                onRemoteDispatchRef.current(msg.action);
              }
            } else if (msg.type === 'REQUEST_STATE') {
              conn.send({
                type: 'SYNC_STATE',
                state: currentStateRef.current,
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

        // Transient signaling server disconnect - should not be treated as fatal error
        if (errType === 'network' || errType === 'server-error' || errType === 'socket-closed' || errType === 'socket-error' || msg.includes('Lost connection to server')) {
          console.log('[PeerSync] Signaling server connection lost temporarily; will reconnect automatically');
          scheduleReconnect();
          return;
        }

        if (errType === 'unavailable-id') {
          console.warn('[PeerSync] Room code already in use on signaling server:', err);
          setErrorMessage('房間代碼已被佔用，請重新生成或換一組代碼');
          setStatus('error');
        } else if (errType === 'peer-unavailable') {
          console.log('[PeerSync] Host not found yet:', err);
          setErrorMessage('找不到遠端記分板，請確認記分板畫面已開啟且代碼正確');
          setStatus('error');
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

    // Ping interval for client to measure latency
    let pingInterval: any = null;
    if (!isHost) {
      pingInterval = setInterval(() => {
        const conn = clientConnRef.current;
        if (conn && conn.open) {
          conn.send({ type: 'PING', timestamp: Date.now() });
        }
      }, 5000);
    }

    return () => {
      isDestroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
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
