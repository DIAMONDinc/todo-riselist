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
    let categoriesContainer;
    let tasksContainer;
    let currentListTitle;
    let createTaskBtn;

    // ============================================================
    // API-обёртки
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
        categoriesContainer.innerHTML = '';

        if (state.categories.length === 0) {
            categoriesContainer.innerHTML = '<p class="empty-hint">Нет категорий. Создайте первую.</p>';
            return;
        }

        state.categories.forEach(category => {
            const listsOfCategory = state.lists.filter(
                l => l.category_id === category.id
            );

            // Формируем HTML для каждого списка (добавляем кнопку "три точки")
            const listsHtml = listsOfCategory.map(list => {
                const activeClass = list.id === state.selectedListId ? ' active' : '';
                return `
                    <div class="list-item${activeClass}" data-list-id="${list.id}">
                        <span class="list-item-name">${escapeHtml(list.name)}</span>
                        <button class="icon-btn more-btn" data-list-more="${list.id}">⋮</button>
                    </div>
                `;
            }).join('');

            // Карточка категории (добавляем data-category-id для Drag-and-Drop)
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category';
            categoryEl.dataset.categoryId = category.id; // <-- Нужно для DnD задач на пустые категории
            categoryEl.innerHTML = `
                <div class="category-header">
                    <span class="category-name">${escapeHtml(category.name)}</span>
                    <button class="icon-btn danger" data-delete-category="${category.id}" title="Удалить">✕</button>
                </div>
                <div class="list-items">${listsHtml}</div>
            `;

            categoriesContainer.appendChild(categoryEl);
        });

        // Навешиваем обработчики на списки
        categoriesContainer.querySelectorAll('.list-item').forEach(el => {
            el.addEventListener('click', (e) => {
                // ВАЖНО: Если кликнули на кнопку "три точки", не выбираем список!
                if (e.target.closest('.more-btn')) return;

                selectList(parseInt(el.dataset.listId, 10));
            });
        });

        // Обработчики на кнопки удаления категорий (крестик ✕)
        categoriesContainer.querySelectorAll('[data-delete-category]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const catId = parseInt(btn.dataset.deleteCategory, 10);

                // Используем наше красивое модальное окно из context-menu.js,
                // если оно доступно, иначе fallback на confirm.
                if (typeof window.showModal === 'function') {
                    window.showModal('Удалить категорию?', 'Удалятся все списки и задачи внутри этой категории.', async () => {
                        await API.deleteCategory(catId);
                        await refreshAll();
                    });
                } else {
                    if (!confirm('Удалить категорию и все её списки с задачами?')) return;
                    try {
                        await API.deleteCategory(catId);
                        await refreshAll();
                    } catch (err) { alert('Ошибка: ' + err.message); }
                }
            });
        });
    }

    function renderTasks() {
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
            card.draggable = true;
            card.dataset.taskId = task.id;

            // Обратите внимание: крестик ✕ заменён на кнопку "три точки" ⋮
            card.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.is_done ? 'checked' : ''} data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                </div>
                <button class="icon-btn more-btn" data-task-more="${task.id}">⋮</button>
            `;

            // Обработчик чекбокса (toggle)
            card.querySelector('.task-checkbox').addEventListener('change', async (e) => {
                try {
                    await API.toggleTask(task.id);
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

        const list = state.lists.find(l => l.id === listId);
        currentListTitle.textContent = list ? list.name : 'Список';

        createTaskBtn.hidden = false;

        await loadTasks(listId);

        renderSidebar();
        renderTasks();
    }

    async function refreshAll() {
        await loadCategories();
        await loadLists();

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

        document.getElementById('create-list-btn').addEventListener('click', async () => {
            if (state.categories.length === 0) {
                alert('Сначала создайте хотя бы одну категорию.');
                return;
            }
            const name = prompt('Название списка:');
            if (!name || !name.trim()) return;

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

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================================
    // Инициализация
    // ============================================================

    async function init() {
        categoriesContainer = document.getElementById('categories-container');
        tasksContainer = document.getElementById('tasks-container');
        currentListTitle = document.getElementById('current-list-title');
        createTaskBtn = document.getElementById('create-task-btn');

        setupButtons();

        // Слушаем событие из context-menu.js (когда там что-то удаляют/меняют)
        document.addEventListener('data-changed', async () => {
            await refreshAll();
        });

        try {
            await refreshAll();
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            categoriesContainer.innerHTML = `<p class="empty-hint">Ошибка: ${escapeHtml(err.message)}</p>`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();