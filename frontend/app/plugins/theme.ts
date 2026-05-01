export interface ThemeConfig {
  lightPrimary: string;
  lightAccent: string;
  lightSecondary: string;
  lightSuccess: string;
  lightInfo: string;
  lightWarning: string;
  lightError: string;
  darkPrimary: string;
  darkAccent: string;
  darkSecondary: string;
  darkSuccess: string;
  darkInfo: string;
  darkWarning: string;
  darkError: string;
}

let __cachedTheme: ThemeConfig | undefined;

async function fetchTheme(): Promise<ThemeConfig | undefined> {
  const route = "/api/app/about/theme";

  try {
    const response = await fetch(route);
    const data = await response.json();
    return data as ThemeConfig;
  }
  catch {
    return undefined;
  }
}

// Default ByteSized colors — must match the values in tailwind.css :root / .dark blocks.
// These are only applied at runtime when in non-lite mode (admin-configured theme).
const byteSizedColors = {
  light: {
    primary: "#4A7C59",
    accent: "#C4622D",
    secondary: "#7A6E62",
    success: "#43A047",
    info: "#1976d2",
    warning: "#FF6D00",
    error: "#EF5350",
  },
  dark: {
    primary: "#6BA082",
    accent: "#E8845A",
    secondary: "#A09288",
    success: "#43A047",
    info: "#1976d2",
    warning: "#FF6D00",
    error: "#EF5350",
  },
};

/**
 * Apply a set of color overrides as --bs-* CSS custom properties on :root.
 * This lets the Tailwind token layer pick up admin-configured brand colors
 * at runtime without any Vuetify dependency.
 */
function applyColorVars(colors: Record<string, string>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--bs-${key}`, value);
  }
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const isLiteMode = nuxtApp.$config.public.LITE_MODE;

  // In lite mode the CSS defaults from tailwind.css are always correct — nothing to do.
  if (isLiteMode) return { provide: {} };

  // Non-lite: fetch admin-configured theme and override the CSS variables so
  // Tailwind utility classes (bg-primary, text-error, etc.) reflect the custom brand.
  let theme = __cachedTheme;
  if (!theme) {
    theme = await fetchTheme();
    __cachedTheme = theme;
  }

  const lightColors = {
    primary:   theme?.lightPrimary   ?? byteSizedColors.light.primary,
    accent:    theme?.lightAccent    ?? byteSizedColors.light.accent,
    secondary: theme?.lightSecondary ?? byteSizedColors.light.secondary,
    success:   theme?.lightSuccess   ?? byteSizedColors.light.success,
    info:      theme?.lightInfo      ?? byteSizedColors.light.info,
    warning:   theme?.lightWarning   ?? byteSizedColors.light.warning,
    error:     theme?.lightError     ?? byteSizedColors.light.error,
  };

  const darkColors = {
    primary:   theme?.darkPrimary   ?? byteSizedColors.dark.primary,
    accent:    theme?.darkAccent    ?? byteSizedColors.dark.accent,
    secondary: theme?.darkSecondary ?? byteSizedColors.dark.secondary,
    success:   theme?.darkSuccess   ?? byteSizedColors.dark.success,
    info:      theme?.darkInfo      ?? byteSizedColors.dark.info,
    warning:   theme?.darkWarning   ?? byteSizedColors.dark.warning,
    error:     theme?.darkError     ?? byteSizedColors.dark.error,
  };

  // Apply light-mode overrides immediately (dark-mode CSS handled via .dark selector in tailwind.css)
  applyColorVars(lightColors);

  // Watch for dark-mode toggle and swap the variable set
  if (typeof window !== "undefined") {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      applyColorVars(dark ? darkColors : lightColors);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Apply correct set for initial state
    const initialDark = document.documentElement.classList.contains("dark");
    if (initialDark) applyColorVars(darkColors);
  }

  return { provide: {} };
});
