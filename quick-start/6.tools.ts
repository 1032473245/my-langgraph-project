import './lib/loadEnv';
import { Annotation, END, StateGraph } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from "@langchain/core/tools";
import { ToolNode } from '@langchain/langgraph/prebuilt';
import z from 'zod';


// 一、工具定义

/**
 * 天气查询工具
*/

const getWeather = tool(
    async (input) => {
        return `未来三天${input.city}的天气是：\n今天：晴，25度\n明天：多云，22度\n后天：小雨，20度`;
    },
    {
        name: 'getWeather',
        description: '获取指定城市的天气，输入格式为：城市，如：北京',
        schema: z.object({
            city: z.string().describe('城市名称，如北京、上海、广州等'),
        })
    }
)

/**
 * 数学计算工具
*/

const calculate = tool(
    async (input) => {
        const { expression } = input;
        try {
            const result = eval(expression)
            return `计算结果：${expression} = ${result}`;
        } catch {
            return `无法计算表达式：${expression}`;
        }
    },
    {
        name: 'calculate',
        description: '计算数学表达式，如：1+2*3',
        schema: z.object({
            expression: z.string().describe('数学表达式，如 1+2*3'),
        })
    }
)

// 工具列表
const tools = [getWeather, calculate]

// 二、LLM 实例化

const llm = new ChatOpenAI({
    model: 'qwen3-max',
})

// 三、状态定义
const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (oldState, newState) => {
            return [...oldState, ...newState]
        },
        default: () => []
    })
})

// 四、节点函数定义
const toolNode = new ToolNode(tools)


/**
 * LLM 节点
*/

const llmNode = async (state: typeof StateAnnotation.State) => {
    const llmWithTools = llm.bindTools(tools)
    const response = await llmWithTools.invoke(state.messages)
    return {
        messages: [response]
    }

}



/**
 * 条件路由函数
*/

const shouldContinue = (state: typeof StateAnnotation.State) => {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return 'tools'
    } else {
        return END;
    }
}



// 五、构造并编译图

export const toolsGraph = new StateGraph(StateAnnotation)
   .addNode('llmNode', llmNode)
   .addNode('toolNode', toolNode)
   .addEdge('__start__', 'llmNode')
   .addConditionalEdges('llmNode', shouldContinue, {
        'tools': 'toolNode',
        [END]: '__end__'
   })
   .addEdge('toolNode', 'llmNode')
   .compile()


// 六、运行示例

// 辅助函数：格式化输出消息
const logMessages = (messages: BaseMessage[]) => {
    messages.forEach((msg) => {
        console.log(`【${msg.getType()}】`, msg.content);
    })
}

async function runDemo() {
    console.log("\n%c ════════════════════════════════════════", "color:#33a5ff");
    console.log("%c   🛠️  LangGraph 工具调用演示", "color:#33a5ff; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#33a5ff");

    console.log("📍 测试1: 查询天气")
    const res1 = await toolsGraph.invoke({ messages: [new HumanMessage("北京今天天气怎么样")] })
    logMessages(res1.messages)

    console.log("\n📍 测试2: 数学计算")
    const res2 = await toolsGraph.invoke({ messages: [new HumanMessage("帮我计算 123 * 456")] })
    logMessages(res2.messages)
}

if (require.main === module) {
    runDemo()
}



