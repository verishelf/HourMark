export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "crownly-marketplace-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`;
