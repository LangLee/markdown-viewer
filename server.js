const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const app = express();

// 配置
const BASE_DIR = path.join(__dirname, 'catalog');
const PUBLIC_DIR = path.join(__dirname, 'public');

// 设置Markdown渲染
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: (code) => require('highlight.js').highlightAuto(code).value,
});

// 静态文件服务
app.use(express.static(PUBLIC_DIR));

// 模板引擎辅助函数
function renderTemplate(template, data) {
  let html = fs.readFileSync(
    path.join(PUBLIC_DIR, 'templates', template),
    'utf8'
  );

  // 简单的模板替换
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // 处理循环
  html = html.replace(
    /\{\{#each (.+?)\}\}([\s\S]+?)\{\{\/each\}\}/g,
    (match, itemsKey, content) => {
      const items = data[itemsKey] || [];
      return items
        .map((item) => {
          let itemContent = content;
          for (const [key, value] of Object.entries(item)) {
            itemContent = itemContent.replace(
              new RegExp(`{{${key}}}`, 'g'),
              value
            );
          }
          // 处理条件语句
          itemContent = itemContent.replace(
            /\{\{#if \((.+?)\)\}\}([\s\S]+?)\{\{\/if\}\}/g,
            (m, condition, ifContent) => {
              return eval(`item.${condition}`) ? ifContent : '';
            }
          );
          return itemContent;
        })
        .join('');
    }
  );

  return html;
}
// 获取目录结构
function getDirectoryStructure(dir, basePath = '') {
  const items = fs.readdirSync(dir);
  const result = [];

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    const relativePath = path.join(basePath, item);

    if (stats.isDirectory()) {
      result.push({
        name: item,
        path: relativePath,
        type: 'directory',
        url: `/${encodeURIComponent(relativePath)}`, // 添加URL编码
        children: getDirectoryStructure(fullPath, relativePath),
      });
    } else if (path.extname(item).toLowerCase() === '.md') {
      result.push({
        name: item.replace('.md', ''),
        path: relativePath,
        type: 'file',
        url: `/${encodeURIComponent(relativePath.replace('.md', ''))}`, // 移除扩展名并编码
      });
    }
  });

  return result;
}

// 生成侧边栏HTML
function generateSidebar(structure, currentPath = '') {
  let html = '<ul class="sidebar-menu">';

  structure.forEach((item) => {
    const isActive = currentPath === item.url;
    const activeClass = isActive ? 'active' : '';

    if (item.type === 'directory') {
      html += `
        <li class="directory ${activeClass}">
          <details ${isActive ? 'open' : ''}>
            <summary>📁 ${item.name}</summary>
            ${generateSidebar(item.children, currentPath)}
          </details>
        </li>
      `;
    } else {
      html += `
        <li class="file ${activeClass}">
          <a href="${item.url}">📄 ${item.name}</a>
        </li>
      `;
    }
  });

  html += '</ul>';
  return html;
}
// 主路由处理
app.get('*', (req, res) => {
  try {
    const requestedPath = req.path === '/' ? '' : decodeURIComponent(req.path);
    let fullPath = path.join(BASE_DIR, requestedPath);

    // 调试日志
    console.log('Requested:', requestedPath);
    console.log('Full path:', fullPath);

    // 尝试添加.md扩展名
    if (!fs.existsSync(fullPath) && !path.extname(fullPath)) {
      const mdPath = `${fullPath}.md`;
      if (fs.existsSync(mdPath)) {
        fullPath = mdPath;
        console.log('Resolved to:', fullPath);
      }
    }

    // 检查路径是否存在
    if (!fs.existsSync(fullPath)) {
      console.error('Path not found:', fullPath);
      return res.status(404).send(
        renderTemplate('base.html', {
          title: '404 Not Found',
          sidebar: generateSidebar(
            getDirectoryStructure(BASE_DIR),
            requestedPath
          ),
          content: `
          <div class="p-6 bg-white rounded-lg shadow">
            <h1 class="text-2xl font-bold text-red-600 mb-4">404 Not Found</h1>
            <p class="mb-2">请求路径: <code>${requestedPath}</code></p>
            <p class="mb-2">解析路径: <code>${fullPath}</code></p>
            <p>请检查文件是否存在或路径是否正确</p>
          </div>
        `,
        })
      );
    }

    // 获取目录结构
    const structure = getDirectoryStructure(BASE_DIR);
    const sidebar = generateSidebar(structure, requestedPath);

    // 处理目录
    if (fs.statSync(fullPath).isDirectory()) {
      const items = fs
        .readdirSync(fullPath)
        .map((item) => {
          const itemPath = path.join(fullPath, item);
          const stats = fs.statSync(itemPath);
          const url = path.join(requestedPath, item);

          return {
            name: stats.isDirectory() ? item : item.replace('.md', ''),
            type: stats.isDirectory() ? 'directory' : 'file',
            url: stats.isDirectory() ? `/${url}` : `/${url.replace('.md', '')}`,
          };
        })
        .filter(
          (item) => item.type === 'directory' || item.url.endsWith('.md')
        );

      return res.send(
        renderTemplate('base.html', {
          title: `Directory: ${requestedPath || '/'}`,
          sidebar,
          content: fs.readFileSync(
            path.join(PUBLIC_DIR, 'templates/directory.html'),
            'utf8'
          ),
        })
      );
    }

    // 处理Markdown文件
    if (path.extname(fullPath).toLowerCase() === '.md') {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const htmlContent = marked.parse(fileContent);

      return res.send(
        renderTemplate('base.html', {
          title: path.basename(fullPath, '.md'),
          sidebar,
          content: renderTemplate('markdown.html', {
            content: htmlContent,
          }),
        })
      );
    }

    res.status(400).send('Invalid file type');
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).send(
      renderTemplate('base.html', {
        title: 'Server Error',
        sidebar: generateSidebar(getDirectoryStructure(BASE_DIR), ''),
        content: `
        <div class="p-6 bg-white rounded-lg shadow">
          <h1 class="text-2xl font-bold text-red-600">500 Server Error</h1>
          <pre class="mt-4 p-4 bg-gray-100 rounded">${error.stack}</pre>
        </div>
      `,
      })
    );
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving files from ${BASE_DIR}`);
});
