// Task management
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.selectedTask = null;
        this.init();
    }

    init() {
        // Initialize dark mode
        this.initTheme();
        
        // Initialize clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Initialize Sortable
        new Sortable(document.getElementById('tasks-list'), {
            animation: 150,
            ghostClass: 'dragging',
            onEnd: () => this.saveTasks()
        });

        // Event listeners
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('new-task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        document.getElementById('save-task-btn').addEventListener('click', () => this.saveTaskDetails());
        document.getElementById('delete-task-btn').addEventListener('click', () => this.deleteTask());
        document.getElementById('add-subtask-btn').addEventListener('click', () => this.addSubtask());

        // Initialize tasks
        this.renderTasks();
        this.checkDeadlines();
        setInterval(() => this.checkDeadlines(), 60000); // Check deadlines every minute
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Set initial icon
        const icon = document.querySelector('#theme-toggle i');
        icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
        this.updateNextDeadline();
    }

    updateNextDeadline() {
        const now = new Date();
        const upcomingTasks = this.tasks
            .filter(task => task.deadline && new Date(task.deadline) > now)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        const nextTask = upcomingTasks[0];
        if (nextTask) {
            const timeUntil = this.getTimeUntil(new Date(nextTask.deadline));
            document.getElementById('next-task-time').textContent = `${nextTask.title} (${timeUntil})`;
        }
    }

    getTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    addTask() {
        const input = document.getElementById('new-task-input');
        const title = input.value.trim();
        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            priority: 'medium', // Default priority
            created: new Date().toISOString(),
            subtasks: [],
            notes: '',
            completed: false
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        input.value = '';
        
        // Open task details immediately after creating
        this.openTaskDetails(task);
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.dataset.id = task.id;
        div.dataset.priority = task.priority;

        div.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
            </div>
            <div class="task-meta">
                <span class="priority-badge priority-${task.priority}">
                    ${task.priority}
                </span>
                ${task.deadline ? `<span class="deadline">${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                this.openTaskDetails(task);
            }
        });

        div.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            task.completed = e.target.checked;
            this.saveTasks();
        });

        return div;
    }

    openTaskDetails(task) {
        this.selectedTask = task;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('task-deadline').value = task.deadline || '';
        document.getElementById('task-notes').value = task.notes || '';

        // Update priority buttons
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === task.priority);
        });

        // Add click handlers for priority buttons if not already added
        document.querySelectorAll('.priority-btn').forEach(btn => {
            // Remove old listener to prevent duplicates
            btn.removeEventListener('click', this.handlePriorityClick);
            // Add new listener
            btn.addEventListener('click', this.handlePriorityClick.bind(this));
        });

        // Render subtasks
        this.renderSubtasks();
    }

    handlePriorityClick(e) {
        const btn = e.currentTarget;
        const priority = btn.dataset.priority;
        
        // Remove active class from all buttons
        document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        if (this.selectedTask) {
            this.selectedTask.priority = priority;
            // Save changes immediately when priority is changed
            this.saveTasks();
        }
    }

    renderSubtasks() {
        const subtasksList = document.getElementById('subtasks-list');
        subtasksList.innerHTML = '';

        this.selectedTask.subtasks.forEach((subtask, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                <span>${subtask.title}</span>
                <button class="delete-subtask" data-index="${index}">×</button>
            `;
            subtasksList.appendChild(li);
        });
    }

    addSubtask() {
        const input = document.getElementById('new-subtask');
        const title = input.value.trim();
        if (!title || !this.selectedTask) return;

        this.selectedTask.subtasks.push({
            title,
            completed: false
        });

        this.saveTasks();
        this.renderSubtasks();
        input.value = '';
    }

    saveTaskDetails() {
        if (!this.selectedTask) return;

        // Update the selected task with edited values
        this.selectedTask.title = document.getElementById('edit-task-title').value;
        this.selectedTask.deadline = document.getElementById('task-deadline').value;
        this.selectedTask.notes = document.getElementById('task-notes').value;

        // Find and update the task in the tasks array
        const taskIndex = this.tasks.findIndex(t => t.id === this.selectedTask.id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.selectedTask };
        }

        this.saveTasks();
        this.renderTasks();

        // Show success notification
        this.showNotification('Task updated successfully!');
    }

    deleteTask() {
        if (!this.selectedTask) return;
        
        this.tasks = this.tasks.filter(task => task.id !== this.selectedTask.id);
        this.saveTasks();
        this.renderTasks();
        this.selectedTask = null;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateNextDeadline();
    }

    checkDeadlines() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (task.deadline && !task.notified) {
                const deadline = new Date(task.deadline);
                const diff = deadline - now;
                if (diff > 0 && diff <= 900000) { // 15 minutes
                    this.showNotification(`Task "${task.title}" is due in ${Math.round(diff/60000)} minutes!`);
                    task.notified = true;
                    this.saveTasks();
                }
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
