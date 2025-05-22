let currentDate = new Date();
let selectedDate = null;
let tasks = {};

// Load tasks from server
async function loadTasks() {
    try {
        const response = await fetch('http://localhost:3000/tasks');
        tasks = await response.json();
        renderCalendar();
        renderYearView();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// User settings
const userSettings = {
    juha: { requiresApproval: true },
    elina: { requiresApproval: true },
    iina: { requiresApproval: false },
    julia: { requiresApproval: false }
};

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        renderYearView();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        renderYearView();
    });

    // Year navigation
    document.getElementById('prevYear').addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        renderCalendar();
        renderYearView();
    });

    document.getElementById('nextYear').addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        renderCalendar();
        renderYearView();
    });

    // Modal handling
    const modal = document.getElementById('taskModal');
    const closeBtn = document.getElementsByClassName('close')[0];

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Task form handling
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const title = document.getElementById('taskTitle').value;
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            const creator = document.getElementById('currentUser').value;

            if (!selectedDate) {
                console.error('No date selected');
                alert('Please select a date first');
                return;
            }

            const dateKey = selectedDate.toISOString().split('T')[0];
            if (!tasks[dateKey]) {
                tasks[dateKey] = [];
            }

            const newTask = {
                title,
                startTime,
                endTime,
                accepted: !userSettings[creator].requiresApproval,
                creator,
                id: Date.now(),
                date: dateKey
            };

            console.log('Attempting to create task:', newTask);

            const response = await fetch('http://localhost:3000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask)
            });

            console.log('Server response status:', response.status);
            const responseData = await response.json();
            console.log('Server response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create task');
            }

            tasks[dateKey].push(responseData);
            console.log('Task added to local state:', tasks[dateKey]);
            
            modal.style.display = 'none';
            renderCalendar();
            renderYearView();
            document.getElementById('taskForm').reset();
        } catch (error) {
            console.error('Error creating task:', error);
            alert(`Failed to create task: ${error.message}`);
        }
    });

    // Initial load
    loadTasks();
    renderCalendar();
    renderYearView();
});

async function deleteTask(dateKey, taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            tasks[dateKey] = tasks[dateKey].filter(task => task.id !== taskId);
            if (tasks[dateKey].length === 0) {
                delete tasks[dateKey];
            }
            
            renderCalendar();
            renderYearView();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    }
}

async function acceptTask(dateKey, taskId) {
    try {
        const task = tasks[dateKey].find(t => t.id === taskId);
        if (!task) return;

        const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...task, accepted: true })
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        task.accepted = true;
        renderCalendar();
        renderYearView();
    } catch (error) {
        console.error('Error accepting task:', error);
        alert('Failed to accept task');
    }
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthDisplay = document.getElementById('monthDisplay');
    calendar.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    monthDisplay.textContent = firstDay.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

    // Add days from previous month
    const firstDayIndex = firstDay.getDay();
    for (let i = firstDayIndex; i > 0; i--) {
        const prevDate = new Date(firstDay);
        prevDate.setDate(prevDate.getDate() - i);
        addDayToCalendar(prevDate, true);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        addDayToCalendar(date);
    }

    // Add days from next month
    const lastDayIndex = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayIndex; i++) {
        const nextDate = new Date(lastDay);
        nextDate.setDate(nextDate.getDate() + i);
        addDayToCalendar(nextDate, true);
    }
}

function addDayToCalendar(date, isOtherMonth = false) {
    const calendar = document.getElementById('calendar');
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    if (isOtherMonth) dayElement.classList.add('other-month');
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    dayElement.innerHTML = `<div>${date.getDate()}</div>`;
    
    // Add tasks for this day
    const dateKey = date.toISOString().split('T')[0];
    if (tasks[dateKey]) {
        tasks[dateKey].forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task', task.creator);
            if (task.accepted) taskElement.classList.add('accepted');
            
            // Create task content with delete button
            const taskContent = document.createElement('span');
            taskContent.textContent = `${task.title} (${task.startTime}-${task.endTime})`;
            taskElement.appendChild(taskContent);
            
            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '×';
            deleteButton.className = 'delete-btn';
            deleteButton.title = 'Delete task';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                deleteTask(dateKey, task.id);
            };
            taskElement.appendChild(deleteButton);
            
            // Add click handler for accepting tasks only for tasks that require approval
            if (userSettings[task.creator].requiresApproval) {
                taskContent.onclick = (e) => {
                    e.stopPropagation();
                    const currentUser = document.getElementById('currentUser').value;
                    if (!task.accepted && currentUser !== task.creator) {
                        if (confirm('Do you want to accept this task?')) {
                            acceptTask(dateKey, task.id);
                        }
                    }
                };
            }
            
            dayElement.appendChild(taskElement);
        });
    }

    // Add click handler for creating new tasks
    dayElement.addEventListener('click', () => {
        selectedDate = date;
        modal.style.display = 'block';
    });

    calendar.appendChild(dayElement);
}

function renderYearView() {
    const yearView = document.getElementById('yearView');
    const yearDisplay = document.getElementById('yearDisplay');
    yearView.innerHTML = '';
    yearDisplay.textContent = currentDate.getFullYear();

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((month, index) => {
        const monthPreview = document.createElement('div');
        monthPreview.classList.add('month-preview');
        
        const monthDate = new Date(currentDate.getFullYear(), index, 1);
        const lastDay = new Date(currentDate.getFullYear(), index + 1, 0);
        
        monthPreview.innerHTML = `<h3>${month}</h3>`;
        const monthGrid = document.createElement('div');
        monthGrid.classList.add('month-preview-grid');

        // Add day labels
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.textContent = day;
            monthGrid.appendChild(dayLabel);
        });

        // Add empty cells for days before the first of the month
        const firstDayIndex = monthDate.getDay();
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            monthGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('month-preview-day');
            dayElement.textContent = i;

            // Check if there are tasks for this day
            const date = new Date(currentDate.getFullYear(), index, i);
            const dateKey = date.toISOString().split('T')[0];
            
            if (tasks[dateKey] && tasks[dateKey].length > 0) {
                // Group tasks by user
                const tasksByUser = tasks[dateKey].reduce((acc, task) => {
                    if (!acc[task.creator]) {
                        acc[task.creator] = {
                            count: 0,
                            hasAccepted: false
                        };
                    }
                    acc[task.creator].count++;
                    if (task.accepted) {
                        acc[task.creator].hasAccepted = true;
                    }
                    return acc;
                }, {});

                // Apply classes based on tasks
                const userTypes = Object.keys(tasksByUser);
                
                if (userTypes.length > 1) {
                    dayElement.classList.add('multiple-tasks');
                }

                // Apply the color of the user with the most tasks
                let maxTasks = 0;
                let dominantUser = null;
                let isAccepted = false;

                userTypes.forEach(user => {
                    if (tasksByUser[user].count > maxTasks) {
                        maxTasks = tasksByUser[user].count;
                        dominantUser = user;
                        isAccepted = tasksByUser[user].hasAccepted;
                    }
                });

                if (dominantUser) {
                    dayElement.classList.add(`has-tasks-${dominantUser}`);
                    if (isAccepted) {
                        dayElement.classList.add('accepted');
                    }
                }
            }

            monthGrid.appendChild(dayElement);
        }

        monthPreview.appendChild(monthGrid);

        // Add click handler to navigate to this month
        monthPreview.addEventListener('click', () => {
            currentDate.setMonth(index);
            renderCalendar();
            renderYearView();
            // Scroll to the monthly view
            document.querySelector('.calendar-container').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });

        yearView.appendChild(monthPreview);
    });
} 