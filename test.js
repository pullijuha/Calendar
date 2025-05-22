import fetch from 'node-fetch';

const API_URL = 'https://calendar-w3f1.onrender.com:10000';

async function testServer() {
    try {
        console.log('Testing server connection...');
        console.log(`Attempting to connect to: ${API_URL}/tasks`);
        const response = await fetch(`${API_URL}/tasks`);
        const data = await response.json();
        console.log('Server responded successfully!');
        console.log('Response data:', data);
    } catch (error) {
        console.error('Error connecting to server:', error.message);
        if (error.cause) {
            console.error('Error cause:', error.cause);
        }
    }
}

testServer(); 