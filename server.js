const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static('./'));

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pullinKalenteri@gmail.com',
        pass: 'dwsdohxdiegwqvtr'
    }
});

// Email sending endpoint
app.post('/send-email', (req, res) => {
    const { subject, body } = req.body;

    const mailOptions = {
        from: 'pullinKalenteri@gmail.com',
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