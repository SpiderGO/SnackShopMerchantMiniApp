# SnackShopMiniApp

乐然便利微信小程序前端原型。

本项目是面向本地便利店线上下单场景的小程序用户端与商家端本地原型，用于验证用户浏览商品、加入购物车、提交订单，以及商家查看订单、接单、完成订单等核心交互流程。

当前版本使用小程序本地缓存模拟数据，尚未接入后端服务。后续将与 C++ 后端工程 `SnackShopServer` 联调，实现真实商品、库存、订单和商家接单流程。

## 项目定位

当前项目为微信小程序前端 MVP 原型。

已完成的本地业务闭环：

```text
用户进入小铺
  ↓
浏览商品
  ↓
加入购物车
  ↓
提交订单
  ↓
订单页查看订单
  ↓
商家端查看订单
  ↓
商家接单 / 完成订单
  ↓
用户端订单状态同步变化
```

## 技术栈

* 微信小程序
* WXML
* WXSS
* JavaScript
* JSON
* 本地缓存

  * `wx.setStorageSync`
  * `wx.getStorageSync`
  * `wx.removeStorageSync`

## 页面结构

```text
SnackShopMiniApp/
├── app.js
├── app.json
├── app.wxss
├── images/
│   └── logo.jpg
├── pages/
│   ├── index/
│   ├── home/
│   ├── cart/
│   ├── orders/
│   ├── mine/
│   └── merchant/
├── utils/
├── project.config.json
├── sitemap.json
├── README.md
└── .gitignore
```

## 页面说明

### index

小程序进入页，展示乐然便利品牌信息和进入小铺按钮。

### home

用户首页，展示门店信息和推荐商品，支持加入购物车。

### cart

购物车页面，支持查看商品、数量增减、清空购物车和提交订单。

### orders

用户订单页面，展示用户已提交订单和订单状态。

### mine

用户中心页面，包含我的订单、商家入口、清除本地缓存和关于信息。

### merchant

商家端订单管理页面，支持查看订单、接单和完成订单。

## 当前功能

* 红色品牌风格欢迎页
* 首页商品列表
* 加入购物车
* 购物车数量增减
* 清空购物车
* 提交订单
* 订单页展示订单
* 我的页面
* 商家入口
* 商家查看订单
* 商家接单
* 商家完成订单
* 用户端订单状态同步

## 当前限制

当前版本为本地原型，存在以下限制：

* 商品数据写在前端代码中
* 购物车数据存储在本地缓存中
* 订单数据存储在本地缓存中
* 没有真实后端服务
* 没有真实数据库
* 没有微信登录
* 没有微信支付
* 没有真实库存扣减
* 不适合直接上线使用

## 后续规划

下一阶段将开发 C++ 后端服务 `SnackShopServer`，实现：

```text
1. 商品接口
2. 购物车接口
3. 订单接口
4. 商家订单管理接口
5. 库存扣减逻辑
6. 数据库持久化
7. 微信小程序接口联调
```

后续小程序将逐步从本地缓存切换为后端接口请求：

```text
wx.getStorageSync / wx.setStorageSync
        ↓
wx.request 调用 C++ 后端 API
```

## 开发说明

本项目建议使用微信开发者工具打开。

开发阶段可以使用本地缓存模拟业务流程。正式联调阶段将通过 `wx.request` 请求后端服务。

## License

This project is currently for learning and prototype validation.
