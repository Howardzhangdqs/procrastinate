import OpenAI from "openai";
import detail_prompt from "@/prompts/detailed.txt?raw";
import { ErrorCode, type TaskSteps } from "./task_interface";


export default async (
  userInput: string,
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt_prefix: string = "",
): Promise<{
  steps: TaskSteps;
  code: ErrorCode;
}> => {
  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const fullPrompt = `${prompt_prefix}${detail_prompt}${userInput}`;

  const getResponse = async (prompt: string) => {
    return (await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })).choices[0].message.content || "";
  };

  // 返回结果为使用代码块包裹起来的JSON字符串，解析为JSON后返回

  let response_format_correct = false;
  let attempts = 0;
  const max_attempts = 3;

  while (!response_format_correct) {

    attempts++;

    let response: string = "";
    try {
      response = await getResponse(fullPrompt);
    } catch (error) {
      return {
        steps: [],
        code: ErrorCode.MODEL_ERROR
      };
    }

    console.log("Response:", response);

    try {
      const cleanedResponse = response
        .split("\n")
        .filter(x => !x.trim().startsWith("```")).join("\n").replace(/```/g, "");

      console.log(cleanedResponse);

      const jsonResponse = JSON.parse(cleanedResponse);

      if (Array.isArray(jsonResponse)) {
        response_format_correct = true;
        return {
          steps: jsonResponse as TaskSteps,
          code: ErrorCode.SUCCESS
        };
      } else {
        console.error("Response is not an array:", jsonResponse);
      }
    } catch (error) {
      console.error("Failed to parse JSON:", error);
    }
  }

  return {
    steps: [],
    code: attempts >= max_attempts ? ErrorCode.OUT_OF_ATTEMPTS : ErrorCode.MODEL_ERROR
  };
};
