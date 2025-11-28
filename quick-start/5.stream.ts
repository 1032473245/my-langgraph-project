import './lib/loadEnv'
import { Annotation, StateGraph } from '@langchain/langgraph'
import {BaseMessage, HumanMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'

// 一、LLM实例化

const llm = new ChatOpenAI({
    model: 'qwen3-max'
})
    

// 二、状态的定义

const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>(),
    summary: Annotation<string>()
})

// 三、节点函数定义

/**
 * LLM 对话节点
*/

const llmNode = async (state: typeof StateAnnotation.State) => {
    const response = await llm.invoke(state.messages)
    return {
        messages: [response]
    }
}

/**
 * 摘要生产节点
*/

const summaryNode = async (state: typeof StateAnnotation.State, ctx: any) => {
    const response = await llm.invoke([...state.messages, new HumanMessage('请总结一下前面的对话')])
    return {
        summary: response.content
    }
}

// 四、构建并编译图

export const streamGraph = new StateGraph(StateAnnotation)
    .addNode('llmNode', llmNode)
    .addNode('summaryNode', summaryNode)
    .addEdge('__start__', 'llmNode')
    .addEdge('llmNode', 'summaryNode')
    .addEdge('summaryNode', '__end__')
    .compile();


// 五、流式模式演示函数

/**
 * values 模式：完整状态快照
*/

async function streamValues(input: { messages: BaseMessage[] }) {
    console.log("\n%c ════════════════════════════════════════", "color:#33a5ff");
    console.log("%c   📦 streamMode: 'values' - 完整状态快照", "color:#33a5ff; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#33a5ff");
    // stream 方法返回异步迭代器
    for await (const chunk of await streamGraph.stream(input, { streamMode: 'values' })) {
        console.log("%c [values] 完整状态:", "color:#33a5ff", chunk);
    }
}

/**
 * updates 模式：增量状态更新
*/

async function streamUpdates(input: { messages: BaseMessage[] }) {
    console.log("\n%c ════════════════════════════════════════", "color:#f5ce50");
    console.log("%c   🔄 streamMode: 'updates' - 增量更新", "color:#f5ce50; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#f5ce50");

    for await (const chunk of await streamGraph.stream(input, { streamMode: 'updates'})) {
        console.log("%c [updates] 状态更新:", "color:#f5ce50", chunk);
    }
}

/**
 * messages 模式：消息流（打字机效果）
*/

async function streamMessages(input: { messages: BaseMessage[] }) {
    console.log("\n%c ════════════════════════════════════════", "color:#f5ce50");
    console.log("%c   📢 streamMode: 'updates' - 打字机效果", "color:#f5ce50; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#f5ce50");

    for await (const chunk of await streamGraph.stream(input, { streamMode: 'messages'})) {
        if (chunk?.[0]?.content) {
            process.stdout.write(String(chunk[0].content))
        }
    }

    console.log("\n%c [messages] 输出完成", "color:#42b983");
}

/**
 * custom 模式：自定义数据流
*/

async function streamCustom(input: { messages: BaseMessage[] }) {
 console.log("\n%c ════════════════════════════════════════", "color:#e056fd");
    console.log("%c   🎯 streamMode: 'custom' - 自定义数据流", "color:#e056fd; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#e056fd");
    for await (const custom of await streamGraph.stream(input, { streamMode: "custom" })) {
        console.log("%c [custom] 自定义数据:", "color:#e056fd", custom);
    }
    console.log("%c [custom] (需要在节点中使用 ctx.writer 发送自定义数据)", "color:#e056fd; font-style:italic");
}

/**
 * streamEvents：详细事件流
*/

async function streamEvents(input: {messages: BaseMessage[]}) {
    console.log("\n%c ════════════════════════════════════════", "color:#ff7675");
    console.log("%c   📡 streamEvents - 详细事件流", "color:#ff7675; font-weight:bold");
    console.log("%c ════════════════════════════════════════\n", "color:#ff7675");
    for await (const e of streamGraph.streamEvents(input, { version: 'v2' })) {
        console.log("%c [event]", "color:#ff7675", e.event);
    }
}

// 六、运行实例
async function runDemo() {
    const input = { messages: [new HumanMessage('你好')] }

    console.log("%c\n╔══════════════════════════════════════════════════════════╗", "color:#6c5ce7");
    console.log("%c║          🚀 LangGraph 流式输出模式演示                    ║", "color:#6c5ce7; font-weight:bold");
    console.log("%c╚══════════════════════════════════════════════════════════╝\n", "color:#6c5ce7");

    await streamValues(input)  
    await streamUpdates(input)   
    await streamMessages(input)  
    await streamCustom(input)   
    await streamEvents(input)   
    
    console.log("\n%c ✅ 所有流式模式演示完成!", "color:#00b894; font-weight:bold");
}


// 运行示例
if (require.main === module) {
    runDemo()
}