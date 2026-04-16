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

  // ====== 删除 header-title 元素 ======

  function removeHeaderTitles() {
    document.querySelectorAll('.header-title').forEach((el) => el.remove());
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
    removeHeaderTitles();
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
    removeHeaderTitles();
    const found = document.querySelectorAll('.solution-choice-container');
    if (found.length > 0) {
      found.forEach(processSolutionContainer);
    } else {
      // 元素尚未渲染，稍后重试
      setTimeout(initScan, 800);
    }
  }

  // ====== 画笔功能 ======

  let _drawCanvas = null;
  let _drawCtx = null;
  let _drawActive = false;
  let _painting = false;
  let _lastPX = 0;
  let _lastPY = 0;
  let _penColor = '#ff0000';
  let _penSize = 4;
  let _eraserMode = false;

  function initDrawingFeature() {
    if (document.getElementById('fenbi-draw-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'fenbi-draw-bar';
    bar.innerHTML =
      '<button id="fenbi-draw-toggle" title="开启/关闭画笔模式">✏️ 画笔</button>' +
      '<div id="fenbi-draw-tools">' +
      '<input type="color" id="fenbi-pen-color" value="#ff0000" title="画笔颜色" />' +
      '<input type="range" id="fenbi-pen-size" min="1" max="30" value="4" title="画笔大小" />' +
      '<button id="fenbi-eraser-btn" title="橡皮擦">橡皮</button>' +
      '<button id="fenbi-clear-btn" title="清除所有标注">清除</button>' +
      '</div>';
    document.body.appendChild(bar);

    document
      .getElementById('fenbi-draw-toggle')
      .addEventListener('click', function () {
        _drawActive = !_drawActive;
        this.classList.toggle('fenbi-active', _drawActive);
        document.getElementById('fenbi-draw-tools').style.display = _drawActive
          ? 'flex'
          : 'none';
        ensureDrawCanvas();
        _drawCanvas.style.pointerEvents = _drawActive ? 'all' : 'none';
      });

    document
      .getElementById('fenbi-pen-color')
      .addEventListener('input', function (e) {
        _penColor = e.target.value;
        _eraserMode = false;
        document
          .getElementById('fenbi-eraser-btn')
          .classList.remove('fenbi-active');
      });

    document
      .getElementById('fenbi-pen-size')
      .addEventListener('input', function (e) {
        _penSize = parseInt(e.target.value, 10);
      });

    document
      .getElementById('fenbi-eraser-btn')
      .addEventListener('click', function () {
        _eraserMode = !_eraserMode;
        this.classList.toggle('fenbi-active', _eraserMode);
      });

    document
      .getElementById('fenbi-clear-btn')
      .addEventListener('click', function () {
        if (_drawCtx && _drawCanvas) {
          _drawCtx.clearRect(0, 0, _drawCanvas.width, _drawCanvas.height);
        }
      });
  }

  function ensureDrawCanvas() {
    if (_drawCanvas) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'fenbi-draw-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    _drawCtx = canvas.getContext('2d');
    _drawCanvas = canvas;

    canvas.addEventListener('mousedown', function (e) {
      _painting = true;
      _lastPX = e.offsetX;
      _lastPY = e.offsetY;
      _drawCtx.beginPath();
      _drawCtx.arc(
        _lastPX,
        _lastPY,
        Math.max(1, (_eraserMode ? _penSize * 3 : _penSize) / 2),
        0,
        Math.PI * 2
      );
      _drawCtx.globalCompositeOperation = _eraserMode
        ? 'destination-out'
        : 'source-over';
      _drawCtx.fillStyle = _eraserMode ? 'rgba(0,0,0,1)' : _penColor;
      _drawCtx.fill();
    });

    canvas.addEventListener('mousemove', function (e) {
      if (!_painting) return;
      _drawCtx.beginPath();
      _drawCtx.moveTo(_lastPX, _lastPY);
      _drawCtx.lineTo(e.offsetX, e.offsetY);
      _drawCtx.globalCompositeOperation = _eraserMode
        ? 'destination-out'
        : 'source-over';
      _drawCtx.lineWidth = _eraserMode ? _penSize * 3 : _penSize;
      _drawCtx.strokeStyle = _eraserMode ? 'rgba(0,0,0,1)' : _penColor;
      _drawCtx.lineCap = 'round';
      _drawCtx.lineJoin = 'round';
      _drawCtx.stroke();
      _lastPX = e.offsetX;
      _lastPY = e.offsetY;
    });

    canvas.addEventListener('mouseup', function () {
      _painting = false;
    });
    canvas.addEventListener('mouseleave', function () {
      _painting = false;
    });

    window.addEventListener('resize', function () {
      if (!_drawCanvas || !_drawCtx) return;
      const saved = _drawCtx.getImageData(
        0,
        0,
        _drawCanvas.width,
        _drawCanvas.height
      );
      _drawCanvas.width = window.innerWidth;
      _drawCanvas.height = window.innerHeight;
      _drawCtx.putImageData(saved, 0, 0);
    });
  }

  // ====== 初始化 ======

  initDrawingFeature();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScan);
  } else {
    initScan();
  }
})();
