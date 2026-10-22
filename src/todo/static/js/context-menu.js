// ============================================================
// Контекстное меню (правый клик).
// Работает независимо от drag-and-drop.
// ============================================================

// Обертка (IIFE), чтобы переменные не засоряли глобальную область видимости.
(function () {
    'use strict';

    // Находим HTML-элемент меню, который мы добавили в board.html
    const menu = document.getElementById('custom-context-menu');

    // Переменная для хранения того, на что именно мы кликнули правой кнопкой.
    // Например: { type: 'list', id: 5 } или { type: 'task', id: 12 }
    let currentTarget = null;

    // --- Вспомогательные функции ---

    // Спрятать меню и сбросить цель
    function hideMenu() {
        menu.hidden = true;
        currentTarget = null;
    }

    // Показать меню в координатах мыши (x, y)
    function showMenu(x, y) {
        // Позиционируем меню абсолютно (стили position: absolute заданы в CSS)
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.hidden = false;
    }

    // --- Обработчик правого клика по всей странице ---
    // Мы вешаем обработчик на весь document, а не на каждую задачу/список.
    // Это называется "делегирование событий" и экономит память.
    document.addEventListener('contextmenu', (e) => {

        // e.target — это элемент, по которому кликнули.
        // .closest() ищет ближайшего родителя с нужным классом.
        // Если кликнули по тексту внутри задачи, closest найдет саму карточку.
        const listItem = e.target.closest('.list-item');
        const taskCard = e.target.closest('.task-card');

        if (listItem) {
            // Предотвращаем стандартное меню браузера (Сохранить картинку, Копировать и т.д.)
            e.preventDefault();

            // Запоминаем, что кликнули по списку, и берем его ID из data-атрибута
            currentTarget = { type: 'list', id: parseInt(listItem.dataset.listId, 10) };

            // Показываем наше меню в координатах курсора (pageX/pageY учитывают скролл страницы)
            showMenu(e.pageX, e.pageY);

        } else if (taskCard) {
            e.preventDefault();

            // Для задачи ID хранится в чекбоксе (мы так верстали карточку)
            const checkbox = taskCard.querySelector('.task-checkbox');
            currentTarget = { type: 'task', id: parseInt(checkbox.dataset.taskId, 10) };

            showMenu(e.pageX, e.pageY);

        } else {
            // Если кликнули в пустоту (не по списку и не по задаче) — прячем меню
            hideMenu();
        }
    });

    // --- Обработчик клика в любом месте страницы ---
    // Если меню открыто, и мы кликнули в другое место — оно должно закрыться.
    document.addEventListener('click', hideMenu);

    // --- Обработчик клика по пунктам меню ---
    menu.addEventListener('click', async (e) => {
        // Находим кнопку, по которой кликнули
        const btn = e.target.closest('.context-menu-item');

        // Если кликнули мимо кнопки или currentTarget сбросился — выходим
        if (!btn || !currentTarget) return;

        // Узнаем, какое действие выбрано (у нас пока только 'delete')
        const action = btn.dataset.action;

        if (action === 'delete') {
            // Формируем правильный текст подтверждения
            const confirmMsg = currentTarget.type === 'list'
                ? 'Удалить список и все его задачи?'
                : 'Удалить задачу?';

            if (confirm(confirmMsg)) {
                try {
                    // Вызываем нужный метод из нашего API (api.v2.js)
                    if (currentTarget.type === 'list') {
                        await API.deleteList(currentTarget.id);
                    } else if (currentTarget.type === 'task') {
                        await API.deleteTask(currentTarget.id);
                    }

                    // ВАЖНО: Context-menu.js не знает, как перерисовывать интерфейс (это делает main.js).
                    // Поэтому мы "кричим" (отправляем событие) на весь document,
                    // что данные изменились. main.js слушает это событие и обновляет экран.
                    document.dispatchEvent(new CustomEvent('data-changed'));

                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
            }
        }
        // В любом случае после действия прячем меню
        hideMenu();
    });
})();