<template>
  <div>
    <div>
      <VueDraggable
        v-model="fields"
        handle=".handle"
        :delay="250"
        :delay-on-touch-only="true"
        v-bind="{
          animation: 200,
          group: 'recipe-instructions',
          ghostClass: 'ghost',
        }"
        @start="drag = true"
        @end="onDragEnd"
      >
        <div
          v-for="(field, index) in fields"
          :key="field.id"
          class="flex flex-wrap items-end gap-2 pb-2"
        >
          <!-- drag handle -->
          <div class="flex items-center flex-shrink-0">
            <AppIcon
              :path="$globals.icons.arrowUpDown"
              class="handle cursor-move text-on-surface/40 hover:text-on-surface transition-colors"
              size="md"
            />
          </div>

          <!-- and / or (not for first row) -->
          <div v-if="index !== 0" class="w-16 flex-shrink-0">
            <select
              :value="field.logicalOperator?.value"
              class="w-full rounded border border-border bg-surface px-1 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              @change="setLogicalOperatorValue(field, index, ($event.target as HTMLSelectElement).value as LogicalOperator)"
            >
              <option :value="logOps.AND.value">{{ logOps.AND.label }}</option>
              <option :value="logOps.OR.value">{{ logOps.OR.label }}</option>
            </select>
          </div>
          <div v-else class="w-16 flex-shrink-0" />

          <!-- left parenthesis (advanced) -->
          <div v-if="showAdvanced" class="w-14 flex-shrink-0">
            <select
              :value="field.leftParenthesis"
              class="w-full rounded border border-border bg-surface px-1 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary text-center"
              @change="setLeftParenthesisValue(field, index, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">-</option>
              <option value="(">(</option>
              <option value="((">(( </option>
              <option value="(((">(((</option>
            </select>
          </div>

          <!-- field name -->
          <div class="flex-1 min-w-[120px]">
            <select
              :value="field.label"
              class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary text-center"
              @change="setField(index, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="def in fieldDefs" :key="def.label" :value="def.label">
                {{ def.label }}
              </option>
            </select>
          </div>

          <!-- relational operator -->
          <div v-if="field.type !== 'boolean'" class="w-24 flex-shrink-0">
            <select
              :value="field.relationalOperatorValue?.value"
              class="w-full rounded border border-border bg-surface px-1 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary text-center"
              @change="setRelationalOperatorValue(field, index, ($event.target as HTMLSelectElement).value as RelationalKeyword | RelationalOperator)"
            >
              <option
                v-for="op in field.relationalOperatorChoices"
                :key="op.value"
                :value="op.value"
              >{{ op.label }}</option>
            </select>
          </div>

          <!-- field value -->
          <div class="flex-1 min-w-[120px]">
            <!-- choices multi-select -->
            <select
              v-if="field.fieldChoices"
              :value="undefined"
              multiple
              class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              @change="setFieldValuesFromEvent(field, index, $event)"
            >
              <option
                v-for="choice in field.fieldChoices"
                :key="choice.value"
                :value="choice.value"
                :selected="(field.values || []).includes(choice.value)"
              >{{ choice.label }}</option>
            </select>

            <!-- string input -->
            <input
              v-else-if="field.type === 'string'"
              :value="field.value"
              type="text"
              class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              @input="setFieldValue(field, index, ($event.target as HTMLInputElement).value)"
            />

            <!-- number input -->
            <input
              v-else-if="field.type === 'number'"
              :value="field.value"
              type="number"
              class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              @input="setFieldValue(field, index, Number(($event.target as HTMLInputElement).value))"
            />

            <!-- boolean checkbox -->
            <label v-else-if="field.type === 'boolean'" class="flex items-center gap-1.5 cursor-pointer py-1">
              <input
                type="checkbox"
                :checked="!!field.value"
                class="accent-primary"
                @change="setFieldValue(field, index, ($event.target as HTMLInputElement).checked)"
              />
              <span class="text-xs text-on-surface">{{ field.label }}</span>
            </label>

            <!-- date picker -->
            <input
              v-else-if="field.type === 'date'"
              :value="toDateInputValue(field.value as string)"
              type="date"
              class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              @change="setFieldValue(field, index, ($event.target as HTMLInputElement).value)"
            />

            <!-- relative date (days ago) -->
            <div v-else-if="field.type === 'relativeDate'" class="flex items-center gap-1">
              <input
                :value="parseRelativeDateOffset(field.value as string)"
                type="number"
                min="0"
                step="1"
                class="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                @input="setFieldValue(field, index, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-on-surface/60">
                {{ $t('query-filter.dates.days-ago', parseRelativeDateOffset(field.value as string)) }}
              </span>
            </div>

            <!-- organizer selectors -->
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.Category"
              v-model="field.organizers"
              :selector-type="Organizer.Category"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.Tag"
              v-model="field.organizers"
              :selector-type="Organizer.Tag"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.Tool"
              v-model="field.organizers"
              :selector-type="Organizer.Tool"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.Food"
              v-model="field.organizers"
              :selector-type="Organizer.Food"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.Household"
              v-model="field.organizers"
              :selector-type="Organizer.Household"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
            <RecipeOrganizerSelector
              v-else-if="field.type === Organizer.User"
              v-model="field.organizers"
              :selector-type="Organizer.User"
              :show-add="false"
              :show-label="false"
              :show-icon="false"
              @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
            />
          </div>

          <!-- right parenthesis (advanced) -->
          <div v-if="showAdvanced" class="w-14 flex-shrink-0">
            <select
              :value="field.rightParenthesis"
              class="w-full rounded border border-border bg-surface px-1 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary text-center"
              @change="setRightParenthesisValue(field, index, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">-</option>
              <option value=")">)</option>
              <option value="))">))</option>
              <option value=")))">)))</option>
            </select>
          </div>

          <!-- delete action -->
          <div class="flex-shrink-0">
            <button
              type="button"
              :disabled="fields.length === 1"
              class="p-1 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              :title="$t('general.delete')"
              @click="removeField(index)"
            >
              <AppIcon :path="$globals.icons.delete" size="sm" />
            </button>
          </div>
        </div>
      </VueDraggable>
    </div>

    <!-- Actions bar -->
    <div class="flex items-center justify-end gap-3 mt-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="showAdvanced" type="checkbox" class="accent-primary" />
        <span class="text-sm text-on-surface">{{ $t('general.show-advanced') }}</span>
      </label>
      <BaseButton
        create
        :text="$t('general.add-field')"
        @click="addField(fieldDefs[0])"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { useDebounceFn } from "@vueuse/core";
import { useHouseholdSelf } from "~/composables/use-households";
import RecipeOrganizerSelector from "~/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import { Organizer } from "~/lib/api/types/non-generated";
import type {
  LogicalOperator,
  QueryFilterJSON,
  QueryFilterJSONPart,
  RelationalKeyword,
  RelationalOperator,
} from "~/lib/api/types/non-generated";
import { useCategoryStore, useFoodStore, useHouseholdStore, useTagStore, useToolStore } from "~/composables/store";
import { useUserStore } from "~/composables/store/use-user-store";
import { type Field, type FieldDefinition, type FieldValue, type OrganizerBase, useQueryFilterBuilder } from "~/composables/use-query-filter-builder";

const props = defineProps({
  fieldDefs: {
    type: Array as () => FieldDefinition[],
    required: true,
  },
  initialQueryFilter: {
    type: Object as () => QueryFilterJSON | null,
    default: null,
  },
});

const emit = defineEmits<{
  (event: "input", value: string | undefined): void;
  (event: "inputJSON", value: QueryFilterJSON | undefined): void;
}>();

const { $globals } = useNuxtApp();
const { household } = useHouseholdSelf();
const {
  logOps,
  placeholderKeywords,
  getRelOps,
  buildQueryFilterString,
  getFieldFromFieldDef,
  isOrganizerType,
} = useQueryFilterBuilder();

const firstDayOfWeek = computed(() => {
  return household.value?.preferences?.firstDayOfWeek || 0;
});

const state = reactive({
  showAdvanced: false,
  qfValid: false,
  datePickers: [] as boolean[],
  drag: false,
});
const { showAdvanced, datePickers, drag } = toRefs(state);

const storeMap = {
  [Organizer.Category]: useCategoryStore(),
  [Organizer.Tag]: useTagStore(),
  [Organizer.Tool]: useToolStore(),
  [Organizer.Food]: useFoodStore(),
  [Organizer.Household]: useHouseholdStore(),
  [Organizer.User]: useUserStore(),
};

function onDragEnd(event: any) {
  state.drag = false;

  const oldIndex: number = event.oldIndex;
  const newIndex: number = event.newIndex;
  state.datePickers[oldIndex] = false;
  state.datePickers[newIndex] = false;
}

type FieldWithId = Field & { id: number };
const fields = ref<FieldWithId[]>([]);

const uid = ref(1);
function useUid() {
  return uid.value++;
}

function addField(field: FieldDefinition) {
  fields.value.push({
    ...getFieldFromFieldDef(field),
    id: useUid(),
  });
  state.datePickers.push(false);
}

function setField(index: number, fieldLabel: string) {
  state.datePickers[index] = false;
  const fieldDef = props.fieldDefs.find(fieldDef => fieldDef.label === fieldLabel);
  if (!fieldDef) return;

  const resetValue = (fieldDef.type !== fields.value[index].type) || (fieldDef.fieldChoices !== fields.value[index].fieldChoices);
  const updatedField = { ...fields.value[index], ...fieldDef };
  updatedField.fieldChoices = fieldDef.fieldChoices;

  fields.value[index] = {
    ...getFieldFromFieldDef(updatedField, resetValue),
    id: fields.value[index].id,
  };

  switch (fields.value[index].type) {
    case "date":
      fields.value[index].value = safeNewDate("");
      break;
    case "relativeDate":
      fields.value[index].value = "$NOW-30d";
      break;
    default:
      break;
  }
}

function setLeftParenthesisValue(field: FieldWithId, index: number, value: string) {
  fields.value[index].leftParenthesis = value;
}

function setRightParenthesisValue(field: FieldWithId, index: number, value: string) {
  fields.value[index].rightParenthesis = value;
}

function setLogicalOperatorValue(field: FieldWithId, index: number, value: LogicalOperator | undefined) {
  if (!value) value = logOps.value.AND.value;
  fields.value[index].logicalOperator = value ? logOps.value[value] : undefined;
}

function setRelationalOperatorValue(field: FieldWithId, index: number, value: RelationalKeyword | RelationalOperator) {
  const relOps = getRelOps(field.type);
  fields.value[index].relationalOperatorValue = relOps.value[value];
}

function setFieldValue(field: FieldWithId, index: number, value: FieldValue) {
  state.datePickers[index] = false;

  if (field.type === "relativeDate") {
    fields.value[index].value = `$NOW-${Math.abs(value as number)}d`;
  }
  else {
    fields.value[index].value = value;
  }
}

function setFieldValues(field: FieldWithId, index: number, values: FieldValue[]) {
  fields.value[index].values = values;
}

function setFieldValuesFromEvent(field: FieldWithId, index: number, event: Event) {
  const select = event.target as HTMLSelectElement;
  const values = Array.from(select.selectedOptions).map(o => o.value);
  setFieldValues(field, index, values);
}

function setFieldOrganizers(field: FieldWithId, index: number, organizers: OrganizerBase[]) {
  fields.value[index].organizers = organizers;
  fields.value[index].values = organizers.map(org => org.id?.toString() || "").filter(id => id);
}

function removeField(index: number) {
  fields.value.splice(index, 1);
  state.datePickers.splice(index, 1);
}

const fieldsUpdater = useDebounceFn(() => {
  const qf = buildQueryFilterString(fields.value, state.showAdvanced);
  if (qf) {
    console.debug(`Set query filter: ${qf}`);
  }
  state.qfValid = !!qf;

  emit("input", qf || undefined);
  emit("inputJSON", qf ? buildQueryFilterJSON() : undefined);
}, 500);

watch(fields, fieldsUpdater, { deep: true });

async function hydrateOrganizers(field: FieldWithId, _index: number) {
  if (!field.values?.length || !isOrganizerType(field.type)) return;

  const { store, actions } = storeMap[field.type];
  if (!store.value.length) {
    await actions.refresh();
  }

  const organizers = field.values.map((value) => {
    const organizer = store.value.find(item => item?.id?.toString() === value);
    if (!organizer) {
      console.error(`Could not find organizer with id ${value}`);
      return undefined;
    }
    return organizer;
  });

  field.organizers = organizers.filter(organizer => organizer !== undefined) as OrganizerBase[];
  return field;
}

function initFieldsError(error = "") {
  if (error) console.error(error);
  fields.value = [];
  if (props.fieldDefs.length) {
    addField(props.fieldDefs[0]);
  }
}

async function initializeFields() {
  if (!props.initialQueryFilter?.parts?.length) {
    return initFieldsError();
  }

  const initFields: FieldWithId[] = [];
  let error = false;

  for (const [index, part] of props.initialQueryFilter.parts.entries()) {
    const fieldDef = props.fieldDefs.find(fieldDef => fieldDef.name === part.attributeName);
    if (!fieldDef) {
      error = true;
      return initFieldsError(`Invalid query filter; unknown attribute name "${part.attributeName || ""}"`);
    }

    const field: FieldWithId = {
      ...getFieldFromFieldDef(fieldDef),
      id: useUid(),
    };

    const relOps = getRelOps(field.type);

    field.leftParenthesis = part.leftParenthesis || field.leftParenthesis;
    field.rightParenthesis = part.rightParenthesis || field.rightParenthesis;
    field.logicalOperator = part.logicalOperator ? logOps.value[part.logicalOperator] : field.logicalOperator;
    field.relationalOperatorValue = part.relationalOperator ? relOps.value[part.relationalOperator] : field.relationalOperatorValue;

    if (field.leftParenthesis || field.rightParenthesis) {
      state.showAdvanced = true;
    }

    if (field.fieldChoices?.length || isOrganizerType(field.type)) {
      if (typeof part.value === "string") {
        field.values = part.value ? [part.value] : [];
      }
      else {
        field.values = part.value || [];
      }

      if (isOrganizerType(field.type)) {
        await hydrateOrganizers(field, index);
      }
    }
    else if (field.type === "boolean") {
      const boolString = part.value || "false";
      field.value = (
        boolString[0].toLowerCase() === "t"
        || boolString[0].toLowerCase() === "y"
        || boolString[0] === "1"
      );
    }
    else if (field.type === "number") {
      field.value = Number(part.value as string || "0");
      if (isNaN(field.value)) {
        error = true;
        return initFieldsError(`Invalid query filter; invalid number value "${(part.value || "").toString()}"`);
      }
    }
    else if (field.type === "date") {
      field.value = part.value as string || "";
      const date = new Date(field.value);
      if (isNaN(date.getTime())) {
        error = true;
        return initFieldsError(`Invalid query filter; invalid date value "${(part.value || "").toString()}"`);
      }
    }
    else {
      field.value = part.value as string || "";
    }

    initFields.push(field);
  }

  if (initFields.length && !error) {
    fields.value = initFields;
  }
  else {
    initFieldsError();
  }
}

onMounted(async () => {
  try {
    await initializeFields();
  }
  catch (error) {
    initFieldsError(`Error initializing fields: ${(error || "").toString()}`);
  }
});

function buildQueryFilterJSON(): QueryFilterJSON {
  const parts = fields.value.map((field) => {
    const part: QueryFilterJSONPart = {
      attributeName: field.name,
      leftParenthesis: field.leftParenthesis,
      rightParenthesis: field.rightParenthesis,
      logicalOperator: field.logicalOperator?.value,
      relationalOperator: field.relationalOperatorValue?.value,
    };

    if (field.fieldChoices?.length || isOrganizerType(field.type)) {
      part.value = field.values.map(value => value.toString());
    }
    else if (field.type === "boolean") {
      part.value = field.value ? "true" : "false";
    }
    else {
      part.value = (field.value || "").toString();
    }

    return part;
  });

  const qfJSON = { parts } as QueryFilterJSON;
  console.debug(`Built query filter JSON: ${JSON.stringify(qfJSON)}`);
  return qfJSON;
}

function safeNewDate(input: string): Date {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return date;
}

function toDateInputValue(value: string): string {
  if (!value) return "";
  const date = safeNewDate(value + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseRelativeDateOffset(value: string): number {
  const defaultVal = 30;
  if (!value) return defaultVal;

  try {
    if (!value.startsWith(placeholderKeywords.value["$NOW"].value)) {
      return defaultVal;
    }
    const remainder = value.slice(placeholderKeywords.value["$NOW"].value.length);
    if (!remainder.startsWith("-")) throw new Error("Invalid operator");
    if (remainder.slice(-1) !== "d") throw new Error("Invalid unit");
    return parseInt(remainder.slice(1, -1));
  }
  catch (error) {
    console.warn(`Unable to parse relative date offset from '${value}': ${error}`);
    return defaultVal;
  }
}

// suppress unused refs from toRefs
void datePickers;
void drag;
void firstDayOfWeek;
</script>
