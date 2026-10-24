// --- State Management ---
let tasks = [];

// --- DOM Elements ---
const modal = document.getElementById('task-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const taskForm = document.getElementById('task-form');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const pendingEmpty = document.getElementById('pending-empty');
const completedEmpty = document.getElementById('completed-empty');
const pendingCount = document.getElementById('pending-count');
const completedCount = document.getElementById('completed-count');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');

// --- Subject Colors Map ---
const subjectColors = {
    'Maths': 'var(--color-maths)',
    'Science': 'var(--color-science)',
    'English': 'var(--color-english)',
    'History': 'var(--color-history)',
    'Other': 'var(--color-other)'
};

// --- Functions ---

// Load tasks from localStorage
function loadTasks() {
    const storedTasks = localStorage.getItem('studyflow_tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
}

// Format date from YYYY-MM-DD to a readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    // Add timezone offset to prevent date shifting
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('en-GB', options);
}

// Safely escape HTML to prevent XSS security issues
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

// Create the HTML for a single task card
function createTaskCard(task) {
    const isCompleted = task.completed;
    const safeTitle = escapeHTML(task.title);
    const formattedDate = formatDate(task.deadline);
    const dotColor = subjectColors[task.subject] || subjectColors['Other'];

    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;
    
    card.innerHTML = `
        <div class="task-header">
            <div class="task-title-container">
                <span class="subject-dot" style="background-color: ${dotColor}" title="${task.subject}"></span>
                <span class="task-title">${safeTitle}</span>
            </div>
            <span class="task-deadline">${formattedDate}</span>
        </div>
        <div class="task-actions">
            <button class="action-btn complete" onclick="toggleTask('${task.id}')">
                ${isCompleted ? 'Undo' : 'Mark Complete'}
            </button>
            <button class="action-btn delete" onclick="deleteTask('${task.id}')">
                Delete
            </button>
        </div>
    `;
    
    return card;
}

// Render all tasks to the screen
function renderTasks() {
    // Clear current lists
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    let pendingTotal = 0;
    let completedTotal = 0;

    // Separate tasks into pending and completed
    tasks.forEach(task => {
        const card = createTaskCard(task);
        if (task.completed) {
            completedList.appendChild(card);
            completedTotal++;
        } else {
            pendingList.appendChild(card);
            pendingTotal++;
        }
    });

    // Handle empty states
    if (pendingTotal === 0) {
        pendingList.appendChild(pendingEmpty);
    }
    if (completedTotal === 0) {
        completedList.appendChild(completedEmpty);
    }

    // Update counts
    pendingCount.textContent = pendingTotal;
    completedCount.textContent = completedTotal;

    // Update progress bar
    const totalTasks = pendingTotal + completedTotal;
    const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTotal / totalTasks) * 100);
    
    progressBarFill.style.width = `${progressPercent}%`;
    progressPercentage.textContent = `${progressPercent}%`;
}

// Add a new task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const subject = document.getElementById('task-subject').value;
    const deadline = document.getElementById('task-deadline').value;

    if (!title || !subject || !deadline) return;

    const newTask = {
        id: Date.now().toString(), // Unique ID based on timestamp
        title: title,
        subject: subject,
        deadline: deadline,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Reset and close modal
    taskForm.reset();
    modal.classList.add('hidden');
});

// Toggle task completion status
window.toggleTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
};

// Delete a task
window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
};

// --- Event Listeners for Modal ---
openModalBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    // Set default date to today (optional UX improvement)
    document.getElementById('task-deadline').valueAsDate = new Date();
});

cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    taskForm.reset();
});

// Close modal if clicking outside the white box
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        taskForm.reset();
    }
});

// --- Initialization ---
loadTasks();