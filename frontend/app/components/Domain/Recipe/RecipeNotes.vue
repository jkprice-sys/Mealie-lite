<template>
  <div v-if="model.length > 0 || edit" class="mt-8">
    <h2 class="my-4 text-xl font-medium opacity-80">
      {{ $t("recipe.note") }}
    </h2>

    <div
      v-for="(note, index) in model"
      :id="'note' + index"
      :key="'note' + index"
      class="mt-2"
    >
      <!-- Edit mode -->
      <div v-if="edit" class="bs-card px-4 py-3 mb-2">
        <div class="flex items-center gap-2 mb-2">
          <input
            v-model="model[index]['title']"
            type="text"
            :placeholder="$t('recipe.title')"
            class="flex-1 border-b border-border bg-transparent text-sm text-on-surface
                   placeholder-gray-400 focus:outline-none focus:border-primary transition-colors py-1"
          />
          <button
            type="button"
            class="bs-btn bs-btn-sm bs-btn-ghost text-error shrink-0"
            @click="removeByIndex(index)"
          >
            <AppIcon :path="$globals.icons.delete" size="sm" />
          </button>
        </div>
        <textarea
          v-model="model[index]['text']"
          rows="3"
          :placeholder="$t('recipe.note')"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors
                 resize-y py-1"
        />
      </div>

      <!-- View mode -->
      <div v-else>
        <p v-if="note.title" class="text-base font-medium py-1 text-on-surface">
          {{ note.title }}
        </p>
        <div class="text-sm text-on-surface/80">
          <SafeMarkdown :source="note.text" />
        </div>
      </div>
    </div>

    <div v-if="edit" class="flex justify-end mt-2">
      <BaseButton @click="addNote">
        {{ $t("general.add") }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecipeNote } from "~/lib/api/types/recipe";

const { $globals } = useNuxtApp();

const model = defineModel<RecipeNote[]>({ default: () => [] });

defineProps({
  edit: { type: Boolean, default: true },
});

function addNote() {
  model.value = [...model.value, { title: "", text: "" }];
}

function removeByIndex(index: number) {
  const newNotes = [...model.value];
  newNotes.splice(index, 1);
  model.value = newNotes;
}
</script>
