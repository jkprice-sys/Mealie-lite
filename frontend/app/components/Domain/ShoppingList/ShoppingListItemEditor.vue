<template>
  <div class="rounded-lg border border-border bg-surface">
    <div class="p-3 space-y-3">
      <!-- Row 1: Quantity + Unit + Food -->
      <div class="flex flex-wrap items-end gap-3">
        <!-- Quantity -->
        <div class="w-24 shrink-0">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('form.quantity-label-abbreviated') }}</label>
          <input
            :value="listItem.quantity"
            type="number"
            min="0"
            step="any"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            @input="listItem.quantity = parseFloat(($event.target as HTMLInputElement).value) || 0"
          />
        </div>

        <!-- Unit -->
        <div class="flex-1 min-w-[120px]">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.unit') }}</label>
          <InputLabelType
            v-model="listItem.unit"
            v-model:item-id="listItem.unitId!"
            :items="units"
            :icon="$globals.icons.units"
            create
            @create="createAssignUnit"
          />
        </div>

        <!-- Food -->
        <div class="flex-1 min-w-[120px]">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('shopping-list.food') }}</label>
          <InputLabelType
            v-model="listItem.food"
            v-model:item-id="listItem.foodId!"
            :items="foods"
            :icon="$globals.icons.foods"
            :autofocus="autoFocus === 'food'"
            create
            @create="createAssignFood"
          />
        </div>
      </div>

      <!-- Row 2: Note -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('shopping-list.note') }}</label>
        <textarea
          v-model="listItem.note"
          :autofocus="autoFocus === 'note'"
          rows="1"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
          style="field-sizing: content; min-height: 2.5rem;"
          @keypress="handleNoteKeyPress"
        />
      </div>

      <!-- Row 3: Label + Save-label button -->
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[160px] max-w-[300px]">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('shopping-list.label') }}</label>
          <InputLabelType
            v-model="listItem.label"
            v-model:item-id="listItem.labelId!"
            :items="labels"
          />
        </div>
        <BaseButton
          v-if="listItem.labelId && listItem.food && listItem.labelId !== listItem.food.labelId"
          small
          :icon="$globals.icons.tagArrowRight"
          :text="$t('shopping-list.save-label')"
          @click="assignLabelToFood"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-1 px-3 pb-2">
      <BaseButtonGroup
        :buttons="[
          ...(allowDelete
            ? [{ icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' }]
            : []),
          { icon: $globals.icons.close, text: $t('general.cancel'), event: 'cancel' },
          { icon: $globals.icons.save,  text: $t('general.save'),   event: 'save'   },
        ]"
        @save="$emit('save')"
        @cancel="$emit('cancel')"
        @delete="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import InputLabelType from "~/components/global/InputLabelType.vue";
import type { ShoppingListItemCreate, ShoppingListItemOut } from "~/lib/api/types/household";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "~/lib/api/types/recipe";
import { useFoodStore, useFoodData, useUnitStore, useUnitData } from "~/composables/store";

const listItem = defineModel<ShoppingListItemCreate | ShoppingListItemOut>({ required: true });

defineProps({
  labels:      { type: Array as () => MultiPurposeLabelOut[], required: true },
  units:       { type: Array as () => IngredientUnit[], required: true },
  foods:       { type: Array as () => IngredientFood[], required: true },
  allowDelete: { type: Boolean, default: true },
});

const emit = defineEmits<{
  (e: "save", item: ShoppingListItemOut): void;
  (e: "cancel" | "delete"): void;
}>();

const { $globals } = useNuxtApp();

const foodStore = useFoodStore();
const foodData  = useFoodData();
const unitStore = useUnitStore();
const unitData  = useUnitData();

watch(() => listItem.value.quantity, (newQty) => {
  if (!newQty) listItem.value.quantity = 0;
});

watch(() => listItem.value.food, (newFood) => {
  listItem.value.label   = newFood?.label || null;
  listItem.value.labelId = listItem.value.label?.id || null;
});

const autoFocus = computed(() => (!listItem.value.food && listItem.value.note ? "note" : "food"));

async function createAssignFood(val: string) {
  listItem.value.food
    ? (listItem.value.food.name = val)
    : (listItem.value.food = { name: val } as any);

  foodData.data.name = val;
  const newFood = await foodStore.actions.createOne(foodData.data);
  if (newFood) {
    listItem.value.food   = newFood;
    listItem.value.foodId = newFood.id;
  }
  foodData.reset();
}

async function createAssignUnit(val: string) {
  listItem.value.unit
    ? (listItem.value.unit.name = val)
    : (listItem.value.unit = { name: val } as any);

  unitData.data.name = val;
  const newUnit = await unitStore.actions.createOne(unitData.data);
  if (newUnit) {
    listItem.value.unit   = newUnit;
    listItem.value.unitId = newUnit.id;
  }
  unitData.reset();
}

async function assignLabelToFood() {
  if (!(listItem.value.food && listItem.value.foodId && listItem.value.labelId)) return;
  listItem.value.food.labelId = listItem.value.labelId;
  await foodStore.actions.updateOne(listItem.value.food);
}

function handleNoteKeyPress(event: KeyboardEvent) {
  if (!event.shiftKey && event.key === "Enter") {
    event.preventDefault();
    emit("save");
  }
}
</script>
