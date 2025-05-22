import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// Enable CORS with specific options
app.use(cors({
    origin: '*',  // Allow all origins for now
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

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
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    creator: { type: String, required: true },
    accepted: { type: Boolean, default: false },
    date: { type: String, required: true },
    id: { type: Number, required: true }
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
        console.log('Received POST request to /tasks');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);

        // Check if we received any data
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('No request body received');
            return res.status(400).json({
                error: 'No data received'
            });
        }
        
        // Validate required fields
        const requiredFields = ['title', 'startTime', 'endTime', 'creator', 'date', 'id'];
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            console.log(`Checking field ${field}:`, value);
            return value === undefined || value === null || value === '';
        });
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Create and save the task
        const taskData = {
            title: req.body.title.trim(),
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            creator: req.body.creator,
            accepted: req.body.accepted || false,
            date: req.body.date,
            id: req.body.id
        };

        console.log('Creating new task with data:', taskData);

        // Validate the task data
        const task = new Task(taskData);
        const validationError = task.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({
                error: 'Validation error',
                details: validationError.errors
            });
        }

        console.log('Task validation passed, saving to database...');
        const savedTask = await task.save();
        console.log('Task saved successfully:', savedTask);

        // Send back the saved task
        return res.status(201).json({
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
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Server error while creating task',
            message: error.message
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

// Add this at the end of your routes
// This ensures that all routes not handled above will serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;  // Render.com will provide the PORT environment variable
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 