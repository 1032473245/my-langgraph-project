import './lib/loadEnv'
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';

// 一、状态定义

const StateAnnotation = Annotation.Root({
    input: Annotation<string>(),
    output: Annotation<string>(),

    // 数组字段 追加
    history: Annotation<string[]>({
        reducer: (oldState, newState) => {
            return [...oldState, ...newState]
        },
        default: () => ['历史的记录']
    }),

    // 数值字段 累加
    step: Annotation<number>({
        reducer: (oldState, newState) => {
            console.log("%c Line:8 🍖 step", "color:#6ec1c2", oldState, newState);

            return oldState + newState
        },
        default: () => 0
    }),

    // 布尔字段 直接覆盖
    isProcessed: Annotation<boolean>({
        reducer: (oldState, newState) => {
            console.log("%c Line:9 🍏 oldState, newState", "color:#f5ce50", oldState, newState);
            return newState
        },
        default: () => false
    })
})


// 二、节点函数

/**
 * 输入处理节点
*/

const inputNode = (state: typeof StateAnnotation.State) => {
    console.log("%c Line:12 🍭 state", "color:#6ec1c2", state.input);
    return {
        step: 1,
        output: `处理后的数据：${state.input}`,
        isProcessed: true,
        history: [state.input]
    }
}

/**
 * 验证节点
*/

const validateOutputNode = (state: typeof StateAnnotation.State) => {
    console.log("%c Line:22 🧀 state", "color:#f5ce50", state);

    return {
        step: 1,
        output: `${state.output}  [已验证]`
    }
}

// 三、构建并编译图

export const annotationGraph = new StateGraph(StateAnnotation)
    .addNode('inputNode', inputNode)
    .addNode('validateOutputNode', validateOutputNode)
    .addEdge(START, 'inputNode')
    .addEdge('inputNode', 'validateOutputNode')
    .addEdge('validateOutputNode', END)
    .compile()


// 四、运行示例

async function runDemo() {
    const res = await annotationGraph.invoke({
        input: '你好'
    })
    console.log("%c Line:39 🥤 res", "color:#42b983", res);
}

if (require.main === module) {
    runDemo()
}

