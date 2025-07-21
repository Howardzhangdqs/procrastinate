<template>
  <v-card class="mb-3">
    <v-card-title>
      {{ index }}. {{ title }}
    </v-card-title>
    <v-card-text>
      <!-- 任务描述 -->
      <div>
        {{ description }}
      </div>

      <!-- 任务评价 -->
      <div v-if="praise">
        {{ praise }}
      </div>

      <!-- 任务状态 -->
      <div class="d-flex justify-end mt-2" style="align-items: center; margin-bottom: -5px;">
        <!-- TODO 继续写-->
        <div v-if="index <= taskFinishedIndex + 1">{{ finished ? `已完成，用时 ${timePassed}` : `已用时 ${timePassed}` }}</div>
        <v-spacer></v-spacer>
        <v-btn class="mr-3" :variant="skipped ? 'flat' : 'tonal'" color="primary" @click="skipTask"
          :disabled="finished">
          {{ skipped ? "已跳过" : "跳过" }}
        </v-btn>
        <v-btn :id="`noprocrastinate-task-finished-${index}`" :variant="finished ? 'flat' : 'tonal'" color="green"
          @click="finishTask" :disabled="skipped">
          {{ finished ? "已完成" : "完成" }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import taskFinishedTime from "../store/task_finished_time";
import taskFinishedIndex from "../store/task_finished_index";
import taskFinishedStatus from "../store/task_finished_status";
import * as party from "party-js";

const props = defineProps<{
  title: string;
  description: string;
  index: number;
  praise?: string;
}>();

const emit = defineEmits(["skip", "finish"]);

const skipped = ref<boolean>(false);
const finished = ref<boolean>(false);

const skipTask = () => {
  if (skipped.value) return;

  skipped.value = true;
  finished.value = false;

  taskFinishedTime.value[props.index] = new Date();

  console.log(`Task ${props.index} skipped: ${props.title}`);

  // Emit the skip event to parent component
  emit("skip", props.index);

  scrollToNextTask();
};

const finishTask = () => {
  if (finished.value) return;

  triggerPartyEffects("#noprocrastinate-task-finished-" + props.index);

  finished.value = true;
  skipped.value = false;

  taskFinishedTime.value[props.index] = new Date();
  taskFinishedIndex.value = props.index;

  console.log(`Task ${props.index} finished: ${props.title}`);

  taskFinishedStatus.value[props.index - 1] = true;

  emit("finish", props.index);

  scrollToNextTask();
};

const scrollToNextTask = () => {
  const taskElement = document.getElementById(`noprocrastinate-task-${props.index + 1}`);
  if (taskElement) {
    taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const triggerPartyEffects = (css_selector: string = ".celebration-dialog") => {
  const celebrationElement = document.querySelector(css_selector) as HTMLElement;
  if (celebrationElement) {
    party.confetti(celebrationElement);
    party.sparkles(celebrationElement);
  }
};

const timePassed = ref<string>("0秒");
import { onMounted, onUnmounted } from "vue";

let intervalId: number | undefined;

const updateTimePassed = () => {
  if (taskFinishedIndex.value !== props.index - 1) return;
  if (finished.value || skipped.value) return;

  const startTime = taskFinishedTime.value[taskFinishedIndex.value] || taskFinishedTime.value[0];
  if (!startTime) return;

  const now = new Date();

  const timePassedNumber = +now - +startTime + 1000;
  const seconds = Math.floor(timePassedNumber / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const ans = [];

  if (hours > 0) ans.push(`${hours}小时`);
  if (minutes > 0) ans.push(`${minutes % 60}分钟`);
  if (seconds > 0) ans.push(`${seconds % 60}秒`);
  timePassed.value = `${ans.join(" ") || "0秒"}`;
};

onMounted(() => {
  intervalId = window.setInterval(updateTimePassed, 1000);
  updateTimePassed();
});

onUnmounted(() => {
  if (intervalId !== undefined) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped></style>
