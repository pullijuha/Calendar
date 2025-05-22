const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

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
        console.log('Creating new task:', req.body);
        const task = new Task(req.body);
        const savedTask = await task.save();
        console.log('Task saved successfully:', savedTask);
        res.status(201).json(savedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: error.message });
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

// Serve static files
app.use(express.static('.'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 