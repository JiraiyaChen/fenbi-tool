const toggle = document.getElementById('enable-toggle');
const label = document.getElementById('toggle-label');
const statusText = document.getElementById('status-text');

function updateUI(enabled) {
  toggle.checked = enabled;
  label.textContent = enabled ? '插件已开启' : '插件已关闭';
  statusText.textContent = enabled
    ? '复制按钮将自动注入页面'
    : '页面功能已暂停';
}

chrome.storage.local.get({ enabled: true }, function (result) {
  updateUI(result.enabled);
});

toggle.addEventListener('change', function () {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled });
  updateUI(enabled);
});
