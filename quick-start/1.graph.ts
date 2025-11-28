import './lib/loadEnv'
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';

// 一、状态定义
const StateAnnotation = Annotation.Root({
    input: Annotation<string>(),
    output: Annotation<string>(),
    step: Annotation<number>(),
    isProcessed: Annotation<boolean>()
})


// 二、节点函数定义

/**
 * 输入处理节点
 * 
*/

const inputNode = (state: typeof StateAnnotation.State) => {
    console.log("%c Line:12 🍭 state", "color:#6ec1c2", state.input);
    return {
        step: 1,
        output: `处理后的数据：${state.input}`,
        isProcessed: true
    }
}

/**
 * 验证节点
*/

const validateOutputNode = (state: typeof StateAnnotation.State) => {
    console.log("%c Line:22 🧀 state", "color:#f5ce50", state);
    return {
        step: state.step + 1,
        output: `${state.output}  [已验证]`
    }
}


// 三、构件图

// 导出： 基础图实例
export const basicGraph = new StateGraph(StateAnnotation)
    .addNode('inputNode', inputNode)
    .addNode('validateOutputNode', validateOutputNode)
    .addEdge(START, 'inputNode')
    .addEdge('inputNode', 'validateOutputNode')
    .addEdge('validateOutputNode', END)
    .compile()


// 四、运行实例

async function runDemo() {
    const res = await basicGraph.invoke({ input: '你好' })
    console.log("%c Line:39 🥤 res", "color:#42b983", res);
}

if (require.main === module) {
    runDemo()
}