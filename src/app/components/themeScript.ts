export const THEME_STORAGE_KEY = "clima-theme";

export function getThemeInitScript() {
  return `
    (function() {
      try {
        var storageKey = "${THEME_STORAGE_KEY}";
        var stored = localStorage.getItem(storageKey);
        var mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
        var resolved = mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : (mode === "system" ? "light" : mode);
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.colorScheme = resolved;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;
}
