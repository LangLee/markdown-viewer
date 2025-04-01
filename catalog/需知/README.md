# markdown 文件查阅

## 简介

markdown 文件查阅器是一个简单的静态 markdown 文件查阅工具，使用 nodejs express 搭建的服务端，读取静态文档目录的方式转化显示成 html 静态文件，进行文件查阅。

## 预览

运行后的效果如下。

![](http://111.229.165.93:3000/file/preview?file=file_1743487786639_image.png)

## 安装

详细说明如何安装和设置项目。

```bash
# 使用 npm 或 yarn 安装依赖
npm install
# 或者
yarn
```

## 启动

需要把自己的 markdown 文件放入到 catalog 目录中，支出文件夹分组。

```bash
catalog
-- 分类1
-- -- 文件1.md
-- 分类2
-- -- 文件2.md
```

启动开发服务器

```bash
# 启动开发服务器
npm run start
# 或者
yarn start
```
