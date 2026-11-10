/**
 * Inline script for <head>: applies the saved theme before first paint so
 * there is no flash of the wrong theme. Must stay dependency-free.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var p=localStorage.getItem("koodaamo:theme");var t=p==="dark"||p==="light"?p:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.setAttribute("data-theme",t);d.style.colorScheme=t;}catch(e){d.setAttribute("data-theme","light");}})();`;
