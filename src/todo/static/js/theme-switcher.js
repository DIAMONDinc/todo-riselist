// ============================================================
// Переключение тем.
// Тема хранится в localStorage и применяется при загрузке.
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'riselist-theme';
    const DEFAULT_THEME = 'light';
    const VALID_THEMES = ['light', 'dark', 'night'];

    // Применить тему: выставить атрибут на <html> и подсветить активную кнопку
    function applyTheme(theme) {
        if (!VALID_THEMES.includes(theme)) {
            theme = DEFAULT_THEME;
        }
        document.documentElement.setAttribute('data-theme', theme);

        // Подсветить активную кнопку
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.themeValue === theme);
        });

        localStorage.setItem(STORAGE_KEY, theme);
    }

    // Прочитать сохранённую тему или тему по умолчанию
    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return VALID_THEMES.includes(saved) ? saved : DEFAULT_THEME;
    }

    // Инициализация при загрузке страницы
    function init() {
        // Применяем сразу — до взаимодействия с кнопками,
        // чтобы избежать «мигания» темы
        applyTheme(getSavedTheme());

        // Навешиваем обработчики на кнопки тем
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyTheme(btn.dataset.themeValue);
            });
        });
    }

    // DOM уже загружен? Тогда запускаем сразу.
    // Иначе — ждём события DOMContentLoaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
