import { set } from 'zod';
import './lib/loadEnv'
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

// 一、状态定义

const StateAnnotation = Annotation.Root({
    input: Annotation<string>(),

    loop: Annotation<number>({
        reducer: (_, newState) => newState,
        default: () => 0
    }),

    parallelRes: Annotation<string[]>({
        reducer: (oldState, newState) => {
            return [...oldState, ...newState]
        },
        default: () => []
    })
})


// 二、线性流程模式

const nodeA = (state: typeof StateAnnotation.State) => {
    return {
        input: `${state.input} => 来自nodeA`
    }
}

const nodeB = (state: typeof StateAnnotation.State) => {
    return {
        input: `${state.input} => 来自nodeB`
    }
}

const nodeC = (state: typeof StateAnnotation.State) => {
    return {
        input: `${state.input} => 来自nodeC`
    }

}


// 导出线性流程图

export const linearGraph = new StateGraph(StateAnnotation)
    .addNode('nodeA', nodeA)
    .addNode('nodeB', nodeB)
    .addNode('nodeC', nodeC)
    .addEdge(START, 'nodeA')
    .addEdge('nodeA', 'nodeB')
    .addEdge('nodeB', 'nodeC')
    .addEdge('nodeC', END)
    .compile();


// 三、分支流程模式
export const branchGraph = new StateGraph(StateAnnotation)
    .addNode('nodeA', nodeA)
    .addNode('nodeB', nodeB)
    .addNode('nodeC', nodeC)
    .addEdge(START, 'nodeA')
    .addConditionalEdges('nodeA', (state) => {
        if (state.input.includes('B')) {
            return ['nodeB']
        } else if (state.input.includes('c')) {
            return ['nodeC']
        }
        return END
    })
    .addEdge('nodeB', 'nodeC')
    .addEdge('nodeC', END)
    .compile();


// 四、循环流程模式

const nodeD = (state: typeof StateAnnotation.State) => {
    return {
        input: `${state.input} => nodeD`,
        loop: state.loop + 1
    }
}

export const loopGraph = new StateGraph(StateAnnotation)
    .addNode('nodeD', nodeD)
    .addEdge('__start__', 'nodeD')
    .addConditionalEdges('nodeD', state => {
        if (state.loop < 3) return 'nodeD'
        return END
    })
    .compile();


// 五、并行流程模式
const sleep = (ms: number) => new Promise((resolve) => {
    setTimeout(() => {
        resolve(0)
    }, ms)
})

const nodeE = async (state: typeof StateAnnotation.State) => {
    await sleep(2000)

    return {
        parallelRes: ['来自nodeE']
    }
}

const nodeF = async (state: typeof StateAnnotation.State) => {
    await sleep(3000)
    return {
        parallelRes: ['来自nodeF']
    }
}

const nodeG = async (state: typeof StateAnnotation.State) => {
    await sleep(5000)
    return {
        parallelRes: ['异步，来自nodeG']
    }
}

const nodeH = async (state: typeof StateAnnotation.State) => {
    console.log("%c Line:140 🍉 state", "color:#465975", state);

    await sleep(5000)
    return {

    }

}

export const parallelGraph = new StateGraph(StateAnnotation)
    .addNode('nodeE', nodeE)
    .addNode('nodeF', nodeF)
    .addNode('nodeG', nodeG)
    .addNode('nodeH', nodeH)

    .addEdge(START, 'nodeE')
    .addEdge(START, 'nodeF')
    .addEdge(START, 'nodeG')

    .addEdge('nodeE', 'nodeH')
    .addEdge('nodeF', 'nodeH')
    .addEdge('nodeG', 'nodeH')
    .addEdge('nodeH', END)
    .compile()


async function runDemo() {
    // 线性流程
    console.log("=== 线性流程模式 (linearGraph) ===")
    const res1 = await linearGraph.invoke({ input: '开始' })
    console.log("%c Line:38 🍉 res", "color:#42b983", res1);

    // 分支流程
    console.log("\n=== 分支流程模式 (branchGraph) ===")
    const res2 = await branchGraph.invoke({ input: 'C' })
    console.log("%c Line:38 🍉 res", "color:#42b983", res2);

    // 循环流程
    console.log("\n=== 循环流程模式 (loopGraph) ===")
    const res3 = await loopGraph.invoke({ input: '循环模式' })
    console.log("%c Line:38 🍉 res", "color:#42b983", res3);

    // 并行流程
    console.log("\n=== 并行流程模式 (parallelGraph) ===")
    const res4 = await parallelGraph.invoke({ input: "并行模式" })
    console.log("%c Line:160 🍓 res", "color:#465975", res4);
}


if (require.main === module) {
    runDemo()
}
