# Video Call Integration for Healing-Hand

This document explains how the video call feature has been integrated into the Healing-Hand project.

## Overview

The video call feature allows doctors to start video consultations with their patients. The system automatically handles room creation and management, so users don't need to manually exchange room IDs.

## How It Works

### For Doctors:
1. **View Appointments**: Go to `/doctor/docHome/appointments` to see scheduled appointments
2. **Start Video Call**: Click "Start Video Call" button for any pending appointment
3. **Join Meeting**: Click "Join Video Call" to enter the video consultation room
4. **End Call**: Use the red phone button to end the call (only the doctor can end the session for everyone)

### For Patients:
1. **View Appointments**: Go to `/patient/bookedAppointments` to see your appointments
2. **Wait for Doctor**: You'll see "Waiting for doctor to start call" for pending appointments
3. **Join When Ready**: Once the doctor starts the call, you'll see a "Join Video Call" button
4. **Enter Meeting**: Click the button to join the video consultation

## Features

- **Real-time Video/Audio**: High-quality peer-to-peer communication
- **Chat**: Text messaging during video calls
- **Screen Sharing**: Share your screen with the other participant
- **Media Controls**: Toggle video/audio on/off
- **Automatic Room Management**: No manual room ID exchange needed. Rooms persist until the doctor ends the call or after a timeout (e.g., 48 hours of inactivity).
- **Responsive Design**: Works on desktop and mobile devices

## Technical Implementation

### Backend Changes:
- **app.js**: Added Socket.IO server, video call routes, and room management
- **Models**: Updated appointment schema to include video call fields
- **Routes**: Added video call status checking endpoints
- **Room Persistence**: Room metadata is stored in the database for session persistence. If a room is not found in memory (e.g., after a server restart), it is restored from the database when accessed.

### Frontend Changes:
- **Views**: Updated doctor and patient appointment views with video call buttons
- **CSS**: Added styling for video call interface and buttons
- **JavaScript**: Created video call interface with WebRTC functionality

### Key Files:
- `views/videoCall.ejs`: Video call interface template
- `public/videoCall.css`: Video call styling
- `public/videoCall.js`: WebRTC and Socket.IO client logic
- `views/doctorAppointments.ejs`: Updated with video call buttons
- `views/patientBookedAppointments.ejs`: Updated with video call functionality

## API Endpoints

### Start Video Call
- **POST** `/api/video-call/start`
- **Body**: `{ "appointmentId": "string", "doctorId": "string" }`
- **Response**: `{ "success": true, "roomId": "string" }`

### Get Room Info
- **GET** `/api/video-call/room/:roomId`
- **Response**: `{ "success": true, "room": {...} }`

### Check Video Call Status
- **GET** `/api/video-call/appointment/:appointmentId/status?doctorId=:doctorId`
- **Response**: `{ "success": true, "isVideoCallActive": boolean, "roomId": "string" }`

### Video Call Interface
- **GET** `/video-call/:roomId?userType=:userType&appointmentId=:appointmentId`

## Socket.IO Events

### Client to Server:
- `join-video-room`: Join a video call room
- `video-offer`: Send WebRTC offer
- `video-answer`: Send WebRTC answer
- `video-ice-candidate`: Send ICE candidate
- `video-chat-message`: Send chat message
- `video-screen-share-start`: Start screen sharing
- `video-screen-share-stop`: Stop screen sharing
- `end-video-call`: End the video call (only the doctor can end the session for everyone)

### Server to Client:
- `user-joined-video`: New user joined the room
- `user-left-video`: User left the room
- `video-room-participants`: Current room participants
- `video-offer`: Receive WebRTC offer
- `video-answer`: Receive WebRTC answer
- `video-ice-candidate`: Receive ICE candidate
- `video-chat-message`: Receive chat message
- `video-screen-share-start`: Screen sharing started
- `video-screen-share-stop`: Screen sharing stopped
- `video-call-ended`: Video call has ended

## Dependencies Added

- `socket.io`: Real-time communication
- `uuid`: Generate unique room IDs

## Installation

1. Install dependencies:
   ```bash
   npm install socket.io uuid
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Usage Flow

1. **Patient books appointment** → Appointment is created in database
2. **Doctor views appointments** → Sees pending appointments with "Start Video Call" button
3. **Doctor starts video call** → Room is created, appointment is updated with room info
4. **Patient's view updates** → "Join Video Call" button appears automatically
5. **Both join the call** → Video consultation begins
6. **Call ends** → Room is cleaned up when the doctor ends the session or after a timeout

## Security Considerations

- Video calls are peer-to-peer using WebRTC
- Room IDs are generated using UUID v4
- Room metadata is stored in the database for session persistence, but no video/audio/chat content is stored
- Rooms are cleaned up when the doctor ends the call or after a timeout
