import fetch from 'node-fetch';

const API_URL = 'https://calendar-w3f1.onrender.com';

async function testServer() {
    try {
        // Test GET /tasks
        console.log('\nTesting GET /tasks...');
        console.log(`Attempting to connect to: ${API_URL}/tasks`);
        let response = await fetch(`${API_URL}/tasks`);
        console.log('GET Response status:', response.status);
        let data = await response.json();
        console.log('GET Response data:', data);

        // Test POST /tasks
        console.log('\nTesting POST /tasks...');
        const testTask = {
            title: "Test Task",
            startTime: "10:00",
            endTime: "11:00",
            creator: "juha",
            id: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        console.log('Sending test task:', testTask);
        
        response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testTask)
        });
        
        console.log('POST Response status:', response.status);
        data = await response.json();
        console.log('POST Response data:', data);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.cause) {
            console.error('Error cause:', error.cause);
        }
    }
}

testServer(); 