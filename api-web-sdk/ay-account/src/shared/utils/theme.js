export function normalizeTheme(theme) {
    return theme === "light" || theme === "dark" || theme === "auto"
        ? theme
        : "auto";
}
