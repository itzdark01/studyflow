// --- State Management ---
let tasks = [];
let editingTaskId = null;

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
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');
const modalTitle = document.getElementById('modal-title');
const saveTaskBtn = document.getElementById('save-task-btn');
const taskSearch = document.getElementById('task-search');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const taskSubjectSelect = document.getElementById('task-subject');
const customSubjectGroup = document.getElementById('custom-subject-group');
const customSubjectInput = document.getElementById('custom-subject');
const standardSubjects = ['Maths', 'Science', 'English', 'History', 'Other'];

// --- Subject Colors Map ---
const subjectColors = {
    'Maths': 'var(--color-maths)',
    'Science': 'var(--color-science)',
    'English': 'var(--color-english)',
    'History': 'var(--color-history)',
    'Other': 'var(--color-other)'
};

// --- Functions ---

// Load tasks from localStorage (with safety try/catch)
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('studyflow_tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error("Failed to load tasks. Starting fresh.", error);
        tasks = []; // Fallback if data is corrupted
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
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('en-GB', options);
}

// Check if a task is overdue
function isOverdue(deadlineStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    
    const deadline = new Date(deadlineStr);
    deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset()); // Fix timezone
    
    return deadline < today;
}

// Safely escape HTML
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
    
    // Check if it's overdue (only for pending tasks)
    const overdue = !isCompleted && isOverdue(task.deadline);
    const deadlineClass = overdue ? 'task-deadline overdue' : 'task-deadline';

    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;
    
    card.innerHTML = `
        <div class="task-header">
            <div class="task-title-container">
                <span class="subject-dot" style="background-color: ${dotColor}" title="${escapeHTML(task.subject)}"></span>
                <span class="task-title">${safeTitle}</span>
            </div>
            <span class="${deadlineClass}">${overdue ? '⚠️ ' : ''}${formattedDate}</span>
        </div>
        <div class="task-actions">
            <button class="action-btn edit" onclick="editTask('${task.id}')">
                Edit
            </button>
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
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const searchTerm = taskSearch.value.trim().toLocaleLowerCase();
    const matchingTasks = tasks.filter(task =>
        task.title.toLocaleLowerCase().includes(searchTerm) ||
        task.subject.toLocaleLowerCase().includes(searchTerm)
    );
    const pendingTasks = matchingTasks.filter(t => !t.completed);
    const completedTasks = matchingTasks.filter(t => t.completed);

    // Sort pending tasks by deadline (closest date first)
    pendingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Render pending
    pendingTasks.forEach(task => {
        pendingList.appendChild(createTaskCard(task));
    });

    // Render completed
    completedTasks.forEach(task => {
        completedList.appendChild(createTaskCard(task));
    });

    // Handle empty states
    const pendingTotal = tasks.filter(task => !task.completed).length;
    const completedTotal = tasks.filter(task => task.completed).length;
    pendingEmpty.textContent = searchTerm
        ? 'No matching pending tasks.'
        : "No pending tasks. You're all caught up!";
    completedEmpty.textContent = searchTerm
        ? 'No matching completed tasks.'
        : 'No completed tasks yet.';
    if (pendingTotal === 0) pendingList.appendChild(pendingEmpty);
    else if (pendingTasks.length === 0) pendingList.appendChild(pendingEmpty);
    if (completedTotal === 0) completedList.appendChild(completedEmpty);
    else if (completedTasks.length === 0) completedList.appendChild(completedEmpty);

    // Update counts
    pendingCount.textContent = pendingTotal;
    completedCount.textContent = completedTotal;
    clearCompletedBtn.hidden = completedTotal === 0;

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
    const selectedSubject = taskSubjectSelect.value;
    const subject = selectedSubject === 'Custom'
        ? customSubjectInput.value.trim()
        : selectedSubject;
    const deadline = document.getElementById('task-deadline').value;

    if (!title || !subject || !deadline) return;

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (!task) {
            editingTaskId = null;
            return;
        }
        task.title = title;
        task.subject = subject;
        task.deadline = deadline;
    } else {
        tasks.push({
            id: Date.now().toString(),
            title: title,
            subject: subject,
            deadline: deadline,
            completed: false
        });
    }

    saveTasks();
    renderTasks();

    taskForm.reset();
    setCustomSubjectVisibility(false);
    modal.classList.add('hidden');
    editingTaskId = null;
    modalTitle.textContent = 'Add New Task';
    saveTaskBtn.textContent = 'Save Task';
});

// Open the task form with an existing task's details.
window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = task.id;
    document.getElementById('task-title').value = task.title;
    if (standardSubjects.includes(task.subject)) {
        taskSubjectSelect.value = task.subject;
        setCustomSubjectVisibility(false);
    } else {
        taskSubjectSelect.value = 'Custom';
        customSubjectInput.value = task.subject;
        setCustomSubjectVisibility(true);
    }
    document.getElementById('task-deadline').value = task.deadline;
    modalTitle.textContent = 'Edit Task';
    saveTaskBtn.textContent = 'Save Changes';
    modal.classList.remove('hidden');
};

// Remove all completed tasks.
clearCompletedBtn.addEventListener('click', () => {
    if (!tasks.some(task => task.completed)) return;
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
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

// Delete a task (WITH CONFIRMATION)
window.deleteTask = function(id) {
    // Ask for confirmation before deleting
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
};

// --- Event Listeners for Modal ---
openModalBtn.addEventListener('click', () => {
    editingTaskId = null;
    taskForm.reset();
    setCustomSubjectVisibility(false);
    modalTitle.textContent = 'Add New Task';
    saveTaskBtn.textContent = 'Save Task';
    modal.classList.remove('hidden');
    document.getElementById('task-deadline').valueAsDate = new Date();
});

function closeModal() {
    modal.classList.add('hidden');
    taskForm.reset();
    setCustomSubjectVisibility(false);
    editingTaskId = null;
    modalTitle.textContent = 'Add New Task';
    saveTaskBtn.textContent = 'Save Task';
}

function setCustomSubjectVisibility(visible) {
    customSubjectGroup.hidden = !visible;
    customSubjectInput.required = visible;
    if (!visible) customSubjectInput.value = '';
}

taskSubjectSelect.addEventListener('change', () => {
    setCustomSubjectVisibility(taskSubjectSelect.value === 'Custom');
});

taskSearch.addEventListener('input', renderTasks);

function setDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
    darkModeToggle.textContent = enabled ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('studyflow_dark_mode', String(enabled));
}

darkModeToggle.addEventListener('click', () => {
    setDarkMode(!document.body.classList.contains('dark-mode'));
});

try {
    setDarkMode(localStorage.getItem('studyflow_dark_mode') === 'true');
} catch (error) {
    console.error('Failed to load dark mode preference.', error);
}

cancelBtn.addEventListener('click', () => {
    closeModal();
});

// Close modal if clicking outside the white box
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// --- Initialization ---
loadTasks();