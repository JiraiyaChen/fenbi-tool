# 复制选择题内容 - Chrome扩展程序

这是一个Chrome扩展程序，用于在网页中自动添加复制按钮，可以复制选择题的内容。

## 功能描述

- 在页面的 `class="solution-choice-container"` 元素中自动添加一个复制按钮
- 点击按钮后，会复制 `class="question-choice-container"` 元素下所有子集的文本内容
- 支持动态加载的页面内容
- 提供复制成功/失败的视觉反馈

## 安装方法

### 方法1：开发者模式安装（推荐）

1. 打开Chrome浏览器
2. 在地址栏输入 `chrome://extensions/`
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择包含这些文件的文件夹（fenbi-tool）
6. 扩展程序会自动安装并启用

### 方法2：打包安装

1. 在Chrome扩展程序页面，点击"打包扩展程序"
2. 选择fenbi-tool文件夹
3. 生成.crx文件后安装

## 文件结构

```
fenbi-tool/
├── manifest.json      # 扩展程序配置文件
├── content.js         # 核心功能脚本
├── styles.css         # 按钮样式文件
├── popup.html         # 扩展程序弹窗页面
└── README.md         # 说明文档
```

## 使用方法

1. 安装扩展程序后，访问包含以下HTML结构的网页：

   ```html
   <div class="solution-choice-container">
     <!-- 复制按钮会自动添加到这里 -->
   </div>

   <div class="question-choice-container">
     <!-- 要复制的内容 -->
     <p>选择题选项A</p>
     <p>选择题选项B</p>
     <p>选择题选项C</p>
   </div>
   ```

2. 扩展程序会自动检测页面中的这些元素
3. 在`solution-choice-container`中会出现"复制题目内容"按钮
4. 点击按钮即可复制`question-choice-container`下的所有文本内容

## 特性

- **自动检测**：页面加载完成后自动检测目标元素
- **动态适应**：支持通过JavaScript动态加载的内容
- **视觉反馈**：复制成功/失败时提供视觉反馈
- **兼容性强**：支持现代浏览器的Clipboard API，同时提供降级方案
- **防重复**：避免在同一容器中重复添加按钮
- **响应式**：按钮样式适配移动端

## 技术实现

- 使用`MutationObserver`监听DOM变化
- 采用`TreeWalker`遍历文本节点确保完整复制内容
- 使用现代的`navigator.clipboard` API，同时提供`document.execCommand`降级支持
- CSS3动画提供良好的用户交互体验

## 兼容性

- Chrome 88+
- Edge 88+
- 支持Manifest V3规范

## 开发说明

如需修改功能，主要文件说明：

- `content.js`：核心逻辑，包含按钮创建、事件处理、文本复制功能
- `styles.css`：按钮样式和动画效果
- `manifest.json`：扩展权限和配置信息

## 注意事项

- 扩展程序需要"activeTab"权限来访问当前标签页内容
- 某些网站的安全策略可能影响复制功能的使用
- 建议在HTTPS环境下使用以确保最佳兼容性
