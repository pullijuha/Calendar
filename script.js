// Initialize variables
let currentDate = new Date();
let selectedDate = null;
let tasks = {};
let modal = null;
let taskDetailsModal = null;
let currentTask = null;

// API URL configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:10000'  // Local development with port
    : 'https://calendar-w3f1.onrender.com';  // Production URL without port

// User settings
const userSettings = {
    juha: { requiresApproval: true },
    elina: { requiresApproval: true },
    iina: { requiresApproval: false },
    julia: { requiresApproval: false }
};

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    modal = document.getElementById('taskModal');
    taskDetailsModal = document.getElementById('taskDetailsModal');
    
    // Set up modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            taskDetailsModal.style.display = 'none';
        };
    });

    window.onclick = (event) => {
        if (event.target === modal || event.target === taskDetailsModal) {
            modal.style.display = 'none';
            taskDetailsModal.style.display = 'none';
        }
    };

    // Set up task action buttons
    document.getElementById('deleteTaskBtn').onclick = () => {
        if (currentTask) {
            deleteTask(currentTask.date, currentTask.id);
            taskDetailsModal.style.display = 'none';
        }
    };

    document.getElementById('acceptTaskBtn').onclick = () => {
        if (currentTask) {
            acceptTask(currentTask.date, currentTask.id);
            taskDetailsModal.style.display = 'none';
        }
    };

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

    // Set default dates when opening the task form
    const setDefaultDates = () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        
        // Set default times to 16:00
        document.getElementById('startTimeHour').value = '16';
        document.getElementById('startTimeMinute').value = '00';
        document.getElementById('endTimeHour').value = '18';
        document.getElementById('endTimeMinute').value = '00';
    };

    // Task form handling
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const title = document.getElementById('taskTitle').value;
            const startDate = document.getElementById('startDate').value;
            const startHour = document.getElementById('startTimeHour').value.padStart(2, '0');
            const startMinute = document.getElementById('startTimeMinute').value.padStart(2, '0');
            const startTime = `${startHour}:${startMinute}`;
            const endDate = document.getElementById('endDate').value;
            const endHour = document.getElementById('endTimeHour').value.padStart(2, '0');
            const endMinute = document.getElementById('endTimeMinute').value.padStart(2, '0');
            const endTime = `${endHour}:${endMinute}`;
            const creator = document.getElementById('currentUser').value;
            const notes = document.getElementById('taskNotes').value;

            // Validate time inputs
            if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
                endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
                alert('Please enter valid times (hours: 0-23, minutes: 0-59)');
                return;
            }

            // Create dates in local timezone
            const start = new Date(`${startDate}T${startTime}:00`);
            const end = new Date(`${endDate}T${endTime}:00`);

            if (end < start) {
                alert('End time must be after start time');
                return;
            }

            const newTask = {
                title,
                startDate,
                startTime,
                endDate,
                endTime,
                accepted: !userSettings[creator].requiresApproval,
                creator,
                notes,
                id: Date.now(),
                date: startDate  // Use the input date directly without timezone conversion
            };

            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newTask)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
            }

            const responseData = await response.json();
            
            // Add task to all relevant dates
            const currentDate = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            while (currentDate <= endDateObj) {
                const dateKey = currentDate.toISOString().split('T')[0];
                if (!tasks[dateKey]) {
                    tasks[dateKey] = [];
                }
                // Create a new task instance for each date
                const taskForDate = {
                    ...responseData,
                    date: dateKey  // Set the correct date for each instance
                };
                tasks[dateKey].push(taskForDate);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            modal.style.display = 'none';
            renderCalendar();
            renderYearView();
            document.getElementById('taskForm').reset();
        } catch (error) {
            console.error('Detailed error:', error);
            console.error('Error stack:', error.stack);
            alert('Failed to create task: ' + error.message);
        }
    });

    // When opening the task modal, set default dates and times
    document.getElementById('calendar').addEventListener('click', (e) => {
        if (e.target.classList.contains('calendar-day')) {
            selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(e.target.querySelector('.day-number').textContent));
            const dateString = selectedDate.toISOString().split('T')[0];
            
            // Set default dates
            document.getElementById('startDate').value = dateString;
            document.getElementById('endDate').value = dateString;
            
            // Set default times to 16:00
            document.getElementById('startTimeHour').value = '16';
            document.getElementById('startTimeMinute').value = '00';
            document.getElementById('endTimeHour').value = '18';
            document.getElementById('endTimeMinute').value = '00';
            
            modal.style.display = 'block';
        }
    });

    // Initial load
    loadTasks();
    renderCalendar();
    renderYearView();
});

// Load tasks from server
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        tasks = await response.json();
        renderCalendar();
        renderYearView();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Delete task
async function deleteTask(dateKey, taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
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

// Accept task
async function acceptTask(dateKey, taskId) {
    try {
        const task = tasks[dateKey].find(t => t.id === taskId);
        if (!task) return;

        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
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

// Show task details
function showTaskDetails(task) {
    currentTask = task;
    document.getElementById('detailsTitle').textContent = task.title;
    document.getElementById('detailsTime').textContent = `${task.startTime} - ${task.endTime}`;
    document.getElementById('detailsCreator').textContent = task.creator;
    document.getElementById('detailsStatus').textContent = task.accepted ? 'Accepted' : 'Pending';
    document.getElementById('detailsNotes').textContent = task.notes || 'No notes added';
    
    // Show/hide accept button based on task status
    document.getElementById('acceptTaskBtn').style.display = task.accepted ? 'none' : 'inline-block';
    
    taskDetailsModal.style.display = 'block';
}

// Render calendar
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

    // Get the first day of the week (0-6)
    const firstDayOfWeek = firstDay.getDay();

    // Add previous month's days
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'other-month');
        dayDiv.innerHTML = `<div class="day-number">${prevMonthLastDay - i}</div>`;
        calendar.appendChild(dayDiv);
    }

    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        
        const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (currentDayDate.toDateString() === new Date().toDateString()) {
            dayDiv.classList.add('today');
        }

        dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
        
        // Add tasks for this day
        const dateKey = currentDayDate.toISOString().split('T')[0];
        if (tasks[dateKey] && tasks[dateKey].length > 0) {
            const tasksContainer = document.createElement('div');
            tasksContainer.classList.add('tasks-container');
            
            tasks[dateKey].forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.classList.add('task', task.creator);
                if (task.accepted) taskElement.classList.add('accepted');
                
                const taskContent = document.createElement('div');
                taskContent.classList.add('task-content');
                taskContent.innerHTML = `
                    <span class="task-title">${task.title}</span>
                    <span class="task-time">${task.startTime}-${task.endTime}</span>
                `;

                // Add click handler to show task details
                taskElement.onclick = (e) => {
                    e.stopPropagation();
                    showTaskDetails(task);
                };

                taskElement.appendChild(taskContent);
                tasksContainer.appendChild(taskElement);
            });
            
            dayDiv.appendChild(tasksContainer);
        }

        // Add click handler for creating new tasks
        dayDiv.addEventListener('click', () => {
            selectedDate = currentDayDate;
            modal.style.display = 'block';
        });

        calendar.appendChild(dayDiv);
    }

    // Add next month's days
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - (firstDayOfWeek + lastDay.getDate());
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'other-month');
        dayDiv.innerHTML = `<div class="day-number">${i}</div>`;
        calendar.appendChild(dayDiv);
    }
}

// Render year view
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
            const month = (index + 1).toString().padStart(2, '0');
            const day = i.toString().padStart(2, '0');
            const dateKey = `${currentDate.getFullYear()}-${month}-${day}`;
            
            if (tasks[dateKey] && tasks[dateKey].length > 0) {
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

                const userTypes = Object.keys(tasksByUser);
                if (userTypes.length > 1) {
                    dayElement.classList.add('multiple-tasks');
                }

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

        monthPreview.addEventListener('click', () => {
            currentDate.setMonth(index);
            renderCalendar();
            renderYearView();
            document.querySelector('.calendar-container').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });

        yearView.appendChild(monthPreview);
    });
} 