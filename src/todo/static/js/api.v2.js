console.log('[api.v2.js] loaded, typeof window.API will be:', typeof window);
// ============================================================
// Обёртки над fetch для всех API-эндпоинтов.
// Все функции возвращают Promise с распарсенным JSON.
// При ошибке бросают исключение с текстом ошибки.
// ============================================================

window.API = (function () {
    'use strict';

    // Базовый обработчик ответа: проверяет статус, парсит JSON
    async function handleResponse(response) {
        // 204 No Content — тела нет, возвращаем null
        if (response.status === 204) {
            return null;
        }

        // Пытаемся распарсить JSON (даже для ошибок — сервер возвращает {"error": "..."})
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Сервер вернул 4xx или 5xx — бросаем ошибку
            const message = data.error
                ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
                : `HTTP ${response.status}`;
            throw new Error(message);
        }

        return data;
    }

    // Универсальный запрос
    async function request(url, options = {}) {
        const defaults = {
            headers: { 'Content-Type': 'application/json' },
        };
        const response = await fetch(url, { ...defaults, ...options });
        return handleResponse(response);
    }

    // --- Категории ---

    function getCategories() {
        return request('/categories/');
    }

    function createCategory(name) {
        return request('/categories/', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    function deleteCategory(id) {
        return request(`/categories/${id}`, { method: 'DELETE' });
    }

    // --- Списки ---

    function getLists(categoryId) {
        const url = categoryId
            ? `/lists/?category_id=${categoryId}`
            : '/lists/';
        return request(url);
    }

    function createList(name, categoryId) {
        return request('/lists/', {
            method: 'POST',
            body: JSON.stringify({ name, category_id: categoryId }),
        });
    }

    function deleteList(id) {
        return request(`/lists/${id}`, { method: 'DELETE' });
    }

    // --- Задачи ---

    function getTasksByList(listId) {
        return request(`/tasks/by-list/${listId}`);
    }

    function createTask(listId, title, description = '') {
        return request(`/tasks/by-list/${listId}`, {
            method: 'POST',
            body: JSON.stringify({ title, description }),
        });
    }

    function toggleTask(taskId) {
        return request(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
    }

    function deleteTask(taskId) {
        return request(`/tasks/${taskId}`, { method: 'DELETE' });
    }

    function reorderTasks(taskIds) {
        return request('/tasks/reorder', {
            method: 'POST',
            body: JSON.stringify({ task_ids: taskIds }),
        });
    }

    // Публичный API модуля
    return {
        getCategories,
        createCategory,
        deleteCategory,
        getLists,
        createList,
        deleteList,
        getTasksByList,
        createTask,
        toggleTask,
        deleteTask,
        reorderTasks,
    };
})();