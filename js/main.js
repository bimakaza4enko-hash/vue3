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
