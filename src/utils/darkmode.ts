// Keep the same class and storage convention as the Guild template.
export function toggleDarkMode() {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  const isLight = root.classList.toggle("darkmode");
  // Apply the new colors immediately before restoring hover transitions.
  void root.offsetHeight;
  root.classList.remove("theme-switching");
  try {
    localStorage.setItem("darkmode", isLight ? "active" : "inactive");
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
}