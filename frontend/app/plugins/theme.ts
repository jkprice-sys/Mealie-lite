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
    background: "#1A2419",
    surface: "#1A2419",
  },
};

export default defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.hook("vuetify:before-create", async ({ vuetifyOptions }) => {
    const isLiteMode = nuxtApp.$config.public.LITE_MODE;

    let lightColors = byteSizedColors.light;
    let darkColors = byteSizedColors.dark;

    if (!isLiteMode) {
      let theme = __cachedTheme;
      if (!theme) {
        theme = await fetchTheme();
        __cachedTheme = theme;
      }
      lightColors = {
        primary: theme?.lightPrimary ?? "#E58325",
        accent: theme?.lightAccent ?? "#007A99",
        secondary: theme?.lightSecondary ?? "#973542",
        success: theme?.lightSuccess ?? "#43A047",
        info: theme?.lightInfo ?? "#1976d2",
        warning: theme?.lightWarning ?? "#FF6D00",
        error: theme?.lightError ?? "#EF5350",
      };
      darkColors = {
        primary: theme?.darkPrimary ?? "#E58325",
        accent: theme?.darkAccent ?? "#007A99",
        secondary: theme?.darkSecondary ?? "#973542",
        success: theme?.darkSuccess ?? "#43A047",
        info: theme?.darkInfo ?? "#1976d2",
        warning: theme?.darkWarning ?? "#FF6D00",
        error: theme?.darkError ?? "#EF5350",
        background: "#1E1E1E",
        surface: "#1E1E1E",
      };
    }

    vuetifyOptions.theme = {
      defaultTheme: nuxtApp.$config.public.useDark ? "dark" : "light",
      variations: {
        colors: ["primary", "accent", "secondary", "success", "info", "warning", "error", "background"],
        lighten: 3,
        darken: 3,
      },
      themes: {
        light: {
          dark: false,
          colors: lightColors,
        },
        dark: {
          dark: true,
          colors: darkColors,
        },
      },
    };
  });
});
