Vue.component('kanban-task', {
    props: {
        task: { type: Object, required: true },
        columnId: { type: String, required: true },
        canForward: { type: Boolean, default: false },
        canBack: { type: Boolean, default: false },
        status: { type: Object, default: () => ({ text: '', cls: '' }) }
    },
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString('ru-RU');
        },
        formatDateTime(date) {
            if (!date) return '';
            return new Date(date).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },
    template: `
        <div class="task">
            <div class="task-header">
                <strong>{{ task.title }}</strong>
                <div>
                    <button v-if="columnId !== 'completed'" @click="$emit('edit', task)">Редактировать</button>
                    <button v-if="columnId === 'planned'" @click="$emit('delete', task.id)">Корзина</button>
                </div>
            </div>

            <div v-if="task.desc">{{ task.desc }}</div>

            <div class="task-meta">
                <div>Дата {{ formatDate(task.deadline) }}</div>
                <div>Создано: {{ formatDateTime(task.createdAt) }}</div>
                <div v-if="status.text" class="task-status" :class="status.cls">{{ status.text }}</div>
                <div v-if="task.editedAt">Изменено: {{ formatDateTime(task.editedAt) }}</div>
                <div v-if="task.completedAt">Завершено: {{ formatDateTime(task.completedAt) }}</div>
            </div>

            <div class="move-buttons">
                <button v-if="canForward" @click="$emit('forward')">→</button>
                <button v-if="canBack" @click="$emit('back')">←</button>
            </div>

            <div v-if="task.returnReason" class="return-reason">
                <small><strong>Причина:</strong> {{ task.returnReason }}</small>
            </div>
        </div>
    `
});

Vue.component('kanban-column', {
    props: {
        column: { type: Object, required: true },
        tasks: { type: Array, required: true }
    },
    template: `
        <div class="column">
            <div class="column-header">
                <h2>{{ column.title }}</h2>
                <span>{{ tasks.length }}</span>
            </div>

            <div class="tasks">
                <slot />
            </div>

            <button v-if="column.id === 'planned'" @click="$emit('add')">+ Добавить</button>
        </div>
    `
});

Vue.component('task-modal', {
    props: {
        show: { type: Boolean, required: true },
        title: { type: String, required: true },
        form: { type: Object, required: true }
    },
    template: `
        <div class="modal" v-if="show">
            <div class="modal-content">
                <h3>{{ title }}</h3>

                <div class="form-group">
                    <label>Название</label>
                    <input v-model="form.title" type="text">
                </div>

                <div class="form-group">
                    <label>Описание</label>
                    <textarea v-model="form.desc"></textarea>
                </div>

                <div class="form-group">
                    <label>Дедлайн</label>
                    <input v-model="form.deadline" type="datetime-local">
                </div>

                <div class="modal-buttons">
                    <button @click="$emit('save')">Сохранить</button>
                    <button @click="$emit('cancel')">Отмена</button>
                </div>
            </div>
        </div>
    `
});

Vue.component('return-modal', {
    props: {
        show: { type: Boolean, required: true },
        reason: { type: String, required: true }
    },
    template: `
        <div class="modal" v-if="show">
            <div class="modal-content">
                <h3>Причина возврата</h3>

                <div class="form-group">
                    <label>Укажите причину</label>
                    <textarea :value="reason" @input="$emit('update:reason', $event.target.value)" rows="3"></textarea>
                </div>

                <div class="modal-buttons">
                    <button @click="$emit('confirm')">Подтвердить</button>
                    <button @click="$emit('cancel')">Отмена</button>
                </div>
            </div>
        </div>
    `
});

new Vue({
    el: '#app',
    data: {
        columns: [
            { id: 'planned', title: 'Запланированные' },
            { id: 'in-progress', title: ' В работе' },
            { id: 'testing', title: 'Тестирование' },
            { id: 'completed', title: 'Выполненные' }
        ],
        tasks: [],
        modal: {
            show: false,
            title: '',
            mode: 'add',
            editId: null,
            form: {
                title: '',
                desc: '',
                deadline: ''
            }
        },
        returnModal: {
            show: false,
            taskId: null,
            reason: ''
        }
    },
    template: `
        <div class="app">
            <h1>Канбан доска</h1>

            <div class="board">
                <kanban-column
                    v-for="column in columns"
                    :key="column.id"
                    :column="column"
                    :tasks="getTasksByColumn(column.id)"
                    @add="showAddModal"
                >
                    <kanban-task
                        v-for="task in getTasksByColumn(column.id)"
                        :key="task.id"
                        :task="task"
                        :column-id="column.id"
                        :can-forward="canMoveForward(column.id)"
                        :can-back="canMoveBack(column.id)"
                        :status="getTaskStatus(task)"
                        @edit="editTask"
                        @delete="deleteTask"
                        @forward="moveTask(task.id, column.id)"
                        @back="returnTask(task.id)"
                    />
                </kanban-column>
            </div>

            <task-modal
                :show="modal.show"
                :title="modal.title"
                :form="modal.form"
                @save="saveTask"
                @cancel="modal.show = false"
            />

            <return-modal
                :show="returnModal.show"
                :reason="returnModal.reason"
                @update:reason="returnModal.reason = $event"
                @confirm="confirmReturn"
                @cancel="returnModal.show = false"
            />
        </div>
    `,
    mounted() {
        this.loadTasks();
    },
    methods: {
        getTasksByColumn(columnId) {
            return this.tasks.filter(t => t.column === columnId);
        },
        canMoveForward(columnId) {
            return ['planned', 'in-progress', 'testing'].includes(columnId);
        },
        canMoveBack(columnId) {
            return columnId === 'testing';
        },
        getTaskStatus(task) {
            const deadline = new Date(task.deadline);
            const ref = task.completedAt ? new Date(task.completedAt) : new Date();

            if (ref.getTime() > deadline.getTime()) {
                return { text: 'Просрочено задание', cls: 'status-late' };
            }

            if (task.completedAt) {
                return { text: 'Выполнено в срок', cls: 'status-ok' };
            }

            return { text: '', cls: '' };
        },
        loadTasks() {
            const saved = localStorage.getItem('kanban-tasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
            } else {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                this.tasks = [
                    {
                        id: 1,
                        title: 'Пример задачи',
                        desc: 'Описание задачи',
                        deadline: tomorrow.toISOString(),
                        createdAt: now.toISOString(),
                        editedAt: null,
                        completedAt: null,
                        column: 'planned',
                        returnReason: null
                    }
                ];
            }
        },
        saveTasks() {
            localStorage.setItem('kanban-tasks', JSON.stringify(this.tasks));
        },
        generateId() {
            return Date.now() + Math.random();
        },
        showAddModal() {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(18, 0);

            this.modal = {
                show: true,
                title: 'Новая задача',
                mode: 'add',
                editId: null,
                form: {
                    title: '',
                    desc: '',
                    deadline: tomorrow.toISOString().slice(0, 16)
                }
            };
        },
        editTask(task) {
            this.modal = {
                show: true,
                title: 'Редактировать',
                mode: 'edit',
                editId: task.id,
                form: {
                    title: task.title,
                    desc: task.desc || '',
                    deadline: task.deadline.slice(0, 16)
                }
            };
        },
        deleteTask(taskId) {
            if (confirm('Удалить задачу?')) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveTasks();
            }
        },
        saveTask() {
            if (!this.modal.form.title) {
                alert('Введите название');
                return;
            }
            if (!this.modal.form.deadline) {
                alert('Выберите дедлайн');
                return;
            }

            if (this.modal.mode === 'add') {
                this.tasks.push({
                    id: this.generateId(),
                    title: this.modal.form.title,
                    desc: this.modal.form.desc,
                    deadline: this.modal.form.deadline,
                    createdAt: new Date().toISOString(),
                    editedAt: null,
                    completedAt: null,
                    column: 'planned',
                    returnReason: null
                });
            } else {
                const task = this.tasks.find(t => t.id === this.modal.editId);
                if (task) {
                    task.title = this.modal.form.title;
                    task.desc = this.modal.form.desc;
                    task.deadline = this.modal.form.deadline;
                    task.editedAt = new Date().toISOString();
                }
            }

            this.modal.show = false;
            this.saveTasks();
        },
        moveTask(taskId, fromColumn) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            const nextColumn = {
                planned: 'in-progress',
                'in-progress': 'testing',
                testing: 'completed'
            }[fromColumn];

            if (nextColumn) {
                task.column = nextColumn;
                if (nextColumn === 'completed') {
                    task.completedAt = new Date().toISOString();
                }
                this.saveTasks();
            }
        },
        returnTask(taskId) {
            this.returnModal = {
                show: true,
                taskId: taskId,
                reason: ''
            };
        },
        confirmReturn() {
            if (!this.returnModal.reason.trim()) {
                alert('Укажите причину');
                return;
            }

            const task = this.tasks.find(t => t.id === this.returnModal.taskId);
            if (task) {
                task.column = 'in-progress';
                task.returnReason = this.returnModal.reason;
                this.saveTasks();
            }
            this.returnModal.show = false;
        }
    }
});
