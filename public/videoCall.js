// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Global variables
let socket;
let localStream;
let screenStream;
let peers = new Map();
let roomId;
let userName;
let userType;
let userId;
let appointmentId;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isScreenSharing = false;

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleAudioBtn = document.getElementById('toggleAudio');
const screenShareBtn = document.getElementById('screenShare');
const toggleChatBtn = document.getElementById('toggleChat');
const leaveRoomBtn = document.getElementById('leaveRoom');
const chatSidebar = document.getElementById('chatSidebar');
const participantsSidebar = document.getElementById('participantsSidebar');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const participantsList = document.getElementById('participantsList');
const participantsCount = document.getElementById('participantsCount');
const roomIdDisplay = document.getElementById('roomId');
const userTypeDisplay = document.getElementById('userType');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeError');
const waitingMessage = document.getElementById('waitingMessage');

// Initialize the room
async function initRoom() {
    // Get data from server
    const roomData = window.roomData;
    if (!roomData) {
        showError('Missing room information. Please go back and try again.');
        return;
    }

    roomId = roomData.roomId;
    userName = roomData.userName;
    userType = roomData.userType;
    userId = roomData.userId;
    appointmentId = roomData.appointmentId;

    roomIdDisplay.textContent = roomId;
    userTypeDisplay.textContent = userType === 'doctor' ? 'Doctor' : 'Patient';

    // Validate room before connecting
    try {
        const response = await fetch(`/api/video-call/room/${roomId}/validate`);
        const data = await response.json();
        
        if (!data.success || !data.canRejoin) {
            showError(data.message || 'Room validation failed. Please return to your appointments and try again.');
            return;
        }
    } catch (error) {
        console.error('Error validating room:', error);
        showError('Unable to validate room. Please check your connection and try again.');
        return;
    }

    socket = io({
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
    });
    setupSocketListeners();

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        addVideoStream('local', localStream, userName, true);
        socket.emit('join-video-room', { roomId, userId, userName, userType });
        loadingOverlay.classList.add('hidden');
        updateWaitingMessage(); // Show waiting message initially
    } catch (error) {
        console.error('Error accessing media devices:', error);
        showError('Unable to access camera/microphone. Please check permissions.');
    }
}

function setupSocketListeners() {
    socket.on('user-joined-video', async ({ socketId, userId: remoteUserId, userName: remoteName, userType: remoteUserType }) => {
        console.log(`User joined video call: ${remoteName} (${remoteUserType}) with socket ID: ${socketId}`);
        addParticipant(socketId, remoteName, remoteUserType);
        updateParticipantsCount();
    });

    socket.on('user-left-video', ({ socketId, userName }) => {
        console.log(`User left video call: ${userName} with socket ID: ${socketId}`);
        removeParticipant(socketId);
        removeVideoStream(socketId);
        updateParticipantsCount();
    });

    socket.on('video-room-participants', async (participants) => {
        console.log('Current room participants:', participants);
        for (const participant of participants) {
            addParticipant(participant.socketId, participant.userName, participant.userType);
            await createAndSendOffer(participant.socketId, participant.userName);
        }
        updateParticipantsCount();
    });

    socket.on('video-offer', async ({ from, offer, userName }) => {
        console.log('Received offer from:', from);
        await handleOffer(from, offer, userName);
    });

    socket.on('video-answer', async ({ from, answer }) => {
        const peer = peers.get(from);
        if (peer && peer.connection) {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    socket.on('video-ice-candidate', async ({ from, candidate }) => {
        const peer = peers.get(from);
        if (peer && peer.connection) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    socket.on('video-chat-message', ({ message, userName, timestamp }) => {
        addChatMessage(userName, message, timestamp);
    });

    socket.on('video-screen-share-start', ({ socketId }) => {
        console.log('Screen sharing started by:', socketId);
    });

    socket.on('video-screen-share-stop', ({ socketId }) => {
        console.log('Screen sharing stopped by:', socketId);
    });

    socket.on('video-call-ended', ({ roomId }) => {
        showError('The video call has ended.');
        setTimeout(() => {
            window.history.back();
        }, 3000);
    });

    socket.on('connect', () => console.log('Connected to server'));
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showError('Connection lost. Attempting to reconnect...');
    });
    socket.on('reconnect', () => {
        console.log('Reconnected to server');
        // Rejoin the room after reconnection
        socket.emit('join-video-room', { roomId, userId, userName, userType });
        // Clear any error messages
        const errorModal = document.getElementById('errorModal');
        if (errorModal && !errorModal.classList.contains('hidden')) {
            errorModal.classList.add('hidden');
        }
    });
    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
    });
    socket.on('reconnect_failed', () => {
        showError('Failed to reconnect. Please refresh the page.');
    });
}

function addVideoStream(userId, stream, name, isLocal = false) {
    // Remove existing video container if it exists
    const existingContainer = document.getElementById(`video-${userId}`);
    if (existingContainer) {
        existingContainer.remove();
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${userId}`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;

    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    overlay.textContent = name;

    videoContainer.appendChild(video);
    videoContainer.appendChild(overlay);

    videoGrid.appendChild(videoContainer);

    if (!isLocal) {
        if (!peers.has(userId)) {
            peers.set(userId, { stream, name });
        } else {
            const peer = peers.get(userId);
            peer.stream = stream;
            peer.name = name;
        }
    }

    // Always move the local video to the end
    const localVideoContainer = document.getElementById('video-local');
    if (localVideoContainer) {
        videoGrid.appendChild(localVideoContainer);
    }

    console.log(`Added video stream for ${userId}: ${name} (${isLocal ? 'local' : 'remote'})`);
    console.log(`Total videos in grid: ${videoGrid.children.length}`);
}

function removeVideoStream(userId) {
    const videoContainer = document.getElementById(`video-${userId}`);
    if (videoContainer) videoContainer.remove();
    peers.delete(userId);
}

function addParticipant(userId, name, userType) {
    const participantItem = document.createElement('div');
    participantItem.className = 'participant-item';
    participantItem.id = `participant-${userId}`;

    const avatar = document.createElement('div');
    avatar.className = 'participant-avatar';
    avatar.textContent = name.charAt(0).toUpperCase();

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${name} (${userType === 'doctor' ? 'Doctor' : 'Patient'})`;

    participantItem.appendChild(avatar);
    participantItem.appendChild(nameSpan);
    participantsList.appendChild(participantItem);
}

function removeParticipant(userId) {
    const participantItem = document.getElementById(`participant-${userId}`);
    if (participantItem) participantItem.remove();
}

function updateParticipantsCount() {
    participantsCount.textContent = participantsList.children.length + 1;
    updateWaitingMessage();
}

function updateWaitingMessage() {
    const totalParticipants = participantsList.children.length + 1; // +1 for local user
    if (totalParticipants === 1) {
        waitingMessage.classList.remove('hidden');
    } else {
        waitingMessage.classList.add('hidden');
    }
    console.log(`Total participants: ${totalParticipants}, Waiting message ${waitingMessage.classList.contains('hidden') ? 'hidden' : 'visible'}`);
}

async function createPeerConnection(userId) {
    const peerConnection = new RTCPeerConnection(configuration);
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('video-ice-candidate', {
                to: userId,
                candidate: event.candidate
            });
        }
    };
    
    peerConnection.ontrack = (event) => {
        console.log(`Received track from ${userId}:`, event);
        const [stream] = event.streams;
        if (stream) {
            const peer = peers.get(userId);
            const displayName = peer && peer.name ? peer.name : 'Unknown User';
            console.log(`Adding remote video stream for ${userId}: ${displayName}`);
            addVideoStream(userId, stream, displayName, false);
        }
    };

    // Add local stream tracks to the peer connection
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    return peerConnection;
}

async function createAndSendOffer(userId, remoteName) {
    const peerConnection = await createPeerConnection(userId);
    peers.set(userId, { connection: peerConnection, name: remoteName });

    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('video-offer', {
            to: userId,
            offer: offer,
            userName: userName
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

async function handleOffer(userId, offer, remoteName = 'Unknown') {
    const peerConnection = await createPeerConnection(userId);
    peers.set(userId, { connection: peerConnection, name: remoteName });

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('video-answer', {
            to: userId,
            answer: answer
        });
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

// Control functions
function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            isVideoEnabled = videoTrack.enabled;
            toggleVideoBtn.classList.toggle('active', !isVideoEnabled);
        }
    }
}

function toggleAudio() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            isAudioEnabled = audioTrack.enabled;
            toggleAudioBtn.classList.toggle('active', !isAudioEnabled);
        }
    }
}

async function toggleScreenShare() {
    if (!isScreenSharing) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            for (const [userId, peer] of peers) {
                if (peer.connection) {
                    const sender = peer.connection.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }
            }
            
            // Update local video
            const localVideo = document.querySelector('#video-local video');
            if (localVideo) {
                localVideo.srcObject = screenStream;
            }
            
            isScreenSharing = true;
            screenShareBtn.classList.add('active');
            socket.emit('video-screen-share-start', { roomId });
            
            videoTrack.onended = stopScreenShare;
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    } else {
        stopScreenShare();
    }
}

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    
    // Restore camera video
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        for (const [userId, peer] of peers) {
            if (peer.connection) {
                const sender = peer.connection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            }
        }
        
        const localVideo = document.querySelector('#video-local video');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
    }
    
    isScreenSharing = false;
    screenShareBtn.classList.remove('active');
    socket.emit('video-screen-share-stop', { roomId });
}

function toggleChat() {
    chatSidebar.classList.toggle('open');
}

function toggleParticipants() {
    participantsSidebar.classList.toggle('open');
}

function addChatMessage(userName, message, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = `${userName} - ${new Date(timestamp).toLocaleTimeString()}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && socket) {
        socket.emit('video-chat-message', { roomId, message, userName });
        messageInput.value = '';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

function leaveRoom() {
    if (socket) {
        // If user is doctor, use the proper endpoint to end the session
        if (userType === 'doctor') {
            fetch('/api/video-call/end-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    doctorId: userId
                })
            }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Session ended successfully by doctor');
                } else {
                    console.error('Error ending session:', data.message);
                }
            }).catch(error => {
                console.error('Error ending session:', error);
            });
        }
        // For patients, just disconnect from the room without ending it
        // The room will remain active for rejoining
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
    }
    
    // Navigate back to previous page instead of closing window
    window.history.back();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    toggleVideoBtn.addEventListener('click', toggleVideo);
    toggleAudioBtn.addEventListener('click', toggleAudio);
    screenShareBtn.addEventListener('click', toggleScreenShare);
    toggleChatBtn.addEventListener('click', toggleChat);
    leaveRoomBtn.addEventListener('click', leaveRoom);
    
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    closeErrorBtn.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });
    
    // Add closeChat event listener for the chat sidebar cross button
    document.getElementById('closeChat').addEventListener('click', toggleChat);
    
    // Initialize the room
    initRoom();
}); 