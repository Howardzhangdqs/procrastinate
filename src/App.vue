<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import * as party from "party-js";
import task_splitting from "./services/task_splitting";
import { ErrorCode, type TaskSteps } from "./services/task_interface";
import { Icon } from "@iconify/vue";
import { base_url, api_key, model, providers, selected_provider_name, selected_provider } from "./store/llm";
import SettingDialog from "./components/SettingDialog.vue";
import Task from "./components/Task.vue";
import taskFinishedTime from "./store/task_finished_time";
import taskFinishedIndex from "./store/task_finished_index";
import taskFinishedStatus from "./store/task_finished_status";

async function main(userInput: string) {
  return task_splitting(
    userInput,
    new URL("." + selected_provider.value.base_url, location.href).toString(),
    api_key.value,
    model.value
  );
};

const userInput = ref<string>("");
const userInputLoading = ref<boolean>(false);
const modelOutput = ref<string>("");
const steps = ref<TaskSteps>([]);
const showCelebration = ref<boolean>(false);
const completedTasks = ref<Set<number>>(new Set());

const handle_click = () => {
  userInputLoading.value = true;
  main(userInput.value).then((response) => {
    console.log("Response from main:", response);
    if (response.code !== ErrorCode.SUCCESS) {
      modelOutput.value = `Error: ${response.code}`;
      return;
    }

    // 将 response.steps 覆盖进 steps
    steps.value = response.steps;

    userInputLoading.value = false;

    taskFinishedTime.value = new Array(steps.value.length + 1).fill(undefined);
    taskFinishedTime.value[0] = new Date(); // 初始时间
    taskFinishedIndex.value = 0;

    taskFinishedStatus.value = new Array(steps.value.length).fill(false);

    // 重置已完成任务集合
    completedTasks.value.clear();
    showCelebration.value = false;

    modelOutput.value = JSON.stringify(response.steps, null, 2) || "No response received";
  }).catch((error) => {
    console.error("Error in handle_click:", error);
  });
};

const dialog = ref(false);

const handleTaskFinish = (taskIndex: number) => {
  completedTasks.value.add(taskIndex);

  console.log(`Task ${taskIndex} finished, current completed tasks:`, completedTasks.value);

  // 检查是否所有任务都已完成
  if (completedTasks.value.size === steps.value.length && steps.value.length > 0) {
    showCelebration.value = true;
  }
};

const handleTaskSkip = (taskIndex: number) => {
  completedTasks.value.add(taskIndex);

  console.log(`Task ${taskIndex} skipped, current completed tasks:`, completedTasks.value);

  // 检查是否所有任务都已完成（包括跳过的）
  if (completedTasks.value.size === steps.value.length && steps.value.length > 0) {
    showCelebration.value = true;
  }
};

const closeCelebration = () => {
  showCelebration.value = false;
  steps.value = [];
  completedTasks.value.clear();

  taskFinishedIndex.value = 0;
  taskFinishedTime.value = new Array(steps.value.length + 1).fill(undefined);
  taskFinishedTime.value[0] = new Date();
};

// Watch for celebration dialog to trigger Party.js effects
watch(showCelebration, (newValue) => {
  if (newValue) {
    setTimeout(triggerPartyEffects, 100);
  }
});

const triggerPartyEffects = (css_selector: string = ".celebration-dialog") => {
  const celebrationElement = document.querySelector(css_selector) as HTMLElement;
  if (celebrationElement) {
    party.confetti(celebrationElement);
    party.sparkles(celebrationElement);
  }
};

// 计算总用时
const totalTimeUsed = computed(() => {
  if (taskFinishedTime.value.length < 2) return "";

  const startTime = taskFinishedTime.value[0];
  const lastTaskTime = taskFinishedTime.value[taskFinishedTime.value.length - 1];

  if (!startTime || !lastTaskTime) return "";

  const totalMs = +lastTaskTime - +startTime;
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟${totalSeconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${totalSeconds % 60}秒`;
  } else {
    return `${totalSeconds}秒`;
  }
});

</script>

<template>
  <v-app>
    <v-container>

      <!-- 任务输入 -->
      <div class="mb-3">
        <p>
          简单描述一下你所要进行的任务描述，可以适当的详细些，最好说说你目前所处的情况，比如“我在床上，我想起床写作业”。
        </p>
      </div>
      <v-text-field :loading="userInputLoading" variant="underlined" v-model="userInput" placeholder="我在床上，我想起床写作业"
        label="任务描述" append-icon="mdi-send" @click:append="handle_click">
      </v-text-field>
      <v-btn icon style="margin: 10px; position: fixed; left: 6px; bottom: 6px; z-index: 100;" @click="dialog = true">
        <v-icon>
          <Icon density="compact" icon="uil:setting" />
        </v-icon>
      </v-btn>

      <!-- 任务分解 -->
      <template v-for="(step, index) in steps" :key="index">
        <Task :title="step.step" :description="step.description" :index="index + 1" @finish="handleTaskFinish"
          @skip="handleTaskSkip" :id="`noprocrastinate-task-${index + 1}`" />
      </template>

      <!-- 庆祝弹窗 -->
      <v-dialog v-model="showCelebration" persistent max-width="500">
        <v-card class="celebration-dialog" @click="triggerPartyEffects" @vue:mounted="triggerPartyEffects()">
          <v-card-text class="text-center pa-6">
            <h2 class="text-h5 font-weight-bold success--text mb-4">🎉 恭喜完成所有任务 🎉</h2>
            <div class="celebration-content">
              <div class="celebration-icon mb-4">
                <v-icon size="80" color="success">mdi-trophy</v-icon>
              </div>
              <p class="mb-2">太棒了！你成功完成了所有任务！</p>
              <p class="mb-2">
                总共完成了 <strong class="primary--text">{{ taskFinishedStatus.filter(Boolean).length }}</strong> 个任务
                <span v-if="totalTimeUsed">，用时 <strong class="primary--text">{{ totalTimeUsed }}</strong></span>
              </p>
              <p>继续保持这种效率，你一定能够实现更大的目标！</p>
            </div>
          </v-card-text>
          <v-card-actions class="justify-center pa-4" style="margin-top: -25px;">
            <v-btn color="success" @click="closeCelebration" large elevation="2">
              🎉 继续加油 🎉
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 模型设置 -->
      <SettingDialog v-model="dialog" v-model:selected-provider="selected_provider" v-model:api-key="api_key"
        v-model:model="model" v-model:selected-provider-name="selected_provider_name" :providers="providers" />

      <div style="height: 50px;"></div>
    </v-container>
  </v-app>
</template>

<style>
.celebration-dialog {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%);
}

.celebration-content {
  animation: celebrate 0.6s ease-in-out;
}

@keyframes celebrate {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  50% {
    transform: scale(1.05);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.celebration-icon {
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(5px);
  }

  50% {
    transform: translateY(-5px);
  }
}
</style>
