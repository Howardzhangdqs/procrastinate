import { ref } from "vue";

const lastTaskFinished = ref<Date>(new Date());

const updateLastTaskFinished = () => {
  const passed = getLastTaskFinishedPassed();
  lastTaskFinished.value = new Date();
  console.log("Last task finished updated to:", lastTaskFinished.value);

  return passed;
};

const getLastTaskFinishedPassed = () => {
  const now = new Date();
  const past = now.getTime() - lastTaskFinished.value.getTime();
  console.log("Time since last task finished:", past, "milliseconds");
  return past;
};

export { lastTaskFinished, updateLastTaskFinished, getLastTaskFinishedPassed };
