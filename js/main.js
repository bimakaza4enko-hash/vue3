Vue.component('product', {
})
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
    template: ` <div class="app">
            <h1>Канбан доска</h1>
            
            <div class="board">
                <div class="column" v-for="column in columns" :key="column.id">
                    <div class="column-header">
                        <h2>{{ column.title }}</h2>
                        <span>{{ getTasksByColumn(column.id).length }}</span>
                    </div>
                    
                    <div class="tasks">
                        <div class="task" v-for="task in getTasksByColumn(column.id)" :key="task.id">
                            <div class="task-header">
                                <strong>{{ task.title }}</strong>
                                <div>
                                    <button v-if="column.id !== 'completed'" @click="editTask(task)">Редактировать</button>
                                    <button v-if="column.id === 'planned'" @click="deleteTask(task.id)">Корзина</button>
                                </div>
                            </div>
                            
                            <div v-if="task.desc">{{ task.desc }}</div>
                            <div class="task-meta">
                                <div>Дата {{ formatDate(task.deadline) }}</div>
                                <div>Создано: {{ formatDateTime(task.createdAt) }}</div>
                                <div v-if="task.editedAt">Изменено: {{ formatDateTime(task.editedAt) }}</div>
                                <div v-if="task.completedAt">Завершено: {{ formatDateTime(task.completedAt) }}</div>
                            </div>
                            
                            <div class="move-buttons">
                                <button v-if="canMoveForward(column.id)" @click="moveTask(task.id, column.id)">→</button>
                                <button v-if="canMoveBack(column.id)" @click="returnTask(task.id)">←</button>
                            </div>
                            
                            <div v-if="task.returnReason" class="return-reason">
                                <small><strong>Причина:</strong> {{ task.returnReason }}</small>
                            </div>
                        </div>
                    </div>
                    
                    <button v-if="column.id === 'planned'" @click="showAddModal">+ Добавить</button>
                </div>
            </div>
            <div class="modal" v-if="modal.show">
                <div class="modal-content">
                    <h3>{{ modal.title }}</h3>
                    
                    <div class="form-group">
                        <label>Название</label>
                        <input v-model="modal.form.title" type="text">
                    </div>
                    
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea v-model="modal.form.desc"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Дедлайн</label>
                        <input v-model="modal.form.deadline" type="datetime-local">
                    </div>
                    
                    <div class="modal-buttons">
                        <button @click="saveTask">Сохранить</button>
                        <button @click="modal.show = false">Отмена</button>
                    </div>
                </div>
            </div>
            <div class="modal" v-if="returnModal.show">
                <div class="modal-content">
                    <h3>Причина возврата</h3>
                    
                    <div class="form-group">
                        <label>Укажите причину</label>
                        <textarea v-model="returnModal.reason" rows="3"></textarea>
                    </div>
                    
                    <div class="modal-buttons">
                        <button @click="confirmReturn">Подтвердить</button>
                        <button @click="returnModal.show = false">Отмена</button>
                    </div>
                </div>
            </div>
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
        formatDate(date) {
            return new Date(date).toLocaleDateString('ru-RU');
        },
        formatDateTime(date) {
            if (!date) return '';
            return new Date(date).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
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
