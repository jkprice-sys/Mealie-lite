import { useDark } from "@vueuse/core";

export default defineNuxtPlugin(() => {
  // Dark mode is managed entirely by @vueuse/core useDark().
  // The "dark" class is toggled on <html> automatically.
  useDark();

  return {
    provide: {},
  };
});
