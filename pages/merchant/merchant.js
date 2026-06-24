Page({
  data: {
    orders: []
  },

  onShow() {
    const merchantLoggedIn = wx.getStorageSync('merchantLoggedIn') || false;
  
    if (!merchantLoggedIn) {
      wx.reLaunch({
        url: '/pages/merchant-login/merchant-login'
      });
      return;
    }
  
    this.loadOrders();
  },

  loadOrders() {
    wx.request({
      url: 'http://localhost:5555/api/orders',
      method: 'GET',
      success: res => {
        console.log('商家订单接口返回：', res.data);

        if (res.data.code === 0) {
          this.setData({
            orders: res.data.data
          });
        } else {
          wx.showToast({
            title: '订单加载失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('请求商家订单失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  acceptOrder(event) {
    const orderId = event.currentTarget.dataset.id;
    this.updateOrderStatus(orderId, '已接单');
  },

  completeOrder(event) {
    const orderId = event.currentTarget.dataset.id;
    this.updateOrderStatus(orderId, '已完成');
  },

  updateOrderStatus(orderId, status) {
    wx.request({
      url: `http://localhost:5555/api/orders/${orderId}/status`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        status
      },
      success: res => {
        console.log('更新订单状态返回：', res.data);

        if (res.data.code === 0) {
          wx.showToast({
            title: '状态已更新',
            icon: 'success'
          });

          this.loadOrders();
        } else {
          wx.showToast({
            title: res.data.message || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('更新订单状态失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  }
});