Page({
  data: {
    orders: []
  },

  onShow() {
    this.loadOrders();
  },

  loadOrders() {
    wx.request({
      url: 'http://localhost:5555/api/orders',
      method: 'GET',
      success: res => {
        console.log('订单接口返回：', res.data);

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
        console.error('请求订单接口失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  }
});