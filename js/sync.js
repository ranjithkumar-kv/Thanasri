/* ==========================================================================
   Thanu's WorkSpace - Universal Real-Time Synchronization Engine
   Two-Device Live Collaboration:
   - "Wish to Know" Whiteboard (Live drawing & slide sync)
   - "Stress Buster" XO Game (Online 2P Turn-by-Turn)
   - "Word Bridge" Words Game (Cooperative Word Solving)
   
   Architecture:
   1. MQTT over Secure WebSockets (WSS) across the Internet
      Primary Broker: wss://broker.emqx.io:8084/mqtt
      Secondary Broker: wss://broker.hivemq.com:8884/mqtt
   2. BroadcastChannel (Instant local sync between browser tabs/windows)
   ========================================================================== */

class WorkspaceSyncEngine {
  constructor() {
    // 1. Identity & Room Configuration
    this.deviceId = this.getOrCreateDeviceId();
    this.roomCode = this.resolveRoomCode();
    this.userRole = this.resolveUserRole(); // 'rk' (Player 1) or 'thanu' (Player 2)
    this.topic = `thanu_workspace_sync_v1/${this.roomCode}`;

    // 2. State & Peer Tracking
    this.isConnected = false;
    this.partnerOnline = false;
    this.partnerName = this.userRole === 'thanu' ? 'RK 💙' : 'Thanu 💜';
    this.lastPartnerPing = 0;
    this.activePeersCount = 1;
    this.recentMessageIds = new Set();
    this.listeners = {};

    // Legacy Whiteboard callback compatibility
    this.onRemoteStroke = null;
    this.onRemoteSlideChange = null;
    this.onRemoteClear = null;
    this.onRemoteCursor = null;
    this.onPeerCountChange = null;

    // 3. Transports
    this.broadcastChannel = null;
    this.mqttClient = null;
    this.heartbeatTimer = null;
    this.watchdogTimer = null;

    // Initialize Channels
    this.initBroadcastChannel();
    this.initMqtt();
    this.startHeartbeat();
    this.initUiBindings();
  }

  /* --------------------------------------------------------------------------
     Identity & Room Setup
     -------------------------------------------------------------------------- */
  getOrCreateDeviceId() {
    let id = sessionStorage.getItem('thanu_sync_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('thanu_sync_device_id', id);
    }
    return id;
  }

  resolveRoomCode() {
    // URL param has highest priority: ?room=abc or #room=abc
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('room');
    if (!code && window.location.hash.includes('room=')) {
      const match = window.location.hash.match(/room=([a-zA-Z0-9_-]+)/);
      if (match) code = match[1];
    }
    if (!code) {
      code = localStorage.getItem('thanu_sync_room_code') || 'thanu-and-me-forever';
    }
    return code.trim().toLowerCase();
  }

  resolveUserRole() {
    // URL param has highest priority: ?role=thanu or ?role=rk
    const urlParams = new URLSearchParams(window.location.search);
    let role = urlParams.get('role');
    if (!role && window.location.hash.includes('role=')) {
      const match = window.location.hash.match(/role=(thanu|rk|me)/i);
      if (match) role = match[1];
    }
    if (!role) {
      role = localStorage.getItem('thanu_sync_user_role') || 'rk';
    }
    return role.toLowerCase() === 'thanu' ? 'thanu' : 'rk';
  }

  getUserDisplayName() {
    return this.userRole === 'thanu' ? 'Thanu 💜' : 'RK 💙';
  }

  getPartnerDisplayName() {
    return this.userRole === 'thanu' ? 'RK 💙' : 'Thanu 💜';
  }

  setRole(newRole) {
    this.userRole = (newRole || '').toLowerCase() === 'thanu' ? 'thanu' : 'rk';
    localStorage.setItem('thanu_sync_user_role', this.userRole);
    this.updateUiStatus();
    this.sendPresence(true);
    if (window.app) {
      window.app.showToast(`Set your profile as: ${this.getUserDisplayName()} 👤`);
    }
  }

  setRoomCode(newRoom) {
    const cleaned = (newRoom || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleaned) return;
    if (cleaned === this.roomCode) return;

    this.roomCode = cleaned;
    localStorage.setItem('thanu_sync_room_code', this.roomCode);
    this.topic = `thanu_workspace_sync_v1/${this.roomCode}`;

    // Re-subscribe MQTT & reopen BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
    }
    this.initBroadcastChannel();

    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.end(true, () => {
        this.initMqtt();
      });
    } else {
      this.initMqtt();
    }

    this.updateUiStatus();
    if (window.app) {
      window.app.showToast(`Switched Room to: "${this.roomCode}" 🔗`);
    }
  }

  /* --------------------------------------------------------------------------
     Transport 1: BroadcastChannel (Local Tabs/Windows)
     -------------------------------------------------------------------------- */
  initBroadcastChannel() {
    if ('BroadcastChannel' in window) {
      try {
        const bcName = `thanu_workspace_bc_${this.roomCode}`;
        this.broadcastChannel = new BroadcastChannel(bcName);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingPacket(event.data, 'local-tab');
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  /* --------------------------------------------------------------------------
     Transport 2: MQTT over Secure WebSockets (Internet Cross-Device)
     -------------------------------------------------------------------------- */
  initMqtt() {
    // Check if MQTT library is loaded
    if (typeof mqtt === 'undefined') {
      console.warn('MQTT.js library not loaded yet. Retrying in 500ms...');
      setTimeout(() => this.initMqtt(), 500);
      return;
    }

    const clientId = `thanu_${this.userRole}_${Math.random().toString(36).substring(2, 8)}`;
    const brokerUrls = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];

    let currentBrokerIndex = 0;

    const connectToBroker = (index) => {
      const brokerUrl = brokerUrls[index];
      console.log(`Connecting to Real-time Sync Broker: ${brokerUrl}`);

      try {
        this.mqttClient = mqtt.connect(brokerUrl, {
          clientId: clientId,
          clean: true,
          connectTimeout: 8000,
          reconnectPeriod: 4000,
          keepalive: 30
        });

        this.mqttClient.on('connect', () => {
          console.log(`✨ Connected to Real-time Sync Broker (${brokerUrl})`);
          this.isConnected = true;
          this.updateUiStatus();

          // Subscribe to shared room topic
          this.mqttClient.subscribe(this.topic, { qos: 1 }, (err) => {
            if (!err) {
              console.log(`Subscribed to topic: ${this.topic}`);
              // Announce presence immediately
              this.sendPresence(true);
            } else {
              console.warn('Subscribe error:', err);
            }
          });
        });

        this.mqttClient.on('message', (topic, message) => {
          if (topic === this.topic) {
            try {
              const packet = JSON.parse(message.toString());
              this.handleIncomingPacket(packet, 'mqtt');
            } catch (e) {
              console.warn('Failed to parse incoming sync packet:', e);
            }
          }
        });

        this.mqttClient.on('error', (err) => {
          console.warn(`MQTT connection error on ${brokerUrl}:`, err);
        });

        this.mqttClient.on('close', () => {
          this.isConnected = false;
          this.updateUiStatus();
        });

        this.mqttClient.on('offline', () => {
          this.isConnected = false;
          this.updateUiStatus();
        });

      } catch (err) {
        console.warn('Failed to initiate MQTT client:', err);
      }
    };

    connectToBroker(0);
  }

  /* --------------------------------------------------------------------------
     Heartbeat & Presence System
     -------------------------------------------------------------------------- */
  startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    clearInterval(this.watchdogTimer);

    // Send presence ping every 7 seconds
    this.heartbeatTimer = setInterval(() => {
      this.sendPresence(false);
    }, 7000);

    // Watchdog check every 3 seconds to detect partner timeout
    this.watchdogTimer = setInterval(() => {
      if (this.partnerOnline && Date.now() - this.lastPartnerPing > 18000) {
        this.partnerOnline = false;
        this.updatePeerCount(1);
        this.updateUiStatus();
      }
    }, 3000);
  }

  sendPresence(isImmediateResponse = false) {
    this.broadcast('PRESENCE', {
      senderRole: this.userRole,
      senderName: this.getUserDisplayName(),
      isResponse: isImmediateResponse
    });
  }

  /* --------------------------------------------------------------------------
     Publishing / Broadcasting
     -------------------------------------------------------------------------- */
  broadcast(type, payload = {}, qos = 1) {
    const packetId = 'msg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    this.recentMessageIds.add(packetId);

    const packet = {
      id: packetId,
      type: type,
      payload: payload,
      senderId: this.deviceId,
      senderRole: this.userRole,
      senderName: this.getUserDisplayName(),
      timestamp: Date.now()
    };

    // 1. Broadcast locally across tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch (e) {}
    }

    // 2. Broadcast across internet via MQTT WebSockets
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(this.topic, JSON.stringify(packet), { qos: qos });
      } catch (e) {
        console.warn('MQTT publish error:', e);
      }
    }
  }

  /* --------------------------------------------------------------------------
     Incoming Packet Router
     -------------------------------------------------------------------------- */
  handleIncomingPacket(packet, source) {
    if (!packet || !packet.type) return;

    // Ignore echoes from self
    if (packet.senderId === this.deviceId) return;

    // Deduplicate packets received from multiple transports
    if (packet.id) {
      if (this.recentMessageIds.has(packet.id)) return;
      this.recentMessageIds.add(packet.id);
      if (this.recentMessageIds.size > 300) {
        const first = this.recentMessageIds.values().next().value;
        this.recentMessageIds.delete(first);
      }
    }

    // Presence & Heartbeat handler
    if (packet.type === 'PRESENCE') {
      const wasOnline = this.partnerOnline;
      this.partnerOnline = true;
      this.lastPartnerPing = Date.now();
      this.partnerName = packet.senderName || (packet.senderRole === 'thanu' ? 'Thanu 💜' : 'Partner');
      this.updatePeerCount(2);
      this.updateUiStatus();

      // If partner just joined or requested presence, respond back so they know we're here
      if (!wasOnline || packet.payload?.isResponse === false) {
        if (!packet.payload?.isResponse) {
          setTimeout(() => this.sendPresence(true), 250);
        }
      }
      return;
    }

    // Module-specific event routing
    this.dispatchToListeners(packet.type, packet.payload, packet);

    // Legacy Whiteboard callback dispatch
    switch (packet.type) {
      case 'WB_STROKE':
        if (this.onRemoteStroke) this.onRemoteStroke(packet.payload);
        break;
      case 'WB_SEND_ART':
        if (this.onRemoteSendArt) this.onRemoteSendArt(packet.payload);
        break;
      case 'WB_LIVE_START':
        if (this.onRemoteLiveStart) this.onRemoteLiveStart(packet.payload);
        break;
      case 'WB_LIVE_CHUNK':
        if (this.onRemoteLiveChunk) this.onRemoteLiveChunk(packet.payload);
        break;
      case 'WB_LIVE_END':
        if (this.onRemoteLiveEnd) this.onRemoteLiveEnd(packet.payload);
        break;
      case 'WB_CLEAR':
        if (this.onRemoteClear) this.onRemoteClear(packet.payload);
        break;
      case 'WB_SLIDE':
        if (this.onRemoteSlideChange) this.onRemoteSlideChange(packet.payload);
        break;
      case 'WB_CURSOR':
        if (this.onRemoteCursor) this.onRemoteCursor(packet.payload);
        break;
    }
  }

  /* --------------------------------------------------------------------------
     Event Pub/Sub for Modules
     -------------------------------------------------------------------------- */
  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  off(eventType, callback) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
  }

  dispatchToListeners(eventType, payload, fullPacket) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(cb => {
        try {
          cb(payload, fullPacket);
        } catch (err) {
          console.error(`Error in sync listener for ${eventType}:`, err);
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     Module 1: Whiteboard Sync Helpers
     -------------------------------------------------------------------------- */
  sendStroke(arg1, arg2) {
    if (arg1 && arg1.stroke !== undefined) {
      this.broadcast('WB_STROKE', { stroke: arg1.stroke, slideIndex: arg1.slideIndex }, 1);
    } else {
      this.broadcast('WB_STROKE', { stroke: arg1, slideIndex: arg2 }, 1);
    }
  }

  sendLiveStart(payload) {
    this.broadcast('WB_LIVE_START', payload, 0);
  }

  sendLiveChunk(payload) {
    this.broadcast('WB_LIVE_CHUNK', payload, 0);
  }

  sendLiveEnd(payload) {
    this.broadcast('WB_LIVE_END', payload, 1);
  }

  sendArt(data) {
    this.broadcast('WB_SEND_ART', data, 1);
  }

  sendClear(slideId) {
    this.broadcast('WB_CLEAR', { slideId });
  }

  sendSlideChange(slideIndex) {
    this.broadcast('WB_SLIDE', { slideIndex });
  }

  sendCursor(nx, ny) {
    const now = Date.now();
    if (this._lastCursorSend && now - this._lastCursorSend < 40) return;
    this._lastCursorSend = now;
    this.broadcast('WB_CURSOR', { nx, ny }, 0);
  }

  requestWhiteboardState() {
    this.broadcast('WB_REQ_STATE', {});
  }

  sendWhiteboardState(slides, activeSlideIndex) {
    this.broadcast('WB_RES_STATE', { slides, activeSlideIndex });
  }

  /* --------------------------------------------------------------------------
     Module 2: XO Game Sync Helpers
     -------------------------------------------------------------------------- */
  sendXOMove(index, player, nextPlayer) {
    this.broadcast('XO_MOVE', { index, player, nextPlayer });
  }

  sendXOReset(starter) {
    this.broadcast('XO_RESET', { starter });
  }

  sendXOSync(state) {
    this.broadcast('XO_SYNC', state);
  }

  /* --------------------------------------------------------------------------
     Module 3: Word Bridge Game Sync Helpers
     -------------------------------------------------------------------------- */
  sendWordPair(startChar, endChar, pairKey) {
    this.broadcast('WORD_PAIR', { startChar, endChar, pairKey });
  }

  sendWordFound(word, points, finderName) {
    this.broadcast('WORD_FOUND', { word, points, finderName: finderName || this.getUserDisplayName() });
  }

  sendWordReset() {
    this.broadcast('WORD_RESET', {});
  }

  /* --------------------------------------------------------------------------
     UI Indicators & Status Binding
     -------------------------------------------------------------------------- */
  updatePeerCount(count) {
    this.activePeersCount = Math.max(count, 1);
    if (this.onPeerCountChange) {
      this.onPeerCountChange(this.activePeersCount);
    }
  }

  updateUiStatus() {
    // 1. Top Header Sync Badge Pill
    const headerPill = document.getElementById('top-sync-pill');
    const headerPillText = document.getElementById('top-sync-status-text');
    const headerPillDot = document.getElementById('top-sync-dot');

    if (headerPill && headerPillText) {
      if (this.partnerOnline) {
        headerPill.className = 'top-sync-pill online';
        headerPillText.textContent = `Live: ${this.partnerName}`;
        if (headerPillDot) headerPillDot.style.background = '#22c55e';
      } else if (this.isConnected) {
        headerPill.className = 'top-sync-pill waiting';
        headerPillText.textContent = `Online • Waiting for ${this.getPartnerDisplayName()}`;
        if (headerPillDot) headerPillDot.style.background = '#eab308';
      } else {
        headerPill.className = 'top-sync-pill offline';
        headerPillText.textContent = `Connecting...`;
        if (headerPillDot) headerPillDot.style.background = '#94a3b8';
      }
    }

    // 2. Whiteboard Live Sync Indicator
    const wbPeerCount = document.getElementById('wb-peer-count');
    const wbSyncDot = document.querySelector('#wb-sync-indicator .sync-dot');
    if (wbPeerCount) {
      if (this.partnerOnline) {
        wbPeerCount.textContent = `Live with ${this.partnerName}`;
        if (wbSyncDot) wbSyncDot.style.background = '#22c55e';
      } else if (this.isConnected) {
        wbPeerCount.textContent = `Live Sync Ready (1 peer)`;
        if (wbSyncDot) wbSyncDot.style.background = '#eab308';
      } else {
        wbPeerCount.textContent = `Connecting...`;
        if (wbSyncDot) wbSyncDot.style.background = '#94a3b8';
      }
    }

    // 3. Modal Form Elements (if open)
    const modalRoomInput = document.getElementById('sync-room-input');
    if (modalRoomInput && document.activeElement !== modalRoomInput) {
      modalRoomInput.value = this.roomCode;
    }
    const roleMeRadio = document.getElementById('role-me-radio');
    const roleThanuRadio = document.getElementById('role-thanu-radio');
    if (roleMeRadio && roleThanuRadio) {
      roleMeRadio.checked = this.userRole !== 'thanu';
      roleThanuRadio.checked = this.userRole === 'thanu';
    }
    const partnerStatusEl = document.getElementById('modal-partner-status');
    if (partnerStatusEl) {
      if (this.partnerOnline) {
        partnerStatusEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;">🟢 ${this.partnerName} is Online and Connected!</span>`;
      } else {
        partnerStatusEl.innerHTML = `<span style="color: #ca8a04; font-weight: 600;">🟡 Waiting for partner to open the page...</span>`;
      }
    }
  }

  initUiBindings() {
    // Bind click on top header sync pill to open Pairing Modal
    const pill = document.getElementById('top-sync-pill');
    if (pill) {
      pill.addEventListener('click', () => this.openPairModal());
    }

    // Modal close & save handlers
    const closeBtn = document.getElementById('sync-pair-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePairModal());
    }

    const saveBtn = document.getElementById('sync-room-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('sync-room-input');
        if (input) {
          this.setRoomCode(input.value);
        }
        const roleMeRadio = document.getElementById('role-me-radio');
        if (roleMeRadio) {
          this.setRole(roleMeRadio.checked ? 'rk' : 'thanu');
        }
        this.closePairModal();
      });
    }

    const copyBtn = document.getElementById('sync-copy-link-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const targetRole = this.userRole === 'thanu' ? 'rk' : 'thanu';
        const url = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}&role=${targetRole}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            if (window.app) window.app.showToast(`Copied invite link for ${this.getPartnerDisplayName()}! 📋`);
          });
        }
      });
    }

    // Initial update
    setTimeout(() => this.updateUiStatus(), 150);
  }

  openPairModal() {
    const modal = document.getElementById('sync-pair-modal');
    if (modal) {
      modal.classList.add('active');
      this.updateUiStatus();
    }
  }

  closePairModal() {
    const modal = document.getElementById('sync-pair-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

// Global aliases for full compatibility
window.WorkspaceSyncEngine = WorkspaceSyncEngine;
window.WhiteboardSyncEngine = WorkspaceSyncEngine;
