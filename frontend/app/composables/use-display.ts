/**
 * useDisplay — drop-in replacement for Vuetify's useDisplay composable.
 * Uses VueUse useBreakpoints with the same Vuetify breakpoint values so
 * existing call sites (xs, sm, md, lg, xl, smAndUp, mdAndUp, etc.) keep working.
 */
import { useBreakpoints } from "@vueuse/core";

const vuetifyBreakpoints = {
  xs:  0,
  sm:  600,
  md:  960,
  lg:  1280,
  xl:  1920,
  xxl: 2560,
};

export function useDisplay() {
  const bp = useBreakpoints(vuetifyBreakpoints);

  const xs       = bp.smaller("sm");
  const sm       = bp.between("sm", "md");
  const md       = bp.between("md", "lg");
  const lg       = bp.between("lg", "xl");
  const xl       = bp.between("xl", "xxl");
  const xxl      = bp.greaterOrEqual("xxl");

  const smAndUp  = bp.greaterOrEqual("sm");
  const mdAndUp  = bp.greaterOrEqual("md");
  const lgAndUp  = bp.greaterOrEqual("lg");
  const xlAndUp  = bp.greaterOrEqual("xl");

  const smAndDown = bp.smaller("md");
  const mdAndDown = bp.smaller("lg");
  const lgAndDown = bp.smaller("xl");

  return {
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    smAndUp,
    mdAndUp,
    lgAndUp,
    xlAndUp,
    smAndDown,
    mdAndDown,
    lgAndDown,
  };
}
