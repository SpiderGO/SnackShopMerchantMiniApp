Page({
  data: {
    products: [],

    newProduct: {
      name: '',
      category: '',
      price: '',
      stock: ''
    }
  },

  onShow() {
    const merchantLoggedIn = wx.getStorageSync('merchantLoggedIn') || false;
    const merchantToken = wx.getStorageSync('merchantToken') || '';
  
    if (!merchantLoggedIn || !merchantToken) {
      wx.reLaunch({
        url: '/pages/merchant-login/merchant-login'
      });
      return;
    }
  
    this.loadProducts();
  },

  loadProducts() {
    const token = wx.getStorageSync('merchantToken') || '';
    const { BASE_URL } = require('../../utils/config');

    wx.request({
      url: `${BASE_URL}/api/merchant/products`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: res => {
        console.log('商品管理商品列表：', res.data);
  
        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }
  
        if (res.data.code === 0) {
          const products = res.data.data.map(item => {
            return {
              ...item,
              editStock: String(item.stock)
            };
          });
  
          this.setData({
            products
          });
        } else {
          wx.showToast({
            title: res.data.message || '商品加载失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('商品加载失败：', err);
  
        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  onStockInput(event) {
    const index = event.currentTarget.dataset.index;
    const value = event.detail.value;

    const products = this.data.products;
    products[index].editStock = value;

    this.setData({
      products
    });
  },

  saveStock(event) {
    const index = event.currentTarget.dataset.index;
    const product = this.data.products[index];
    const { BASE_URL } = require('../../utils/config');
    const stock = parseInt(product.editStock, 10);

    if (Number.isNaN(stock) || stock < 0) {
      wx.showToast({
        title: '库存数量不合法',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/products/${product.id}/stock`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        stock
      },
      success: res => {
        console.log('库存更新返回：', res.data);
    
        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }
    
        if (res.data.code === 0) {
          wx.showToast({
            title: '库存已更新',
            icon: 'success'
          });
    
          this.loadProducts();
        } else {
          wx.showToast({
            title: res.data.message || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('库存更新失败：', err);
    
        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  onNewProductInput(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;

    this.setData({
      [`newProduct.${field}`]: value
    });
  },

  createProduct() {
    const { name, category, price, stock } = this.data.newProduct;
    const { BASE_URL } = require('../../utils/config');
    const priceNumber = parseFloat(price);
    const stockNumber = parseInt(stock, 10);

    if (!name.trim() || !category.trim()) {
      wx.showToast({
        title: '请填写商品名称和分类',
        icon: 'none'
      });
      return;
    }

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      wx.showToast({
        title: '价格不合法',
        icon: 'none'
      });
      return;
    }

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      wx.showToast({
        title: '库存不合法',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/merchant/products`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        name: name.trim(),
        category: category.trim(),
        price: priceNumber,
        stock: stockNumber
      },
      success: res => {
        console.log('新增商品返回：', res.data);

        if (res.data.code === 0) {
          wx.showToast({
            title: '商品已新增',
            icon: 'success'
          });

          this.setData({
            newProduct: {
              name: '',
              category: '',
              price: '',
              stock: ''
            }
          });

          this.loadProducts();
        } else {
          wx.showToast({
            title: res.data.message || '新增失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('新增商品失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  toggleEnabled(event) {
    const index = event.currentTarget.dataset.index;
    const product = this.data.products[index];
    const { BASE_URL } = require('../../utils/config');
    const newEnabled = !product.enabled;
  
    wx.request({
      url: `${BASE_URL}/api/products/${product.id}/enabled`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        enabled: newEnabled
      },
      success: res => {
        console.log('上下架更新返回：', res.data);
  
        if (res.data.code === 0) {
          wx.showToast({
            title: newEnabled ? '已上架' : '已下架',
            icon: 'success'
          });
  
          this.loadProducts();
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('上下架失败：', err);
  
        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  handleUnauthorized() {
    wx.removeStorageSync('merchantLoggedIn');
    wx.removeStorageSync('merchantToken');
  
    wx.showToast({
      title: '登录已失效',
      icon: 'none'
    });
  
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/merchant-login/merchant-login'
      });
    }, 800);
  }
});