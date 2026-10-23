// ============================================================
// Нативный Drag-and-Drop для задач внутри списка.
// Использует HTML5 Drag and Drop API.
// ============================================================

(function () {
    'use strict';

    // Переменная для хранения элемента, который мы сейчас тащим
    let draggedItem = null;

    // Когда DOM загрузится, инициализируем drag-and-drop
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        // --- 1. Начало перетаскивания (dragstart) ---
        // Делегируем событие на весь document, чтобы не навешивать на каждую карточку
        document.addEventListener('dragstart', (e) => {
            // Проверяем: кликнули именно по карточке задачи?
            const card = e.target.closest('.task-card');
            if (!card) return;

            // Запоминаем элемент и добавляем ему класс для визуального эффекта (полупрозрачность)
            draggedItem = card;
            card.classList.add('dragging');

            // Firefox требует установить какие-то данные, иначе drag не начнется
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.taskId);
        });

        // --- 2. Процесс перетаскивания над контейнером (dragover) ---
        // Срабатывает постоянно, пока мы ведем мышь с зажатой задачей
        container.addEventListener('dragover', (e) => {
            // Отменяем стандартное поведение (без этого drop не сработает)
            e.preventDefault();

            // Находим элемент, ПЕРЕД которым нужно вставить нашу задачу
            const afterElement = getDragAfterElement(container, e.clientY);

            // Сам перетаскиваемый элемент
            const currentDragged = document.querySelector('.dragging');
            if (!currentDragged) return;

            // Визуально вставляем элемент на новое место прямо в процессе движения мыши
            if (afterElement == null) {
                container.appendChild(currentDragged); // В самый конец
            } else {
                container.insertBefore(currentDragged, afterElement); // Перед найденным элементом
            }
        });

        // --- 3. Завершение перетаскивания (dragend) ---
        // Срабатывает, когда мы отпустили кнопку мыши
        document.addEventListener('dragend', () => {
            if (!draggedItem) return;

            // Убираем визуальный эффект
            draggedItem.classList.remove('dragging');
            draggedItem = null;

            // Сохраняем новый порядок на сервере
            saveOrder();
        });
    });

    // --- Вспомогательная функция: где именно вставить элемент? ---
    // Она вычисляет, мимо какого элемента сейчас находится курсор мыши
    function getDragAfterElement(container, y) {
        // Получаем все карточки, КРОМЕ той, которую мы тащим
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            // Вычисляем смещение курсора относительно центра карточки
            const offset = y - box.top - box.height / 2;

            // Нам нужна карточка, над которой курсор, но которая ближе всего к курсору снизу
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Сохранение порядка на сервере ---
    async function saveOrder() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        // Собираем все карточки из DOM в их текущем (новом) порядке
        const cards = container.querySelectorAll('.task-card');
        // Извлекаем ID задач и превращаем в массив чисел
        const newOrder = Array.from(cards).map(card => parseInt(card.dataset.taskId, 10));

        if (newOrder.length === 0) return;

        try {
            // Отправляем новый порядок на бэкенд через наш API
            await API.reorderTasks(newOrder);
            console.log('Порядок задач сохранен:', newOrder);
        } catch (err) {
            console.error('Ошибка сохранения порядка:', err);
            alert('Не удалось сохранить порядок задач: ' + err.message);

            // Если произошла ошибка, просим main.js перезагрузить данные с сервера,
            // чтобы вернуть всё как было.
            document.dispatchEvent(new CustomEvent('data-changed'));
        }
    }
})();