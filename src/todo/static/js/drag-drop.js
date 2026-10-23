// ============================================================
// Нативный Drag-and-Drop для задач.
// 1. Сортировка внутри одного списка.
// 2. Перетаскивание в другие списки.
// 3. Перетаскивание в пустые категории (с созданием списка).
// ============================================================

(function () {
    'use strict';

    // Переменная для хранения элемента, который мы сейчас тащим
    let draggedItem = null;

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('tasks-container');
        const sidebar = document.getElementById('categories-container');

        if (!container || !sidebar) return;

        // ============================================================
        // ЧАСТЬ 1: Перетаскивание внутри правой панели (сортировка)
        // ============================================================

        // --- Начало перетаскивания (dragstart) ---
        document.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.task-card');
            if (!card) return;

            draggedItem = card;
            card.classList.add('dragging');

            // Firefox требует установить данные, иначе drag не начнется
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.taskId);
        });

        // --- Процесс перетаскивания над контейнером (dragover) ---
        container.addEventListener('dragover', (e) => {
            e.preventDefault(); // Разрешаем drop

            const afterElement = getDragAfterElement(container, e.clientY);
            const currentDragged = document.querySelector('.dragging');
            if (!currentDragged) return;

            // Визуально двигаем карточку
            if (afterElement == null) {
                container.appendChild(currentDragged);
            } else {
                container.insertBefore(currentDragged, afterElement);
            }
        });

        // --- Завершение перетаскивания (dragend) ---
        document.addEventListener('dragend', () => {
            if (!draggedItem) return;
            draggedItem.classList.remove('dragging');
            draggedItem = null;

            // Сохраняем новый порядок внутри текущего списка
            saveOrder();
        });

        // ============================================================
        // ЧАСТЬ 2: Перетаскивание в сайдбар (на списки или категории)
        // ============================================================

        // Когда тащим задачу НАД сайдбаром
        sidebar.addEventListener('dragover', (e) => {
            const listItem = e.target.closest('.list-item');
            const category = e.target.closest('.category');

            // Наводим на конкретный список
            if (listItem) {
                e.preventDefault();
                listItem.classList.add('drop-target');
            }
            // Наводим на категорию, внутри которой НЕТ списков
            else if (category && category.querySelectorAll('.list-item').length === 0) {
                e.preventDefault();
                category.classList.add('drop-target');
            }
        });

        // Убираем подсветку, когда уводим мышь
        sidebar.addEventListener('dragleave', (e) => {
            const listItem = e.target.closest('.list-item');
            const category = e.target.closest('.category');
            if (listItem) listItem.classList.remove('drop-target');
            if (category) category.classList.remove('drop-target');
        });

        // Когда отпускаем задачу в сайдбаре
        sidebar.addEventListener('drop', async (e) => {
            const listItem = e.target.closest('.list-item');
            const category = e.target.closest('.category');
            const draggedCard = document.querySelector('.dragging');

            if (!draggedCard) return;
            const taskId = parseInt(draggedCard.dataset.taskId, 10);

            // Сценарий А: Упало на существующий список
            if (listItem) {
                e.preventDefault();
                listItem.classList.remove('drop-target');
                const newListId = parseInt(listItem.dataset.listId, 10);

                try {
                    await API.moveTask(taskId, newListId);
                    document.dispatchEvent(new CustomEvent('data-changed'));
                } catch (err) {
                    alert('Не удалось переместить задачу: ' + err.message);
                }
            }
            // Сценарий Б: Упало на пустую категорию
            else if (category && category.querySelectorAll('.list-item').length === 0) {
                e.preventDefault();
                category.classList.remove('drop-target');

                const categoryId = parseInt(category.dataset.categoryId, 10);
                const categoryName = category.querySelector('.category-name').textContent;

                const newListName = prompt(`В категории "${categoryName}" нет списков.\nСоздать новый список и переместить туда задачу?`);

                // Если нажали Отмена или пустая строка — откатываем визуально
                if (!newListName || !newListName.trim()) {
                    document.dispatchEvent(new CustomEvent('data-changed'));
                    return;
                }

                try {
                    // Создаем список и сразу переносим туда задачу
                    const newList = await API.createList(newListName.trim(), categoryId);
                    await API.moveTask(taskId, newList.id);
                    document.dispatchEvent(new CustomEvent('data-changed'));
                } catch (err) {
                    console.error(err);
                    alert('Ошибка: ' + err.message);
                }
            }
        });
    });

    // ============================================================
    // Вспомогательные функции
    // ============================================================

    // Вычисляет, перед каким элементом нужно вставить карточку
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Сохраняет порядок на сервере
    async function saveOrder() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        const cards = container.querySelectorAll('.task-card');
        const newOrder = Array.from(cards).map(card => parseInt(card.dataset.taskId, 10));

        if (newOrder.length === 0) return;

        try {
            await API.reorderTasks(newOrder);
            console.log('Порядок задач сохранен:', newOrder);
        } catch (err) {
            console.error('Ошибка сохранения порядка:', err);
            // Возвращаем всё как было при ошибке
            document.dispatchEvent(new CustomEvent('data-changed'));
        }
    }
})();