import 'dotenv/config';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

// 定义状态
const StateAnnotation = Annotation.Root({
  message: Annotation<string>,
});

// 创建 LLM 节点
const llmNode = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({ model: 'gpt-3.5-turbo' });
  const response = await model.invoke([new HumanMessage(state.message)]);
  return { message: response.content };
};

// 构建图
const graph = new StateGraph(StateAnnotation)
  .addNode('llm', llmNode)
  .addEdge(START, 'llm')
  .addEdge('llm', END)
  .compile();

// 运行
const result = await graph.invoke({ message: '你好！' });
console.log(result.message);
console.log(123)