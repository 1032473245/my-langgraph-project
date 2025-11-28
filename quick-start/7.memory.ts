import './lib/loadEnv'
import { ChatOpenAI } from '@langchain/openai'
import { Annotation, StateGraph } from '@langchain/langgraph'
import { BaseMessage, HumanMessage } from '@langchain/core/messages'
import { randomUUID } from 'node:crypto'
import { MemorySaver } from '@langchain/langgraph'

// 一、checkpointer 创建
const devCheckpointer = new MemorySaver()

// 二、 LLM 实例化
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
const llmNode = async (state: typeof StateAnnotation.State) => {
    const response = await llm.invoke(state.messages)
    return {
        messages: [response]
    }
}

// 五、构建并编译图
export const memoryGraph = new StateGraph(StateAnnotation)
    .addNode('llmNode', llmNode)
    .addEdge('__start__', 'llmNode')
    .addEdge('llmNode', '__end__')
    .compile({ checkpointer: devCheckpointer })


// 六、运行示例

// 辅助函数：格式化输出消息
const logMessages = (messages: BaseMessage[]) => {
    messages.forEach((msg) => {
        console.log(`%c Line:44 🥒 【${msg.getType()}】`, "color:#2eafb0", msg.content);
    })
}

async function runDemo() {
    try {
        const threadId = randomUUID()

        console.log("%c Line:62 🍪==============第一轮对话============", "color:#7f2b82");

        await memoryGraph.invoke({
            messages: [
                new HumanMessage('中国首都在哪里')
            ]
        }, {
            configurable: {
                thread_id: threadId,
            }
        }).then(res => {
            logMessages(res.messages)
        })


        console.log("%c Line:62 🍪==============第二轮对话============", "color:#7f2b82");

        await memoryGraph.invoke({
            messages: [
                new HumanMessage('上一个问题问的是什么')
            ]
        }, {
            configurable: {
                thread_id: threadId,
            }
        }).then(res => {
            logMessages(res.messages)
        })

    } catch (error) {
        console.error("错误:", error);
    }
}


// 运行示例
if (require.main === module) {
    runDemo()
}