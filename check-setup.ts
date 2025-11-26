#!/usr/bin/env esno

/**
 * 环境配置检查脚本
 * 验证所有依赖是否正确安装，环境变量是否配置正确
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// 加载环境变量
config();

console.log('🚀 LangGraph.js 课程环境检查\n');

// 检查环境变量
console.log('📋 环境变量检查:');

const requiredEnvVars = ['OPENAI_API_KEY'];
const optionalEnvVars = ['OPENAI_BASE_URL', 'OPENAI_MODEL'];

let hasErrors = false;

// 检查必需的环境变量
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('KEY')) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`  ✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
    hasErrors = true;
  }
});

// 检查可选的环境变量
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: 未设置 (可选)`);
  }
});

console.log('\n📦 依赖包检查:');

// 检查核心依赖包
const corePackages = [
  '@langchain/langgraph',
  '@langchain/core',
  '@langchain/openai',
  '@langchain/mcp-adapters',
  'zod',
  'dotenv'
];

const devPackages = [
  'typescript',
  '@types/node',
  'vitest'
];

// 尝试导入核心包
console.log('  核心依赖:');
for (const pkg of corePackages) {
  try {
    require.resolve(pkg);
    console.log(`    ✅ ${pkg}`);
  } catch (error) {
    console.log(`    ❌ ${pkg}: 未安装`);
    hasErrors = true;
  }
}

// 尝试导入开发依赖
console.log('  开发依赖:');
for (const pkg of devPackages) {
  try {
    require.resolve(pkg);
    console.log(`    ✅ ${pkg}`);
  } catch (error) {
    console.log(`    ⚠️  ${pkg}: 未安装 (可选)`);
  }
}

console.log('\n📁 文件检查:');

// 检查关键文件
const filesToCheck = [
  '.env',
  '.gitignore',
  'package.json'
];

filesToCheck.forEach(file => {
  const filePath = resolve(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file}: 不存在`);
  }
});

// 检查示例目录
const examplesPath = resolve(process.cwd(), 'examples');
if (existsSync(examplesPath)) {
  console.log('  ✅ examples/ 目录');
} else {
  console.log('  ❌ examples/ 目录: 不存在');
  hasErrors = true;
}

// 尝试导入并测试 LangGraph
console.log('\n🧪 功能测试:');

async function testLangGraph() {
  try {
    const { Annotation } = await import('@langchain/langgraph');
    console.log('  ✅ LangGraph 核心模块导入成功');

    // 简单的状态定义测试
    const State = Annotation.Root({
      message: Annotation<string>,
    });
    console.log('  ✅ State 创建成功');

  } catch (error: any) {
    console.log('  ❌ LangGraph 模块导入失败:', error.message);
    hasErrors = true;
  }
}

async function main() {
  await testLangGraph();

  // 输出总结
  console.log('\n' + '='.repeat(50));

  if (hasErrors) {
    console.log('❌ 检查完成，发现一些问题。请根据上述信息进行修复。');
    console.log('\n💡 建议:');
    console.log('1. 确保已运行 pnpm install');
    console.log('2. 创建 .env 文件并设置 OPENAI_API_KEY');
    console.log('3. 检查 Node.js 版本 >= 18');
    process.exit(1);
  } else {
    console.log('🎉 检查完成！环境配置正确，可以开始学习 LangGraph.js！');
    console.log('\n🚀 快速开始:');
    console.log('  esno examples/基础概念/什么是LangGraph/basic-graph.ts');
  }

  console.log('\n📚 更多示例请查看 examples/ 目录\n');
}

main().catch(console.error);