// 复制选择题内容的Chrome扩展脚本

(function () {
  'use strict';

  // ====== 工具函数 ======

  // 防抖函数
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ====== 选择题复制功能 ======

  // 处理单个 solution-choice-container 节点
  function processSolutionContainer(container) {
    if (container.querySelector('.copy-content-btn')) return;
    const formatContainer = findCorrespondingFormatContainer(container);
    const choiceContainer = findCorrespondingChoiceContainer(container);
    if (formatContainer && choiceContainer) {
      addCopyButton(container, formatContainer, choiceContainer);
    }
  }

  // 扫描指定根节点下的所有 solution-choice-container
  function scanSolutionContainers(root) {
    root
      .querySelectorAll('.solution-choice-container')
      .forEach(processSolutionContainer);
  }

  // 查找对应的app-format-html容器
  function findCorrespondingFormatContainer(solutionContainer) {
    // 查找同级或父级中的app-format-html
    let parent = solutionContainer.parentElement;
    while (parent) {
      const formatContainer = parent.querySelector('app-format-html');
      if (formatContainer) {
        return formatContainer;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  // 查找对应的app-choice-radio容器
  function findCorrespondingChoiceContainer(solutionContainer) {
    // 查找同级或父级中的app-choice-radio
    let parent = solutionContainer.parentElement;
    while (parent) {
      const choiceContainer = parent.querySelector('app-choice-radio');
      if (choiceContainer) {
        return choiceContainer;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  // 创建并添加复制按钮
  function addCopyButton(solutionContainer, formatContainer, choiceContainer) {
    // 检查是否已经添加过按钮，避免重复添加
    if (solutionContainer.querySelector('.copy-content-btn')) {
      return;
    }

    // 创建按钮元素
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-content-btn';
    copyButton.textContent = '复制题目内容';
    copyButton.title = '点击复制选择题的格式化内容';

    // 添加点击事件监听器
    copyButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // 获取格式化的文本内容
      const textContent = getFormattedTextContent(
        formatContainer,
        choiceContainer
      );

      if (textContent) {
        copyToClipboard(textContent, copyButton);
      } else {
        showMessage(copyButton, '没有找到可复制的内容', 'error');
      }
    });

    // 将按钮添加到solution-choice-container的开头
    solutionContainer.insertBefore(copyButton, solutionContainer.firstChild);

    console.log('复制按钮已成功添加到页面');
  }

  // 获取格式化的文本内容
  function getFormattedTextContent(formatContainer, choiceContainer) {
    let result = '';

    // 处理app-format-html下的所有p标签
    const pTags = formatContainer.querySelectorAll('p');
    pTags.forEach((pTag, index) => {
      if (index === 0) {
        // 第一个p标签的内容在同一行显示（保留空格，只去除换行符，然后将空格替换为下划线）
        const firstPText = pTag.textContent
          .replace(/\n/g, '')
          .replace(/ /g, '_______')
          .trim();
        if (firstPText) {
          result += firstPText + '\n';
        }
      } else {
        // 其他p标签在另一行显示（去除内部换行）
        const pText = pTag.textContent.replace(/\s+/g, ' ').trim();
        if (pText) {
          result += pText + '\n';
        }
      }
    });

    // 处理app-choice-radio下ul中的li标签
    const ulElement = choiceContainer.querySelector('ul');
    if (ulElement) {
      const liTags = ulElement.querySelectorAll('li');
      liTags.forEach((li, index) => {
        const liText = li.textContent.replace(/\s+/g, ' ').trim();
        if (liText) {
          result += liText + '\n';
        }
      });
    }

    return result.trim();
  }

  // 复制文本到剪贴板
  async function copyToClipboard(text, button) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代的Clipboard API
        await navigator.clipboard.writeText(text);
        showMessage(button, '复制成功！', 'success');
      } else {
        // 降级到传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          showMessage(button, '复制成功！', 'success');
        } catch (err) {
          console.error('复制失败:', err);
          showMessage(button, '复制失败', 'error');
        } finally {
          textArea.remove();
        }
      }

      console.log('已复制的内容:', text);
    } catch (err) {
      console.error('复制到剪贴板失败:', err);
      showMessage(button, '复制失败', 'error');
    }
  }

  // 显示操作结果消息
  function showMessage(button, message, type) {
    const originalText = button.textContent;
    button.textContent = message;
    button.classList.add(`msg-${type}`);

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove(`msg-${type}`);
    }, 2000);
  }

  // ========== 合并后的全局 MutationObserver（防抖 + 全量扫描）==========

  // 防抖后对全文档做一次全量扫描
  // Angular SPA 路由切换时会复用/更新已有节点而非新增节点，
  // 所以不能只看 addedNodes，需要扫描全部现存元素。
  // 防抖 300ms 保证一次路由变化只触发一次扫描。
  const debouncedScan = debounce(function () {
    scanSolutionContainers(document);
  }, 300);

  const globalObserver = new MutationObserver(function (mutations) {
    // 有任何子节点变化时触发防抖扫描
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        debouncedScan();
        return; // 触发一次防抖即可，后续 mutation 等防抖统一处理
      }
    }
  });

  globalObserver.observe(document.body, { childList: true, subtree: true });

  // 初始扫描：带重试机制（SPA 页面内容可能晚于脚本注入才渲染）
  function initScan() {
    const found = document.querySelectorAll('.solution-choice-container');
    if (found.length > 0) {
      found.forEach(processSolutionContainer);
    } else {
      // 元素尚未渲染，稍后重试
      setTimeout(initScan, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScan);
  } else {
    initScan();
  }
})();
