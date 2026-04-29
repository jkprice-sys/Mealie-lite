<template>
  <!--
    BaseDialog — Headless UI implementation.
    Prop/slot API is identical to the old Vuetify version so all call sites
    continue to work without changes.

    Slots:
      default              — body content (receives { submitEvent })
      activator({ open })  — optional trigger element
      card-actions         — replaces entire footer action row
      custom-card-action   — inserted between Cancel and Confirm buttons
  -->
  <div>
    <!-- Optional activator slot -->
    <slot name="activator" v-bind="{ open: openDialog }" />

    <!-- Teleport to body so z-index stacking is never a problem -->
    <Teleport to="body">
      <TransitionRoot :show="dialog" as="template">
        <Dialog
          as="div"
          class="relative z-50"
          @close="handleBackdropClose"
        >
          <!-- Backdrop -->
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div class="bs-dialog-overlay" aria-hidden="true" />
          </TransitionChild>

          <!-- Centering wrapper -->
          <div
            class="fixed inset-0 z-50 flex items-center justify-center"
            :class="isFullscreen ? 'p-0' : 'p-4'"
          >
            <TransitionChild
              as="template"
              enter="duration-200 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-150 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                :style="panelStyle"
                :class="[
                  'bs-dialog-panel',
                  isFullscreen ? 'rounded-none max-h-screen h-screen' : '',
                ]"
                @keydown.enter.stop="submitOnEnter"
              >
                <!-- Header bar -->
                <div
                  class="bs-dialog-header relative overflow-hidden"
                  :style="{ backgroundColor: headerBgColor }"
                >
                  <AppIcon
                    v-if="icon"
                    :path="icon"
                    size="lg"
                    class="shrink-0"
                  />
                  <DialogTitle class="text-base font-semibold leading-tight">
                    {{ title }}
                  </DialogTitle>
                  <!-- Loading progress bar -->
                  <div
                    v-if="loading"
                    class="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden"
                  >
                    <div class="h-full w-1/2 bg-white/50 animate-[progress_1.5s_ease-in-out_infinite]" />
                  </div>
                </div>

                <!-- Body -->
                <div class="bs-dialog-body" style="flex: 1 1 auto; min-height: 0;">
                  <slot v-bind="{ submitEvent }" />
                </div>

                <!-- Footer -->
                <div class="bs-dialog-footer">
                  <slot name="card-actions">
                    <button
                      type="button"
                      class="bs-btn bs-btn-sm bs-btn-ghost"
                      @click="cancelDialog"
                    >
                      {{ cancelText }}
                    </button>

                    <div class="flex items-center gap-2">
                      <slot name="custom-card-action" />

                      <BaseButton
                        v-if="canDelete"
                        delete
                        @click="deleteEvent"
                      />
                      <BaseButton
                        v-if="canConfirm"
                        :color="color"
                        type="submit"
                        :disabled="submitDisabled"
                        @click="confirmDialog"
                      >
                        <template #icon>
                          {{ $globals.icons.check }}
                        </template>
                        {{ $t("general.confirm") }}
                      </BaseButton>
                      <BaseButton
                        v-if="canSubmit"
                        type="submit"
                        :disabled="submitDisabled || loading"
                        @click="submitEvent"
                      >
                        {{ submitText }}
                        <template v-if="submitIcon" #icon>
                          {{ submitIcon }}
                        </template>
                      </BaseButton>
                    </div>
                  </slot>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </TransitionRoot>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { useDisplay } from "vuetify";

// ── Props ──────────────────────────────────────────────────────────────────
interface DialogProps {
  modelValue: boolean;
  color?: string;
  title?: string;
  icon?: string | null;
  width?: number | string;
  maxWidth?: number | string | null;
  loading?: boolean;
  top?: boolean | null;
  keepOpen?: boolean;
  submitIcon?: string | null;
  submitText?: string;
  submitDisabled?: boolean;
  cancelText?: string;
  canDelete?: boolean;
  canConfirm?: boolean;
  canSubmit?: boolean;
  disableSubmitOnEnter?: boolean;
}

interface DialogEmits {
  (e: "update:modelValue", value: boolean): void;
  (e: "submit" | "cancel" | "confirm" | "delete" | "close"): void;
}

const { $globals } = useNuxtApp();

const props = withDefaults(defineProps<DialogProps>(), {
  color: "primary",
  title: "Modal Title",
  icon: null,
  width: "500",
  maxWidth: null,
  loading: false,
  top: null,
  keepOpen: false,
  submitIcon: null,
  submitText: () => useNuxtApp().$i18n.t("general.create"),
  submitDisabled: false,
  cancelText: () => useNuxtApp().$i18n.t("general.cancel"),
  canDelete: false,
  canConfirm: false,
  canSubmit: false,
  disableSubmitOnEnter: false,
});

const emit = defineEmits<DialogEmits>();

// ── Fullscreen on mobile (Vuetify still available during transition) ───────
const display = useDisplay();
const isFullscreen = computed(() => display.xs.value);

// ── Dialog state ───────────────────────────────────────────────────────────
const dialog = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
});

function openDialog() {
  dialog.value = true;
}

function cancelDialog() {
  dialog.value = false;
  emit("cancel");
}

function handleBackdropClose() {
  emit("cancel");
  dialog.value = false;
}

watch(dialog, (val) => {
  if (val) submitted.value = false;
  if (!val) emit("close");
});

// ── Submit / confirm ───────────────────────────────────────────────────────
const submitted = ref(false);

const determineClose = computed(() => submitted.value && !props.loading && !props.keepOpen);

watch(determineClose, (shouldClose) => {
  if (shouldClose) {
    submitted.value = false;
    dialog.value = false;
  }
});

function submitEvent() {
  emit("submit");
  submitted.value = true;
}

function confirmDialog() {
  emit("confirm");
  dialog.value = false;
}

function deleteEvent() {
  emit("delete");
  submitted.value = true;
}

function submitOnEnter() {
  if (props.disableSubmitOnEnter) return;
  if (props.canConfirm) {
    if (!props.submitDisabled) confirmDialog();
    return;
  }
  submitEvent();
}

// ── Color → CSS custom property ────────────────────────────────────────────
const colorMap: Record<string, string> = {
  primary: "var(--bs-primary)",
  accent:  "var(--bs-accent)",
  success: "var(--bs-success)",
  info:    "var(--bs-info)",
  warning: "var(--bs-warning)",
  error:   "var(--bs-error)",
};

const headerBgColor = computed(() => colorMap[props.color] ?? props.color);

const panelStyle = computed(() => {
  const w = props.maxWidth ?? props.width;
  return { width: "100%", maxWidth: typeof w === "number" ? `${w}px` : w };
});

// ── Backward compat: open() method ────────────────────────────────────────
function open() {
  dialog.value = true;
  console.warn("[BaseDialog] The method 'open' is deprecated. Use v-model instead.");
}

defineExpose({ open });
</script>

<style>
@keyframes progress {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>
