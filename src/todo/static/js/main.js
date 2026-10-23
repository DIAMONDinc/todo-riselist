// ============================================================
// Главная логика приложения:
//   - загрузка категорий/списков/задач
//   - рендеринг сайдбара и задач
//   - обработка кнопок и кликов
// ============================================================

(function () {
    'use strict';

    // Текущее состояние приложения
    const state = {
        categories: [],   // [{id, name, position}, ...]
        lists: [],        // [{id, name, category_id, position}, ...]
        selectedListId: null,  // id выбранного списка
        tasks: [],        // задачи выбранного списка
    };

    // --- DOM-элементы ---
    // Находим элементы один раз при инициализации,
    // чтобы не искать их при каждом рендере
    let categoriesContainer;
    let tasksContainer;
    let currentListTitle;
    let createTaskBtn;

    // ============================================================
    // API-обёртки (используем window.API из api.v2.js)
    // ============================================================

    async function loadCategories() {
        state.categories = await API.getCategories();
    }

    async function loadLists() {
        state.lists = await API.getLists();
    }

    async function loadTasks(listId) {
        state.tasks = await API.getTasksByList(listId);
    }

    // ============================================================
    // Рендеринг
    // ============================================================

    function renderSidebar() {
        // Очищаем контейнер
        categoriesContainer.innerHTML = '';

        if (state.categories.length === 0) {
            categoriesContainer.innerHTML = '<p class="empty-hint">Нет категорий. Создайте первую.</p>';
            return;
        }

        // Для каждой категории создаём блок
        state.categories.forEach(category => {
            // Списки этой категории
            const listsOfCategory = state.lists.filter(
                l => l.category_id === category.id
            );

            // Собираем HTML списка задач
            const listsHtml = listsOfCategory.map(list => {
                const activeClass = list.id === state.selectedListId ? ' active' : '';
                return `
                    <div class="list-item${activeClass}" data-list-id="${list.id}">
                        <span class="list-item-name">${escapeHtml(list.name)}</span>
                    </div>
                `;
            }).join('');

            // Карточка категории
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category';
            categoryEl.innerHTML = `
                <div class="category-header">
                    <span class="category-name">${escapeHtml(category.name)}</span>
                    <button class="icon-btn danger" data-delete-category="${category.id}" title="Удалить">✕</button>
                </div>
                <div class="list-items">${listsHtml}</div>
            `;

            categoriesContainer.appendChild(categoryEl);
        });

        // Навешиваем обработчики на списки (делегирование)
        categoriesContainer.querySelectorAll('.list-item').forEach(el => {
            el.addEventListener('click', () => {
                selectList(parseInt(el.dataset.listId, 10));
            });
        });

        // Обработчики на кнопки удаления категорий
        categoriesContainer.querySelectorAll('[data-delete-category]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const catId = parseInt(btn.dataset.deleteCategory, 10);
                if (!confirm('Удалить категорию и все её списки с задачами?')) return;
                try {
                    await API.deleteCategory(catId);
                    await refreshAll();
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
            });
        });
    }

    function renderTasks() {
        // Очищаем контейнер
        tasksContainer.innerHTML = '';

        if (state.selectedListId === null) {
            tasksContainer.innerHTML = '<p class="empty-hint">Выберите список слева, чтобы увидеть задачи.</p>';
            return;
        }

        if (state.tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="empty-hint">Нет задач. Добавьте первую.</p>';
            return;
        }

        state.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card' + (task.is_done ? ' done' : '');
            card.draggable = true;         // <-- Добавляем: разрешаем перетаскивание
            card.dataset.taskId = task.id; // <-- Добавляем: сохраняем ID задачи в DOM (чтобы потом собрать порядок)
            card.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.is_done ? 'checked' : ''} data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                </div>
                <button class="icon-btn danger" data-delete-task="${task.id}" title="Удалить">✕</button>
            `;

            // Обработчик чекбокса — toggle
            card.querySelector('.task-checkbox').addEventListener('change', async (e) => {
                try {
                    await API.toggleTask(task.id);
                    await loadTasks(state.selectedListId);
                    renderTasks();
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
            });

            // Обработчик кнопки удаления
            card.querySelector('[data-delete-task]').addEventListener('click', async () => {
                if (!confirm('Удалить задачу?')) return;
                try {
                    await API.deleteTask(task.id);
                    await loadTasks(state.selectedListId);
                    renderTasks();
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
            });

            tasksContainer.appendChild(card);
        });
    }

    // ============================================================
    // Действия
    // ============================================================

    async function selectList(listId) {
        state.selectedListId = listId;

        // Найдём название списка
        const list = state.lists.find(l => l.id === listId);
        currentListTitle.textContent = list ? list.name : 'Список';

        // Показываем кнопку «+ Задача»
        createTaskBtn.hidden = false;

        // Загружаем задачи
        await loadTasks(listId);

        // Перерисовываем обе области
        renderSidebar();
        renderTasks();
    }

    async function refreshAll() {
        await loadCategories();
        await loadLists();
        // Если выбранный список удалили (например, вместе с категорией)
        if (state.selectedListId !== null) {
            const stillExists = state.lists.some(l => l.id === state.selectedListId);
            if (!stillExists) {
                state.selectedListId = null;
                state.tasks = [];
                currentListTitle.textContent = 'Выберите список';
                createTaskBtn.hidden = true;
            } else {
                await loadTasks(state.selectedListId);
            }
        }
        renderSidebar();
        renderTasks();
    }

    // ============================================================
    // Обработчики кнопок
    // ============================================================

    function setupButtons() {
        // «+ Категория»
        document.getElementById('create-category-btn').addEventListener('click', async () => {
            const name = prompt('Название категории:');
            if (!name || !name.trim()) return;
            try {
                await API.createCategory(name.trim());
                await refreshAll();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        });

        // «+ Список»
        document.getElementById('create-list-btn').addEventListener('click', async () => {
            if (state.categories.length === 0) {
                alert('Сначала создайте хотя бы одну категорию.');
                return;
            }
            const name = prompt('Название списка:');
            if (!name || !name.trim()) return;

            // Просим category_id (пока через prompt — потом заменим на select)
            const catList = state.categories.map(c => `${c.id}: ${c.name}`).join('\n');
            const catIdStr = prompt('В какую категорию (введите ID):\n' + catList);
            const catId = parseInt(catIdStr, 10);
            if (!catId || !state.categories.some(c => c.id === catId)) {
                alert('Неверный ID категории.');
                return;
            }

            try {
                await API.createList(name.trim(), catId);
                await refreshAll();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        });

        // «+ Задача»
        createTaskBtn.addEventListener('click', async () => {
            if (state.selectedListId === null) return;
            const title = prompt('Текст задачи:');
            if (!title || !title.trim()) return;
            try {
                await API.createTask(state.selectedListId, title.trim());
                await loadTasks(state.selectedListId);
                renderTasks();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        });
    }

    // ============================================================
    // Утилиты
    // ============================================================

    // Экранирование HTML — защита от XSS.
    // Если пользователь введёт "<script>", оно отобразится как текст, а не выполнится.
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================================
    // Инициализация
    // ============================================================

    async function init() {
        // Находим DOM-элементы
        categoriesContainer = document.getElementById('categories-container');
        tasksContainer = document.getElementById('tasks-container');
        currentListTitle = document.getElementById('current-list-title');
        createTaskBtn = document.getElementById('create-task-btn');

        // Навешиваем обработчики кнопок
        setupButtons();
        // Слушаем событие из context-menu.js: когда там что-то удалят,
        // мы перезагружаем данные и перерисовываем экран.
        document.addEventListener('data-changed', async () => {
            await refreshAll();
        });

        // Загружаем данные и рендерим
        try {
            await refreshAll();
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            categoriesContainer.innerHTML = `<p class="empty-hint">Ошибка: ${escapeHtml(err.message)}</p>`;
        }
    }

    // DOM готов? Запускаем.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
