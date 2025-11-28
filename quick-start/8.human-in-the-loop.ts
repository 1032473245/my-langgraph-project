import { ChatOpenAI } from '@langchain/openai'
import './lib/loadEnv'
import { Annotation, Command, MemorySaver, StateGraph, interrupt } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from "zod";
import { randomUUID } from 'crypto'
import { hu } from 'zod/locales'


// 一、Checkpointer 创建

const devCheckpointer = new MemorySaver()

// 二、LLM实例化

const llm = new ChatOpenAI({
    model: 'qwen3-max'
})

// 三、工具的定义

const wetherSchema = z.object({ city: z.string()})

const getWether = tool(
    async (input: any, config) => {
        const { city} = input;
        return `${city} 今日晴，25°C`;
    },
    {
        name: 'getWether',
        description: "查询指定城市当前天气信息的工具。请提供城市名称。  如： 上海、北京",
        schema: wetherSchema
    }
)

const tools = [getWether]

// 四、状态定义
const StateAnnotation = Annotation.Root({
    message: Annotation<BaseMessage[]>({
        reducer: (oldState, newState) => {
            return [...oldState, ...newState]
        },
        default() {
            return []
        },
    })
})

// 五、节点函数定义
const llmNode = async (state: typeof StateAnnotation.State) => {
    const llmWithTools = llm.bindTools(tools)
    const response = await llmWithTools.invoke(state.message)
    return {
        messages: [response]
    }
}

// 使用内置的 ToolNode
const toolNode = new ToolNode(tools)

/**
 * 条件函数
*/
const shouldContinue = (state: typeof StateAnnotation.State) => {
    const lastMessage = state.message[state.message.length - 1] as AIMessage

    const value = interrupt(
        {
            customValue: '是否调用大模型-shouldContinue'
        }
    )
    console.log("%c Line:81 🍊 shouldContinue", "color:#6ec1c2", value);

    return lastMessage.tool_calls && lastMessage.tool_calls.length > 0 ? 'tools' : 'end'

}

// 六、构建并编译图
export const humanInTheLoopGraph = new StateGraph(StateAnnotation)
    .addNode('llmNode', llmNode)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'llmNode')
    .addConditionalEdges('llmNode', shouldContinue, {
        tools: 'tools',
        end: '__end__'
    })
    .addEdge('tools', 'llmNode')
    .compile({ checkpointer: devCheckpointer })

// 七、运行示例
async function runDemo() {
    try {
        const threadId = randomUUID()

        console.log("📍 第一次调用：发送问题，等待中断...");
        const res = await humanInTheLoopGraph.invoke({
            message: [
                new HumanMessage('上海天气怎么样')
            ]
        }, {
            configurable: {
                thread_id: threadId,
            }
        })


        console.log("%c Line:63 🥪 interrupt", "color:#f5ce50", (res as any).__interrupt__?.[0]?.value?.customValue);
        
        console.log("\n📍 第二次调用：恢复执行...");

        const msgs = await humanInTheLoopGraph.invoke(new Command({ resume: true }), {
            configurable: {
                thread_id: threadId
            }
        })
        console.log("%c Line:101 🌭 msgs", "color:#7f2b82", msgs);
    
    } catch (error) {
        console.error("错误:", error)    
    }
}

// 运行示例
if (require.main === module) {
    runDemo()
}


