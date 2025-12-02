/**
 * 人机协作 Agent
 */

import "../../utils/loadEnv";
import {
  StateGraph,
  Annotation,
  START,
  END,
  interrupt,
  messagesStateReducer,
} from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// 状态定义

// 定义人机协作 Agent 状态
const HumanAIStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  currentTask: Annotation<String>(),
  riskLevel: Annotation<"low" | "medium" | "high">(),
  requiresApproval: Annotation<boolean>(), // 请求人工审批
  humanFeedback: Annotation<String>(), // 用户反馈
  actionPlan: Annotation<{
    // 生成计划
    action: string;
    reasoning: string;
    risks: string[];
    alternatives: string[];
  }>(),
});

// 任务分析节点 - 分析任务复杂度和风险

/**
 * ① analyzeTask          → 风险分析
② createActionPlan     → 生成计划
③ requestApproval      → 请求人工审批
④ processHumanFeedback → 模拟用户反馈
⑤ executeAction        → 按计划执行
⑥ executeDirectly      → 低风险直接执行
*/

const analyzeTask = (state: typeof HumanAIStateAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const task = lastMessage.content.toString();

  console.log(`\n🔍 分析任务: "${task}"`);

  // 评估任务风险等级
  let riskLevel: "low" | "medium" | "high" = "low";
  let requiresApproval = false;

  // 高风险关键词
  const highRiskKeywords = [
    "删除",
    "清空",
    "重置",
    "格式化",
    "支付",
    "转账",
    "发布",
    "部署",
  ];
  // 中风险关键词
  const mediumRiskKeywords = ["修改", "更新", "配置", "设置", "安装", "卸载"];

  if (highRiskKeywords.some((keyword) => task.includes(keyword))) {
    riskLevel = "high";
    requiresApproval = true;
  } else if (mediumRiskKeywords.some((keyword) => task.includes(keyword))) {
    riskLevel = "medium";
    requiresApproval = true;
  }

  console.log(`📊 风险评估: ${riskLevel} (需要审批: ${requiresApproval})`);

  return {
    currentTask: task,
    riskLevel,
    requiresApproval,
  };
};

// 指定行动计划点
const createActionPlan = (state: typeof HumanAIStateAnnotation.State) => {
  const { currentTask, riskLevel } = state;

  console.log(`📝 生成计划: ${currentTask}`);

  let actionPlan = {
    action: "",
    reasoning: "",
    risks: [] as string[],
    alternatives: [] as string[],
  };

  if (currentTask.includes("删除")) {
    actionPlan = {
      action: "执行删除操作",
      reasoning: "用户明确要求删除指定内容",
      risks: [
        "数据可能无法恢复",
        "可能影响其他相关功能",
        "误删除重要信息的风险",
      ],
      alternatives: [
        "先备份再删除",
        "移动到回收站而非永久删除",
        "标记为已删除但保留数据",
      ],
    };
  } else if (currentTask.includes("修改")) {
    actionPlan = {
      action: "执行修改操作",
      reasoning: "用户需要更新现有配置或数据",
      risks: ["修改可能导致系统不稳定", "配置错误可能影响功能"],
      alternatives: [
        "创建配置副本后再修改",
        "分步骤逐项修改",
        "使用测试环境先验证",
      ],
    };
  } else {
    actionPlan = {
      action: "执行常规操作",
      reasoning: "这是一个标准的低风险操作",
      risks: ["操作失败的可能性较低"],
      alternatives: ["如果失败，可以重试或寻求帮助"],
    };
  }

  console.log(`📝 计划详情:`);
  console.log(`   行动: ${actionPlan.action}`);
  console.log(`   理由: ${actionPlan.reasoning}`);
  console.log(`   风险: ${actionPlan.risks.join(", ")}`);
  console.log(`   替代方案: ${actionPlan.alternatives.join(", ")}`);

  return {
    actionPlan,
    messages: [
      new AIMessage({
        content: `我已制定行动计划：
        
**计划行动**: ${actionPlan.action}
**执行理由**: ${actionPlan.reasoning}
**潜在风险**: 
${actionPlan.risks.map((risk) => `- ${risk}`).join("\n")}
**替代方案**: 
${actionPlan.alternatives.map((alt) => `- ${alt}`).join("\n")}`,
      }),
    ],
  };
};

// 人工审批节点 - 等待人工确认
const requestApproval = async (state: typeof HumanAIStateAnnotation.State) => {
  const { actionPlan, riskLevel } = state;

  console.log(`\n⏸️ 请求人工审批 (风险等级: ${riskLevel})`);

  const approvalMessage = `🚨 需要您的确认

**任务**: ${state.currentTask}
**风险等级**: ${riskLevel.toUpperCase()}
**计划行动**: ${actionPlan.action}

**风险提示**:
${actionPlan.risks.map((risk) => `⚠️ ${risk}`).join("\n")}

**可选方案**:
${actionPlan.alternatives
  .map((alt, index) => `${index + 1}. ${alt}`)
  .join("\n")}

请选择：
1. 批准执行原计划
2. 选择替代方案 (请指定编号)
3. 拒绝执行
4. 修改计划 (请提供具体指导)

请输入您的决定：`;

  // 在实际应用中，这里会暂停执行等待人工输入
  // 使用 interrupt 来暂停图的执行
  return {
    messages: [
      new AIMessage({
        content: approvalMessage,
      }),
    ],
  };
};

// 处理人工反馈节点
const processHumanFeedback = (state: typeof HumanAIStateAnnotation.State) => {
  // 在实际应用中，这里会从用户输入中获取反馈
  // 为了演示，我们模拟不同的反馈情况
  const mockFeedbacks = [
    "批准执行",
    "选择替代方案1",
    "拒绝执行",
    "修改计划：请先备份数据",
  ];

  const feedback =
    mockFeedbacks[Math.floor(Math.random() * mockFeedbacks.length)];

  console.log(`\n👤 收到人工反馈: "${feedback}"`);

  return {
    humanFeedback: feedback,
    messages: [
      new HumanMessage({
        content: feedback,
      }),
    ],
  };
};

// 执行操作节点
const executeAction = (state: typeof HumanAIStateAnnotation.State) => {
  const { humanFeedback, actionPlan } = state;

  console.log(`\n⚡ 执行操作`);

  let executionResult = "";

  if (humanFeedback.includes("批准")) {
    executionResult = `✅ 已按原计划执行: ${actionPlan.action}`;
    console.log(`执行成功: ${actionPlan.action}`);
  } else if (humanFeedback.includes("替代方案")) {
    const altIndex = parseInt(humanFeedback.match(/\d+/)?.[0] || "1") - 1;
    const selectedAlt =
      actionPlan.alternatives[altIndex] || actionPlan.alternatives[0];
    executionResult = `✅ 已执行替代方案: ${selectedAlt}`;
    console.log(`执行替代方案: ${selectedAlt}`);
  } else if (humanFeedback.includes("拒绝")) {
    executionResult = `❌ 操作已取消，遵循用户指示`;
    console.log(`操作被拒绝，已取消执行`);
  } else if (humanFeedback.includes("修改")) {
    const modification = humanFeedback.replace("修改计划：", "").trim();
    executionResult = `🔄 已按修改指示执行: ${modification}`;
    console.log(`按修改指示执行: ${modification}`);
  }

  return {
    messages: [
      new AIMessage({
        content: `操作完成！
        
${executionResult}

感谢您的指导，这种人机协作确保了操作的安全性和准确性。`,
      }),
    ],
  };
};

// 决策路由 - 决定是否需要人工干预
const shouldRequestApproval = (state: typeof HumanAIStateAnnotation.State) => {
  if (state.requiresApproval) {
    console.log(`🔄 需要人工审批`);
    return "request_approval";
  } else {
    console.log(`🚀 可以直接执行`);
    return "execute_directly";
  }
};

// 直接执行节点 - 用于低风险操作
const executeDirectly = (state: typeof HumanAIStateAnnotation.State) => {
  const { actionPlan } = state;

  console.log(`\n⚡ 直接执行低风险操作`);

  const result = `✅ 已自动执行: ${actionPlan.action}
  
这是一个低风险操作，已安全完成。`;

  console.log(`自动执行完成: ${actionPlan.action}`);

  return {
    messages: [
      new AIMessage({
        content: result,
      }),
    ],
  };
};

// 创建人机协作 Agent
const createHumanAIAgent = () => {
  return (
    new StateGraph(HumanAIStateAnnotation)
      .addNode("analyze_task", analyzeTask)
      .addNode("create_plan", createActionPlan)
      .addNode("request_approval", requestApproval)
      .addNode("process_feedback", processHumanFeedback)
      .addNode("execute_action", executeAction)
      .addNode("execute_directly", executeDirectly)

      // 设置流程
      .addEdge(START, "analyze_task")
      .addEdge("analyze_task", "create_plan")
      .addConditionalEdges("create_plan", shouldRequestApproval, {
        request_approval: "request_approval",
        execute_directly: "execute_directly",
      })
      .addEdge("request_approval", "process_feedback")
      .addEdge("process_feedback", "execute_action")
      .addEdge("execute_action", END)
      .addEdge("execute_directly", END)

      .compile()
  );
};

// 使用示例
async function demonstrateHumanAIAgent() {
  console.log("=== 人机协作 Agent 演示 ===\n");

  // const agent = createHumanAIAgent();
  const agent = createAdvancedHumanAIAgent();

  const testTasks = [
    "帮我查询今天的天气",
    "修改系统配置文件",
    "删除所有用户数据",
    "更新软件版本",
    "发布新版本到生产环境",
  ];

  for (const task of testTasks) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 处理任务: "${task}"`);
    console.log(`${"=".repeat(60)}`);

    try {
      const result = await agent.invoke({
        messages: [new HumanMessage({ content: task })],
      });

      const finalMessage = result.messages[result.messages.length - 1];
      console.log(`\n🎯 最终结果:`);
      console.log(finalMessage.content);
      console.log(`\n📊 任务信息:`);
      console.log(`   风险等级: ${result.riskLevel}`);
      console.log(`   需要审批: ${result.requiresApproval}`);
      if (result.humanFeedback) {
        console.log(`   人工反馈: ${result.humanFeedback}`);
      }
    } catch (error) {
      console.error(`❌ 处理失败: ${error}`);
    }

    // 等待一下再处理下一个任务
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// 高级人机协作示例 - 支持多轮交互
const createAdvancedHumanAIAgent = () => {
  const AdvancedStateAnnotation = Annotation.Root({
    ...HumanAIStateAnnotation.spec,
    conversationHistory: Annotation<string[]>(),
    clarificationNeeded: Annotation<boolean>(),
    expertiseRequired: Annotation<string[]>(),
  });

  // 需求澄清节点
  const clarifyRequirements = (state: typeof AdvancedStateAnnotation.State) => {
    const task = state.currentTask;

    console.log(`\n❓ 需求澄清阶段`);

    let clarificationQuestions = [];

    if (task.includes("删除") && !task.includes("什么")) {
      clarificationQuestions.push("请确认要删除的具体内容是什么？");
      clarificationQuestions.push("删除后是否需要备份？");
    }

    if (task.includes("修改") && !task.includes("如何")) {
      clarificationQuestions.push("请说明具体要修改哪些参数？");
      clarificationQuestions.push("修改的目标值是什么？");
    }

    if (clarificationQuestions.length > 0) {
      const clarificationMessage = `🤔 为了更好地帮助您，我需要一些澄清：

${clarificationQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

请提供更多详细信息。`;

      console.log(`需要澄清: ${clarificationQuestions.join("; ")}`);

      return {
        clarificationNeeded: true,
        messages: [
          new AIMessage({
            content: clarificationMessage,
          }),
        ],
      };
    } else {
      console.log(`任务描述清晰，无需澄清`);
      return {
        clarificationNeeded: false,
      };
    }
  };

  return new StateGraph(AdvancedStateAnnotation)
    .addNode("analyze_task", analyzeTask)
    .addNode("clarify_requirements", clarifyRequirements)
    .addNode("create_plan", createActionPlan)
    .addNode("request_approval", requestApproval)
    .addNode("process_feedback", processHumanFeedback)
    .addNode("execute_action", executeAction)
    .addNode("execute_directly", executeDirectly)

    .addEdge(START, "analyze_task")
    .addEdge("analyze_task", "clarify_requirements")
    .addConditionalEdges("clarify_requirements", (state) => {
      return state.clarificationNeeded ? "create_plan" : "create_plan";
    })
    .addConditionalEdges("create_plan", shouldRequestApproval, {
      request_approval: "request_approval",
      execute_directly: "execute_directly",
    })
    .addEdge("request_approval", "process_feedback")
    .addEdge("process_feedback", "execute_action")
    .addEdge("execute_action", END)
    .addEdge("execute_directly", END)

    .compile();
};

if (require.main === module) {
  demonstrateHumanAIAgent().catch(console.error);
}

export {
  createHumanAIAgent,
  createAdvancedHumanAIAgent,
  HumanAIStateAnnotation,
};
