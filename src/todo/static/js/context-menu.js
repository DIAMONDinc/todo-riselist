// ============================================================
// Логика кастомных меню (три точки, подменю) и модальных окон.
// ============================================================

(function () {
    'use strict';

    // Находим элементы
    const menu = document.getElementById('custom-context-menu');
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    // Если элементов нет на странице — выходим, чтобы не было ошибок
    if (!menu || !modal) {
        console.warn('Не найдены элементы меню или модального окна!');
        return;
    }

    let currentTarget = null; // { type: 'list'|'task', id: number }

        // --- Модальное окно ---
    // Выносим в window, чтобы main.js тоже мог его использовать
    window.showModal = function(title, text, onConfirm) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modal.hidden = false;

        // Используем onclick, чтобы перезаписать предыдущий обработчик, а не добавлять новый
        modalConfirm.onclick = () => {
            modal.hidden = true;
            if (onConfirm) onConfirm();
        };
    };

    modalCancel.addEventListener('click', () => { modal.hidden = true; });

    // --- Прячем меню ---
    function hideMenu() {
        menu.hidden = true;
        menu.innerHTML = ''; // Очищаем содержимое
    }

    // --- Показ меню ---
    function showMenu(x, y, htmlContent) {
        menu.innerHTML = htmlContent;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.hidden = false;
    }

    // --- Обработчик клика по кнопкам "Три точки" ---
    document.addEventListener('click', async (e) => {
        // 1. Если кликнули по кнопке "три точки" у задачи
        const taskMoreBtn = e.target.closest('[data-task-more]');
        if (taskMoreBtn) {
            e.stopPropagation();
            e.preventDefault();

            const taskId = parseInt(taskMoreBtn.dataset.taskMore, 10);
            currentTarget = { type: 'task', id: taskId };

            const rect = taskMoreBtn.getBoundingClientRect();
            const x = rect.left + window.scrollX - 120;
            const y = rect.bottom + window.scrollY + 4;

            // Получаем все списки для подменю
            const lists = await API.getLists();
            let listsHtml = lists.map(l => `<button class="context-menu-item" data-move-to="${l.id}">${escapeHtml(l.name)}</button>`).join('');
            if (lists.length === 0) {
                listsHtml = `<div class="context-menu-item" style="color:var(--text-muted); cursor:default;">Нет списков</div>`;
            }

            const html = `
                <div class="context-menu-item has-submenu">
                    📁 Переместить в список
                    <div class="context-submenu">
                        ${listsHtml}
                        <button class="context-menu-item" data-create-list-move>+ Создать новый список</button>
                    </div>
                </div>
                <button class="context-menu-item" data-delete-task="${taskId}" style="color: var(--danger);">🗑️ Удалить</button>
            `;
            showMenu(x, y, html);
            return;
        }

        // 2. Если кликнули по кнопке "три точки" у списка
        const listMoreBtn = e.target.closest('[data-list-more]');
        if (listMoreBtn) {
            e.stopPropagation();
            e.preventDefault();

            const listId = parseInt(listMoreBtn.dataset.listMore, 10);
            currentTarget = { type: 'list', id: listId };

            const rect = listMoreBtn.getBoundingClientRect();
            const x = rect.left + window.scrollX - 100;
            const y = rect.bottom + window.scrollY + 4;

            const html = `
                <button class="context-menu-item" data-rename-list="${listId}">✏️ Переименовать</button>
                <button class="context-menu-item" data-delete-list="${listId}" style="color: var(--danger);">🗑️ Удалить</button>
            `;
            showMenu(x, y, html);
            return;
        }

        // 3. Клик мимо меню — прячем его
        // Но если кликнули внутри меню, не прячем (там свои обработчики)
        if (!e.target.closest('#custom-context-menu')) {
            hideMenu();
        }
    });

    // --- Обработка кликов ВНУТРИ меню ---
    menu.addEventListener('click', async (e) => {
        const btn = e.target.closest('.context-menu-item');
        if (!btn) return;

        if (btn.classList.contains('has-submenu')) {
            e.stopPropagation();
            return;
        }

        // --- Действия с задачами ---
        if (btn.dataset.moveTo) {
            const newListId = parseInt(btn.dataset.moveTo, 10);
            try {
                await API.moveTask(currentTarget.id, newListId);
                document.dispatchEvent(new CustomEvent('data-changed'));
            } catch (err) { alert(err.message); }
            hideMenu();
            return;
        }

        if (btn.hasAttribute('data-create-list-move')) {
            hideMenu();
            const newListName = prompt('Введите название нового списка:');
            if (!newListName || !newListName.trim()) return;

            try {
                // Ищем категорию текущего выбранного списка
                // Для этого нам нужны данные из main.js, но проще спросить у API
                const lists = await API.getLists();
                // В данном случае мы не знаем, в какую категорию создавать,
                // поэтому создаем в первой попавшейся (или можно спросить ID категории)
                // Для простоты пока просто предупредим.
                alert('Для создания списка используйте кнопку "+ Список" в левом меню.');
            } catch (err) { alert(err.message); }
            return;
        }

        if (btn.dataset.deleteTask) {
            const taskId = parseInt(btn.dataset.deleteTask, 10);
            hideMenu();
            window.showModal(
                'Удалить задачу?',
                'Вы собираетесь удалить задачу. Восстановить её будет невозможно (корзина пока не реализована).',
                async () => {
                    try {
                        await API.deleteTask(taskId);
                        document.dispatchEvent(new CustomEvent('data-changed'));
                    } catch (err) { alert(err.message); }
                }
            );
            return;
        }

        // --- Действия со списками ---
        if (btn.dataset.renameList) {
            const listId = parseInt(btn.dataset.renameList, 10);
            hideMenu();
            const newName = prompt('Введите новое название списка:');
            if (!newName || !newName.trim()) return;

            try {
                await API.updateList(listId, newName.trim());
                document.dispatchEvent(new CustomEvent('data-changed'));
            } catch (err) { alert(err.message); }
            return;
        }

        if (btn.dataset.deleteList) {
            const listId = parseInt(btn.dataset.deleteList, 10);
            hideMenu();
            window.showModal(
                'Удалить список?',
                'Вы собираетесь удалить СПИСОК вместе со всеми его задачами. Это действие необратимо.',
                async () => {
                    try {
                        await API.deleteList(listId);
                        document.dispatchEvent(new CustomEvent('data-changed'));
                    } catch (err) { alert(err.message); }
                }
            );
            return;
        }
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();