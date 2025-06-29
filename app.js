const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active video call rooms
const activeRooms = new Map();
const connectedUsers = new Map();

// Restore active rooms from database on server start
async function restoreActiveRooms() {
    try {
        const Doctor = require('./models/docRegister');
        const doctors = await Doctor.find({
            'appointments.isVideoCallActive': true,
            'appointments.roomId': { $exists: true, $ne: null }
        });
        
        for (const doctor of doctors) {
            for (const appointment of doctor.appointments) {
                if (appointment.isVideoCallActive && appointment.roomId) {
                    activeRooms.set(appointment.roomId, {
                        roomId: appointment.roomId,
                        appointmentId: appointment._id.toString(),
                        doctorId: doctor._id.toString(),
                        patientId: appointment.patientId.toString(),
                        participants: [],
                        createdAt: appointment.videoCallStartedAt || new Date()
                    });
                    console.log(`Restored active room: ${appointment.roomId} for appointment ${appointment._id}`);
                }
            }
        }
        console.log(`Restored ${activeRooms.size} active video call rooms from database`);
    } catch (error) {
        console.error('Error restoring active rooms:', error);
    }
}

// Call restore function after database connection
mongoose.connection.once('open', () => {
    console.log('MongoDB connected successfully');
    restoreActiveRooms();
});

// Room cleanup interval (clean up rooms older than 48 hours)
setInterval(() => {
    const now = new Date();
    for (const [roomId, room] of activeRooms.entries()) {
        const roomAge = now - room.createdAt;
        if (roomAge > 48 * 60 * 60 * 1000) { // 48 hours
            activeRooms.delete(roomId);
            console.log(`Cleaned up very old room: ${roomId} (${Math.round(roomAge / (60 * 60 * 1000))} hours old)`);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Sync active rooms with database every 5 minutes
setInterval(async () => {
    try {
        const Doctor = require('./models/docRegister');
        const doctors = await Doctor.find({
            'appointments.isVideoCallActive': true,
            'appointments.roomId': { $exists: true, $ne: null }
        });
        
        const dbRoomIds = new Set();
        for (const doctor of doctors) {
            for (const appointment of doctor.appointments) {
                if (appointment.isVideoCallActive && appointment.roomId) {
                    dbRoomIds.add(appointment.roomId);
                    
                    // Add to activeRooms if not already there
                    if (!activeRooms.has(appointment.roomId)) {
                        activeRooms.set(appointment.roomId, {
                            roomId: appointment.roomId,
                            appointmentId: appointment._id.toString(),
                            doctorId: doctor._id.toString(),
                            patientId: appointment.patientId.toString(),
                            participants: [],
                            createdAt: appointment.videoCallStartedAt || new Date()
                        });
                        console.log(`Synced missing room: ${appointment.roomId}`);
                    }
                }
            }
        }
        
        // Remove rooms from activeRooms that no longer exist in database
        for (const [roomId, room] of activeRooms.entries()) {
            if (!dbRoomIds.has(roomId)) {
                activeRooms.delete(roomId);
                console.log(`Removed orphaned room: ${roomId}`);
            }
        }
    } catch (error) {
        console.error('Error syncing active rooms:', error);
    }
}, 5 * 60 * 1000); // Check every 5 minutes

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
mongoose.connect('mongodb://localhost/healingHandDB');

const mainPage = require('./routes/index');
const { router: doctorRoutes } = require('./routes/doctorSignUp');
const { router: patientRoutes } = require('./routes/patientSignUp');
const patientHome = require('./routes/patientHome');
const docHome = require('./routes/docHome');
const patientProfile = require('./routes/patientProfile')
//const doctorProfile = require('./routes/doctorProfile')
const patientBlog = require('./routes/patientBlog')
const patientHealbot = require('./routes/healbot');
const patientRecords = require('./routes/patientRecords');
const doctorProfileRouter = require('./routes/doctorProfile');
const patientEmergency = require('./routes/emergency');
const patientAppointments = require('./routes/patientAppointments');

const appointments = require('./routes/appointments');

app.use('/',mainPage);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/patient/patientHome',patientHome);
app.use('/doctor/docHome',docHome);
app.use('/patient/profile',patientProfile);
app.use('/patient/blog',patientBlog);
app.use('/',patientHealbot);
app.use('/patient/records',patientRecords);
app.use('/doctor/docHome', doctorProfileRouter);
app.use('/patient/emergency',patientEmergency);
app.use('/patient', patientAppointments);

app.use('/patient/appointments',appointments);

//app.use('/doctor/profile',doctorProfile);

app.get('/api-key', (req, res) => {
   res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// Video Call Route
app.get('/video-call/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userType, appointmentId } = req.query;
    
    console.log(`Attempting to access video call room: ${roomId}`);
    console.log(`Active rooms in memory: ${activeRooms.size}`);
    console.log(`Active room IDs:`, Array.from(activeRooms.keys()));
    
    // Get room information from memory
    let room = activeRooms.get(roomId);
    
    // If room not in memory, try to restore it from database
    if (!room) {
      console.log(`Room ${roomId} not found in memory, checking database...`);
      const Doctor = require('./models/docRegister');
      const doctors = await Doctor.find({
        'appointments.roomId': roomId,
        'appointments.isVideoCallActive': true
      });
      
      if (doctors.length > 0) {
        const doctor = doctors[0];
        const appointment = doctor.appointments.find(apt => apt.roomId === roomId);
        
        if (appointment) {
          console.log(`Found room ${roomId} in database, restoring to memory...`);
          room = {
            roomId: appointment.roomId,
            appointmentId: appointment._id.toString(),
            doctorId: doctor._id.toString(),
            patientId: appointment.patientId.toString(),
            participants: [],
            createdAt: appointment.videoCallStartedAt || new Date()
          };
          activeRooms.set(roomId, room);
          console.log(`Room ${roomId} restored to memory`);
        }
      }
    }
    
    if (!room) {
      console.log(`Room ${roomId} not found in memory or database`);
      return res.render('videoCallError', { 
        error: 'Room not found or has expired',
        message: 'The video call room has expired or was not found. Please return to your appointments and try joining again.',
        canRetry: false
      });
    }
    
    console.log(`Room ${roomId} found, proceeding with video call setup`);
    
    // Check if doctor exists (basic validation)
    const Doctor = require('./models/docRegister');
    const doctor = await Doctor.findById(room.doctorId);
    if (!doctor) {
      return res.render('videoCallError', { 
        error: 'Doctor not found',
        message: 'The doctor associated with this appointment could not be found.',
        canRetry: false
      });
    }
    
    const appointment = doctor.appointments.id(room.appointmentId);
    
    // Get user information based on userType
    let userName = 'Unknown User';
    let userId = 'unknown';
    
    if (userType === 'doctor') {
      userName = doctor.name;
      userId = doctor._id.toString();
    } else if (userType === 'patient') {
      const Patient = require('./models/patientRegister');
      const patient = await Patient.findById(room.patientId);
      if (patient) {
        userName = patient.name;
        userId = patient._id.toString();
      }
    }
    
    console.log(`Rendering video call for ${userName} (${userType}) in room ${roomId}`);
    
    res.render('videoCall', {
      roomId,
      userType,
      userName,
      userId,
      appointmentId: room.appointmentId
    });
  } catch (error) {
    console.error('Error loading video call:', error);
    res.render('videoCallError', { 
      error: 'Server Error',
      message: 'An error occurred while loading the video call. Please try again.',
      canRetry: true
    });
  }
});

// Video Call API Routes
app.post('/api/video-call/start', async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.body;
    const roomId = uuidv4();
    
    // Update appointment with room information
    const Doctor = require('./models/docRegister');
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    const appointment = doctor.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    appointment.roomId = roomId;
    appointment.isVideoCallActive = true;
    appointment.videoCallStartedAt = new Date();
    await doctor.save();
    
    // Store room information
    activeRooms.set(roomId, {
      roomId,
      appointmentId,
      doctorId,
      patientId: appointment.patientId,
      participants: [],
      createdAt: new Date()
    });
    
    res.json({ success: true, roomId });
  } catch (error) {
    console.error('Error starting video call:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/video-call/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = activeRooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    res.json({ success: true, room });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Debug endpoint to check active rooms
app.get('/api/video-call/debug/rooms', async (req, res) => {
  try {
    const Doctor = require('./models/docRegister');
    const doctors = await Doctor.find({
      'appointments.isVideoCallActive': true,
      'appointments.roomId': { $exists: true, $ne: null }
    });
    
    const dbRooms = [];
    for (const doctor of doctors) {
      for (const appointment of doctor.appointments) {
        if (appointment.isVideoCallActive && appointment.roomId) {
          dbRooms.push({
            roomId: appointment.roomId,
            appointmentId: appointment._id.toString(),
            doctorId: doctor._id.toString(),
            isInMemory: activeRooms.has(appointment.roomId)
          });
        }
      }
    }
    
    res.json({
      success: true,
      memoryRooms: Array.from(activeRooms.keys()),
      databaseRooms: dbRooms,
      memoryCount: activeRooms.size,
      databaseCount: dbRooms.length
    });
  } catch (error) {
    console.error('Error getting debug info:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check if video call is active for appointment
app.get('/api/video-call/appointment/:appointmentId/status', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID required' });
    }
    
    const Doctor = require('./models/docRegister');
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    const appointment = doctor.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({
      success: true,
      isVideoCallActive: appointment.isVideoCallActive || false,
      roomId: appointment.roomId || null,
      status: appointment.status || 'pending'
    });
  } catch (error) {
    console.error('Error checking video call status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check if room exists and is valid for rejoining
app.get('/api/video-call/room/:roomId/validate', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = activeRooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found or has expired',
        canRejoin: false 
      });
    }
    
    // Check if doctor exists (basic validation)
    const Doctor = require('./models/docRegister');
    const doctor = await Doctor.findById(room.doctorId);
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found',
        canRejoin: false 
      });
    }
    
    // Room exists and is valid for rejoining
    res.json({
      success: true,
      canRejoin: true,
      room: {
        roomId: room.roomId,
        appointmentId: room.appointmentId,
        doctorId: room.doctorId,
        patientId: room.patientId,
        participants: room.participants.length
      }
    });
  } catch (error) {
    console.error('Error validating room:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join video call room
  socket.on('join-video-room', ({ roomId, userId, userName, userType }) => {
    socket.join(roomId);
    connectedUsers.set(socket.id, { roomId, userId, userName, userType });
    
    const room = activeRooms.get(roomId);
    if (room) {
      room.participants.push({ 
        socketId: socket.id, 
        userId, 
        userName, 
        userType 
      });
      activeRooms.set(roomId, room);
    }
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined-video', { 
      socketId: socket.id, 
      userId, 
      userName, 
      userType 
    });
    
    // Send current participants to the new user
    const currentParticipants = room ? room.participants.filter(p => p.socketId !== socket.id) : [];
    socket.emit('video-room-participants', currentParticipants);
    
    console.log(`${userName} (${userType}) joined video room ${roomId}`);
  });

  // WebRTC signaling
  socket.on('video-offer', ({ to, offer, userName }) => {
    socket.to(to).emit('video-offer', { from: socket.id, offer, userName });
  });

  socket.on('video-answer', ({ to, answer }) => {
    socket.to(to).emit('video-answer', { from: socket.id, answer });
  });

  socket.on('video-ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('video-ice-candidate', { from: socket.id, candidate });
  });

  // Chat messages during video call
  socket.on('video-chat-message', ({ roomId, message, userName }) => {
    io.to(roomId).emit('video-chat-message', { 
      message, 
      userName, 
      timestamp: new Date() 
    });
  });

  // Screen sharing
  socket.on('video-screen-share-start', ({ roomId }) => {
    socket.to(roomId).emit('video-screen-share-start', { socketId: socket.id });
  });

  socket.on('video-screen-share-stop', ({ roomId }) => {
    socket.to(roomId).emit('video-screen-share-stop', { socketId: socket.id });
  });

  // End video call
  socket.on('end-video-call', async ({ roomId }) => {
    try {
      const room = activeRooms.get(roomId);
      if (room) {
        // Update appointment status to done
        const Doctor = require('./models/docRegister');
        const doctor = await Doctor.findById(room.doctorId);
        if (doctor) {
          const appointment = doctor.appointments.id(room.appointmentId);
          if (appointment) {
            appointment.isVideoCallActive = false;
            appointment.videoCallEndedAt = new Date();
            appointment.status = 'done'; // Mark appointment as completed
            await doctor.save();
          }
        }
        
        // Notify all participants
        io.to(roomId).emit('video-call-ended', { roomId });
        
        // Clean up room
        activeRooms.delete(roomId);
        console.log(`Video call ended and room ${roomId} cleaned up`);
      }
    } catch (error) {
      console.error('Error ending video call:', error);
    }
  });

  // Doctor-specific endpoint to end session
  app.post('/api/video-call/end-session', async (req, res) => {
    try {
      const { roomId, doctorId } = req.body;
      
      const room = activeRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }
      
      // Verify the doctor is the one who started the session
      if (room.doctorId !== doctorId) {
        return res.status(403).json({ success: false, message: 'Only the doctor can end the session' });
      }
      
      // Update appointment status to done
      const Doctor = require('./models/docRegister');
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        const appointment = doctor.appointments.id(room.appointmentId);
        if (appointment) {
          appointment.isVideoCallActive = false;
          appointment.videoCallEndedAt = new Date();
          appointment.status = 'done'; // Mark appointment as completed
          await doctor.save();
        }
      }
      
      // Notify all participants
      io.to(roomId).emit('video-call-ended', { roomId });
      
      // Clean up room
      activeRooms.delete(roomId);
      console.log(`Doctor ended video session: ${roomId}`);
      
      res.json({ success: true, message: 'Session ended successfully' });
    } catch (error) {
      console.error('Error ending video session:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const room = activeRooms.get(user.roomId);
      if (room) {
        // Remove user from participants but keep room active
        room.participants = room.participants.filter(p => p.socketId !== socket.id);
        
        // Notify remaining participants that user left
        if (room.participants.length > 0) {
          socket.to(user.roomId).emit('user-left-video', { 
            socketId: socket.id, 
            userName: user.userName 
          });
        }
        
        console.log(`User ${user.userName} disconnected from room ${user.roomId}. Room kept active with ${room.participants.length} participants.`);
      }
      
      connectedUsers.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000,function(){
    console.log("server is running so beautifully");
});