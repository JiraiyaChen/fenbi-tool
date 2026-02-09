// 复制选择题内容的Chrome扩展脚本

(function () {
  'use strict';

  // 等待DOM完全加载
  function waitForElements() {
    const solutionContainers = document.querySelectorAll(
      '.solution-choice-container'
    );

    if (solutionContainers.length > 0) {
      solutionContainers.forEach((container) => {
        // 为每个solution-choice-container找到对应的app-format-html和app-choice-radio
        const formatContainer = findCorrespondingFormatContainer(container);
        const choiceContainer = findCorrespondingChoiceContainer(container);

        if (formatContainer && choiceContainer) {
          addCopyButton(container, formatContainer, choiceContainer);
        }
      });
    } else {
      // 如果元素还没有加载，等待一段时间后重试
      setTimeout(waitForElements, 1000);
    }
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

  // 监听DOM变化，以处理动态加载的内容
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        waitForElements();
      }
    });
  });

  // 开始观察DOM变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 初始检查
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements);
  } else {
    waitForElements();
  }

  // ========== 视频地址显示和迅雷下载功能 ==========

  // 查找页面上的所有app-result-common标签
  function findVideoElements() {
    // 处理app-result-common元素
    const resultCommons = document.querySelectorAll('app-result-common');
    resultCommons.forEach((common) => {
      processResultCommon(common);
    });
  }

  // 处理app-result-common元素
  function processResultCommon(resultCommon) {
    // 检查是否已经处理过
    if (resultCommon.dataset.resultCommonProcessed) {
      return;
    }
    resultCommon.dataset.resultCommonProcessed = 'true';

    console.log('发现app-result-common元素，开始监听video-player...');

    // 查找所有video-player元素
    const videoPlayers = resultCommon.querySelectorAll('.video-player');
    videoPlayers.forEach((player) => {
      processVideoPlayer(player);
    });

    // 监听resultCommon内部的变化，检测新的video-player
    const commonObserver = new MutationObserver(function (mutations) {
      const players = resultCommon.querySelectorAll('.video-player');
      players.forEach((player) => {
        processVideoPlayer(player);
      });
    });

    commonObserver.observe(resultCommon, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // 处理video-player元素
  function processVideoPlayer(videoPlayer) {
    // 检查是否已经处理过
    if (videoPlayer.dataset.videoPlayerProcessed) {
      return;
    }
    videoPlayer.dataset.videoPlayerProcessed = 'true';

    console.log('发现video-player元素，开始监听video标签...');

    // 监听video-player内部的变化，检测video标签的生成
    const playerObserver = new MutationObserver(function (mutations) {
      const video = videoPlayer.querySelector('video');
      if (video && !video.dataset.videoControlsAdded) {
        console.log('检测到video标签已生成在video-player中');
        // 等待视频加载元数据
        if (video.readyState >= 1) {
          addVideoControls(video);
        } else {
          video.addEventListener('loadedmetadata', function () {
            addVideoControls(video);
          });
          video.addEventListener('loadeddata', function () {
            addVideoControls(video);
          });
        }
      }
    });

    playerObserver.observe(videoPlayer, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // 检查是否已经有video标签
    const existingVideo = videoPlayer.querySelector('video');
    if (existingVideo) {
      console.log('video-player中已存在video标签');
      if (existingVideo.readyState >= 1) {
        addVideoControls(existingVideo);
      } else {
        existingVideo.addEventListener('loadedmetadata', function () {
          addVideoControls(existingVideo);
        });
        existingVideo.addEventListener('loadeddata', function () {
          addVideoControls(existingVideo);
        });
      }
    }
  }

  // 为视频添加控制面板
  function addVideoControls(videoElement) {
    // 检查是否已经添加过控制面板
    if (videoElement.dataset.videoControlsAdded) {
      return;
    }
    videoElement.dataset.videoControlsAdded = 'true';

    // 尝试获取视频地址，如果还没准备好就等待
    const tryAddPanel = () => {
      let videoUrl = getVideoUrl(videoElement);

      if (!videoUrl) {
        console.log('视频URL暂时不可用，等待中...');
        return false;
      }

      // 创建控制面板容器
      const controlPanel = document.createElement('div');
      controlPanel.className = 'video-control-panel';

      // 创建视频地址显示框
      const urlDisplay = document.createElement('div');
      urlDisplay.className = 'video-url-display';

      const urlLabel = document.createElement('span');
      urlLabel.textContent = '视频地址: ';
      urlLabel.style.fontWeight = 'bold';

      const urlText = document.createElement('input');
      urlText.type = 'text';
      urlText.value = videoUrl;
      urlText.readOnly = true;
      urlText.className = 'video-url-input';

      urlDisplay.appendChild(urlLabel);
      urlDisplay.appendChild(urlText);

      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'video-button-container';

      // 创建复制地址按钮
      const copyUrlButton = document.createElement('button');
      copyUrlButton.className = 'video-action-btn copy-url-btn';
      copyUrlButton.textContent = '复制地址';
      copyUrlButton.onclick = function () {
        copyVideoUrl(videoUrl, copyUrlButton);
      };

      // 创建迅雷下载按钮
      const thunderButton = document.createElement('button');
      thunderButton.className = 'video-action-btn thunder-btn';
      thunderButton.innerHTML = '⚡ 迅雷下载';
      thunderButton.onclick = function () {
        downloadWithThunder(videoUrl, thunderButton);
      };

      buttonContainer.appendChild(copyUrlButton);
      buttonContainer.appendChild(thunderButton);

      controlPanel.appendChild(urlDisplay);
      controlPanel.appendChild(buttonContainer);

      // 将控制面板悬浮显示在视频旁边
      document.body.appendChild(controlPanel);

      // 计算并设置面板位置（放在视频右侧）
      const updatePanelPosition = () => {
        const rect = videoElement.getBoundingClientRect();
        const panelWidth = 350; // 固定面板宽度

        // 尝试放在视频右侧，如果空间不够则放在下方
        const spaceOnRight = window.innerWidth - (rect.right + window.scrollX);

        if (spaceOnRight >= panelWidth + 20) {
          // 右侧有足够空间
          controlPanel.style.top = `${rect.top + window.scrollY}px`;
          controlPanel.style.left = `${rect.right + window.scrollX + 10}px`;
          controlPanel.style.width = `${panelWidth}px`;
        } else {
          // 右侧空间不足，放在视频下方
          controlPanel.style.top = `${rect.bottom + window.scrollY + 10}px`;
          controlPanel.style.left = `${rect.left + window.scrollX}px`;
          controlPanel.style.width = `${Math.min(rect.width, panelWidth)}px`;
        }
      };

      // 初始定位
      updatePanelPosition();

      // 监听滚动和窗口大小变化
      window.addEventListener('scroll', updatePanelPosition);
      window.addEventListener('resize', updatePanelPosition);

      // 当视频元素被移除时，也移除控制面板
      const checkVideoExists = setInterval(() => {
        if (!document.body.contains(videoElement)) {
          controlPanel.remove();
          clearInterval(checkVideoExists);
        }
      }, 1000);

      console.log('视频控制面板已添加，视频地址:', videoUrl);
      return true;
    };

    // 尝试立即添加
    if (!tryAddPanel()) {
      // 如果失败，监听视频事件
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'playing'];
      events.forEach((event) => {
        videoElement.addEventListener(
          event,
          function () {
            tryAddPanel();
          },
          { once: true }
        );
      });

      // 设置超时重试
      let retryCount = 0;
      const retryInterval = setInterval(() => {
        if (tryAddPanel() || retryCount++ > 10) {
          clearInterval(retryInterval);
        }
      }, 500);
    }
  }

  // 获取视频URL
  function getVideoUrl(videoElement) {
    // 尝试从src属性获取
    if (videoElement.src && !videoElement.src.startsWith('blob:')) {
      return videoElement.src;
    }

    // 尝试从source标签获取
    const sources = videoElement.querySelectorAll('source');
    for (let source of sources) {
      if (source.src && !source.src.startsWith('blob:')) {
        return source.src;
      }
    }

    // 尝试从currentSrc获取
    if (
      videoElement.currentSrc &&
      !videoElement.currentSrc.startsWith('blob:')
    ) {
      return videoElement.currentSrc;
    }

    return null;
  }

  // 复制视频URL到剪贴板
  async function copyVideoUrl(url, button) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showVideoMessage(button, '✓ 已复制', 'success');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        showVideoMessage(button, '✓ 已复制', 'success');
      }
      console.log('已复制视频地址:', url);
    } catch (err) {
      console.error('复制失败:', err);
      showVideoMessage(button, '✗ 复制失败', 'error');
    }
  }

  // 使用迅雷下载
  function downloadWithThunder(url, button) {
    try {
      // 将URL转换为迅雷专用链接
      const thunderUrl = 'thunder://' + btoa('AA' + url + 'ZZ');

      // 创建一个隐藏的链接并点击
      const link = document.createElement('a');
      link.href = thunderUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showVideoMessage(button, '✓ 已调用迅雷', 'success');
      console.log('已调用迅雷下载:', url);
    } catch (err) {
      console.error('调用迅雷失败:', err);
      showVideoMessage(button, '✗ 调用失败', 'error');
    }
  }

  // 显示视频操作消息
  function showVideoMessage(button, message, type) {
    const originalText = button.innerHTML;
    button.innerHTML = message;
    button.classList.add(`msg-${type}`);

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove(`msg-${type}`);
    }, 2000);
  }

  // 监听DOM变化以检测app-result-common元素
  const videoObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // 元素节点
            // 检查是否是app-result-common
            if (node.tagName === 'APP-RESULT-COMMON') {
              processResultCommon(node);
            }
            // 检查子元素中是否有app-result-common
            if (node.querySelectorAll) {
              node
                .querySelectorAll('app-result-common')
                .forEach(processResultCommon);
            }
          }
        });
      }
    });
  });

  // 开始观察DOM变化
  videoObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 初始检查
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findVideoElements);
  } else {
    findVideoElements();
  }

  // 定期检查新视频（处理动态加载的情况）
  setInterval(findVideoElements, 2000);
})();
