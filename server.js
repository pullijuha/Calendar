const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Connection URL:', process.env.MONGODB_URI);
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Task Schema
const taskSchema = new mongoose.Schema({
    title: String,
    startTime: String,
    endTime: String,
    creator: String,
    accepted: Boolean,
    date: String,
    id: Number
}, { 
    timestamps: true,
    strict: false 
});

const Task = mongoose.model('Task', taskSchema);

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Task endpoints
app.get('/tasks', async (req, res) => {
    try {
        console.log('Fetching all tasks...');
        const tasks = await Task.find();
        console.log('Found tasks:', tasks);
        const tasksByDate = tasks.reduce((acc, task) => {
            if (!acc[task.date]) {
                acc[task.date] = [];
            }
            acc[task.date].push({
                title: task.title,
                startTime: task.startTime,
                endTime: task.endTime,
                creator: task.creator,
                accepted: task.accepted,
                id: task.id
            });
            return acc;
        }, {});
        res.json(tasksByDate);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        console.log('Creating new task with data:', req.body);
        
        // Validate required fields
        const requiredFields = ['title', 'startTime', 'endTime', 'creator', 'date', 'id'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Create and save the task
        const taskData = {
            title: req.body.title,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            creator: req.body.creator,
            accepted: req.body.accepted || false,
            date: req.body.date,
            id: req.body.id
        };

        const task = new Task(taskData);
        console.log('Created task model:', task);

        const savedTask = await task.save();
        console.log('Task saved to database:', savedTask);
        
        // Send back the saved task
        res.status(201).json({
            title: savedTask.title,
            startTime: savedTask.startTime,
            endTime: savedTask.endTime,
            creator: savedTask.creator,
            accepted: savedTask.accepted,
            date: savedTask.date,
            id: savedTask.id
        });
    } catch (error) {
        console.error('Error in POST /tasks:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack 
        });
    }
});

app.put('/tasks/:id', async (req, res) => {
    try {
        console.log('Updating task:', req.params.id, req.body);
        const task = await Task.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        console.log('Task updated:', task);
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        console.log('Deleting task:', req.params.id);
        const result = await Task.findOneAndDelete({ id: req.params.id });
        console.log('Task deleted:', result);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: error.message });
    }
});

// Email sending endpoint
app.post('/send-email', (req, res) => {
    const { subject, body } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'pullijuha88@gmail.com',
        subject: subject || 'New Calendar Activity',
        html: body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
            res.status(500).json({ error: error.message });
        } else {
            console.log('Email sent:', info.response);
            res.json({ message: 'Email sent successfully' });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 