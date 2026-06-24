Page({
  data: {
    products: []
  },

  onShow() {
    this.loadProducts();
  },

  loadProducts() {
    wx.request({
      url: 'http://localhost:5555/api/products',
      method: 'GET',
      success: res => {
        console.log('商品接口返回：', res.data);

        if (res.data.code === 0) {
          this.setData({
            products: res.data.data
          });
        } else {
          wx.showToast({
            title: '商品加载失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('请求商品接口失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  addToCart(event) {
    const productId = event.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);

    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      });
      return;
    }

    const cartItems = wx.getStorageSync('cartItems') || [];
    const index = cartItems.findIndex(item => item.id === product.id);

    if (index >= 0) {
      if (cartItems[index].quantity >= product.stock) {
        wx.showToast({
          title: '库存不足',
          icon: 'none'
        });
        return;
      }

      cartItems[index].quantity += 1;
    } else {
      cartItems.push({
        ...product,
        quantity: 1
      });
    }

    wx.setStorageSync('cartItems', cartItems);

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  }
});