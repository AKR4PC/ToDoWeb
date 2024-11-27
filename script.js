document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filters = document.querySelectorAll('.filter');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskCount();
    }

    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-priority', task.priority);
        
        li.innerHTML = `
            <div class="task-content">
                <div class="task-main">
                    <div class="checkbox ${task.completed ? 'checked' : ''}" 
                         ontouchstart="toggleTask(${task.id})" 
                         onclick="toggleTask(${task.id})"></div>
                    <span class="task-text">${task.text}</span>
                    <button class="delete-btn" 
                            ontouchstart="deleteTask(${task.id})" 
                            onclick="deleteTask(${task.id})">×</button>
                </div>
                ${task.description ? `
                    <div class="task-description-text">
                        ${task.description}
                    </div>
                ` : ''}
                ${task.collaborators.length > 0 ? `
                    <div class="task-collaborators-count">
                        <div class="collaborator-count-circle">
                            ${task.collaborators.length}
                        </div>
                        <span>${task.collaborators.length === 1 ? 'collaborator' : 'collaborators'}</span>
                    </div>
                ` : ''}
            </div>
        `;
        return li;
    }

    function renderTasks(filterType = 'all') {
        taskList.innerHTML = '';
        let filteredTasks = tasks;
        
        if (filterType === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (filterType === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }

    window.toggleTask = (id) => {
        tasks = tasks.map(task => 
            task.id === id ? {...task, completed: !task.completed} : task
        );
        saveTasks();
        renderTasks();
    };

    window.deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    };

    function resetFields() {
        document.getElementById('taskInput').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('collaboratorInput').value = '';
        currentCollaborators = [];
        updateCollaboratorsPreview();
        
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.priority === 'medium') {
                btn.classList.add('selected');
            }
        });
        selectedPriority = 'medium';
    }

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        
        if (text) {
            const newTask = {
                id: Date.now(),
                text,
                description,
                completed: false,
                priority: selectedPriority,
                collaborators: [...currentCollaborators]
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            resetFields();
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    });

    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            renderTasks(filter.dataset.filter);
        });
    });

    const priorityBtns = document.querySelectorAll('.priority-btn');
    let selectedPriority = 'medium';

    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPriority = btn.dataset.priority;
        });
    });

    const collaboratorInput = document.getElementById('collaboratorInput');
    const addCollaboratorBtn = document.getElementById('addCollaborator');
    let currentCollaborators = [];

    addCollaboratorBtn.addEventListener('click', () => {
        const names = collaboratorInput.value.trim().split(',');
        
        names.forEach(name => {
            name = name.trim();
            if (name) {
                currentCollaborators.push({
                    name,
                    color: getRandomColor()
                });
            }
        });
        
        collaboratorInput.value = '';
        updateCollaboratorsPreview();
    });

    function updateCollaboratorsPreview() {
        const preview = document.createElement('div');
        preview.className = 'collaborators-preview';
        currentCollaborators.forEach(collab => {
            const circle = document.createElement('div');
            circle.className = 'collaborator-circle';
            circle.style.background = collab.color;
            circle.textContent = getInitials(collab.name);
            preview.appendChild(circle);
        });
    }

    renderTasks();

    addTaskBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        addTaskBtn.click();
    });

    clearCompletedBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        clearCompletedBtn.click();
    });

    filters.forEach(filter => {
        filter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            filter.click();
        });
    });

    priorityBtns.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.click();
        });
    });

    addCollaboratorBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        addCollaboratorBtn.click();
    });

    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
    }
}); 
