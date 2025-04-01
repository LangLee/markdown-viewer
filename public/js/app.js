// 显示加载状态
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-overlay';
  loadingDiv.innerHTML = `
      <div class="loading-spinner"></div>
  `;
  document.body.appendChild(loadingDiv);

  return function hideLoading() {
    loadingDiv.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(loadingDiv);
    }, 300);
  };
}
document.addEventListener('DOMContentLoaded', () => {
  const hideLoading = showLoading();
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const sidebar = document.querySelector('.sidebar');

  function handleResize() {
    if (window.innerWidth <= 768) {
      // 移动端逻辑
      mobileMenuButton.style.display = 'block';

      // 如果侧边栏没有状态类，默认关闭
      // if (!sidebar.classList.contains('is-open')) {
      //   sidebar.style.transform = 'translateX(-100%)';
      // }
    } else {
      // PC端逻辑
      mobileMenuButton.style.display = 'none';
      // sidebar.style.transform = 'none';
      sidebar.classList.remove('is-open');
    }
  }

  // 初始化
  handleResize();

  // 菜单按钮点击事件
  mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });

  // 菜单项点击事件（移动端点击后自动关闭）
  document.querySelectorAll('.sidebar-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('is-open');
      }
    });
  });
  window.addEventListener('load', () => {
    // 延迟隐藏以展示加载动画至少1秒
    setTimeout(hideLoading, 1000);
  });
  // 窗口大小改变时重新计算
  window.addEventListener('resize', handleResize);

  // 高亮当前菜单项
  const currentPath = decodeURIComponent(window.location.pathname);
  document.querySelectorAll('.sidebar-menu a').forEach((link) => {
    const linkPath = decodeURIComponent(link.getAttribute('href'));
    if (linkPath === currentPath) {
      link.classList.add('active');
      let parent = link.closest('details');
      while (parent) {
        parent.open = true;
        parent = parent.parentElement.closest('details');
      }
    }
  });
});
