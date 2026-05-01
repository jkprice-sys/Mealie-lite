<template>
  <div class="text-center">
    <BaseButton @click="dialog = true">
      {{ $t("new-recipe.bulk-add") }}
    </BaseButton>
    <BaseDialog
      v-model="dialog"
      width="800"
      :title="$t('new-recipe.bulk-add')"
      :icon="$globals.icons.createAlt"
      :submit-text="$t('general.add')"
      :disable-submit-on-enter="true"
      can-submit
      @submit="save"
    >
      <div class="px-4 py-3 space-y-3">
        <textarea
          v-model="inputText"
          rows="12"
          autofocus
          :placeholder="$t('new-recipe.paste-in-your-recipe-data-each-line-will-be-treated-as-an-item-in-a-list')"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
        />

        <hr class="border-border" />

        <!-- Utilities list -->
        <div class="divide-y divide-border rounded-lg border border-border overflow-hidden">
          <div
            v-for="util in utilities"
            :key="util.id"
            class="flex items-center gap-3 px-3 py-2.5"
          >
            <button
              type="button"
              :title="$t('general.run')"
              class="w-9 h-9 rounded-full bg-info/10 flex items-center justify-center text-info hover:bg-info/20 transition-colors shrink-0"
              @click="util.action"
            >
              <AppIcon :path="$globals.icons.play" size="sm" />
            </button>
            <span class="text-sm text-on-surface whitespace-pre-wrap">{{ util.description }}</span>
          </div>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
interface Props {
  inputTextProp?: string;
}
const props = withDefaults(defineProps<Props>(), {
  inputTextProp: "",
});

const emit = defineEmits<{
  "bulk-data": [data: string[]];
}>();

const { $globals } = useNuxtApp();
const dialog = ref(false);
const inputText = ref(props.inputTextProp);

function splitText() {
  return inputText.value.split("\n").filter(line => !(line === "\n" || !line));
}

function removeFirstCharacter() {
  inputText.value = splitText()
    .map(line => line.substring(1))
    .join("\n");
}

const numberedLineRegex = /\d+[.):] /gm;

function splitByNumberedLine() {
  // Split inputText by numberedLineRegex
  const matches = inputText.value.match(numberedLineRegex);

  matches?.forEach((match, idx) => {
    const replaceText = idx === 0 ? "" : "\n";
    inputText.value = inputText.value.replace(match, replaceText);
  });
}

function trimAllLines() {
  const splitLines = splitText();

  splitLines.forEach((element: string, index: number) => {
    splitLines[index] = element.trim();
  });

  inputText.value = splitLines.join("\n");
}

function save() {
  emit("bulk-data", splitText());
  dialog.value = false;
}

function open() {
  dialog.value = true;
}
function close() {
  dialog.value = false;
}

const i18n = useI18n();

const utilities = [
  {
    id: "trim-whitespace",
    description: i18n.t("new-recipe.trim-whitespace-description"),
    action: trimAllLines,
  },
  {
    id: "trim-prefix",
    description: i18n.t("new-recipe.trim-prefix-description"),
    action: removeFirstCharacter,
  },
  {
    id: "split-by-numbered-line",
    description: i18n.t("new-recipe.split-by-numbered-line-description"),
    action: splitByNumberedLine,
  },
];

// Expose functions to parent components
defineExpose({
  open,
  close,
});
</script>
