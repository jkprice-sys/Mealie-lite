<template>
  <div class="rounded-xl border border-border bg-surface shadow-md pt-2">
    <div class="px-4 pb-2">
      <!-- Controls row -->
      <div class="flex items-center gap-2 mb-3">
        <!-- Delete -->
        <button
          type="button"
          :disabled="submitted"
          class="w-9 h-9 rounded-lg flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-40"
          @click="$emit('delete')"
        >
          <AppIcon :path="$globals.icons.delete" size="sm" />
        </button>

        <div class="flex-1" />

        <!-- Save -->
        <button
          v-if="changed > 0"
          type="button"
          :disabled="submitted"
          class="w-9 h-9 rounded-lg flex items-center justify-center bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-40"
          @click="save"
        >
          <AppIcon :path="$globals.icons.save" size="sm" />
        </button>

        <!-- Edit menu -->
        <Menu as="div" class="relative inline-block">
          <MenuButton
            :disabled="submitted"
            class="w-9 h-9 rounded-lg flex items-center justify-center bg-info/10 text-info hover:bg-info/20 transition-colors disabled:opacity-40"
          >
            <AppIcon :path="$globals.icons.edit" size="sm" />
          </MenuButton>
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-border bg-surface shadow-lg focus:outline-none">
              <div class="py-1">
                <template v-for="(row, keyRow) in controls" :key="keyRow">
                  <MenuItem
                    v-for="(control, keyControl) in row"
                    :key="keyControl"
                    v-slot="{ active }"
                  >
                    <button
                      type="button"
                      :disabled="submitted"
                      class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                      :class="active ? 'bg-primary/10 text-primary' : 'text-on-surface'"
                      @click="control.callback()"
                    >
                      <AppIcon :path="control.icon" size="sm" class="text-info" />
                    </button>
                  </MenuItem>
                </template>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>

      <!-- Cropper -->
      <Cropper
        ref="cropper"
        class="cropper"
        :src="img"
        :default-size="defaultSize"
        :style="`height: ${cropperHeight}; width: ${cropperWidth};`"
        @change="changed = changed + 1"
        @ready="changed = -1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

defineProps({
  img: {
    type: String,
    required: true,
  },
  cropperHeight: {
    type: String,
    default: undefined,
  },
  cropperWidth: {
    type: String,
    default: undefined,
  },
  submitted: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "save", item: Blob): void;
  (e: "delete"): void;
}>();

const cropper = ref<any>(null);
const changed = ref(0);
const { $globals } = useNuxtApp();

type Control = {
  color: string;
  icon: string;
  callback: CallableFunction;
};

function flip(hortizontal: boolean, vertical?: boolean) {
  if (!cropper.value) return;
  cropper.value.flip(hortizontal, vertical);
  changed.value = changed.value + 1;
}

function rotate(angle: number) {
  if (!cropper.value) return;
  cropper.value.rotate(angle);
  changed.value = changed.value + 1;
}

const controls = ref<Control[][]>([
  [
    {
      color: "info",
      icon: $globals.icons.flipHorizontal,
      callback: () => flip(true, false),
    },
    {
      color: "info",
      icon: $globals.icons.flipVertical,
      callback: () => flip(false, true),
    },
  ],
  [
    {
      color: "info",
      icon: $globals.icons.rotateLeft,
      callback: () => rotate(-90),
    },
    {
      color: "info",
      icon: $globals.icons.rotateRight,
      callback: () => rotate(90),
    },
  ],
]);

function save() {
  if (!cropper.value) return;
  const { canvas } = cropper.value.getResult();
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) {
      emit("save", blob);
    }
  });
}

function defaultSize({ imageSize, visibleArea }: any) {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height,
  };
}
</script>
