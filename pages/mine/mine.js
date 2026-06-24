const { BASE_URL } = require('../../utils/config');

Page({
  data: {
    username: ''
  },

  onShow() {
    const merchantLoggedIn = wx.getStorageSync('merchantLoggedIn') || false;
    const merchantToken = wx.getStorageSync('merchantToken') || '';
    const merchantUsername = wx.getStorageSync('merchantUsername') || '商家用户';

    if (!merchantLoggedIn || !merchantToken) {
      wx.reLaunch({
        url: '/pages/merchant-login/merchant-login'
      });
      return;
    }

    this.setData({
      username: merchantUsername
    });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录商家账号，确认退出吗？',
      success: res => {
        if (!res.confirm) return;

        const token = wx.getStorageSync('merchantToken') || '';

        wx.request({
          url: `${BASE_URL}/api/merchant/logout`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: res => {
            console.log('商家退出登录返回：', res.data);

            wx.removeStorageSync('merchantLoggedIn');
            wx.removeStorageSync('merchantToken');
            wx.removeStorageSync('merchantUsername');

            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });

            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/merchant-login/merchant-login'
              });
            }, 800);
          },
          fail: err => {
            console.error('商家退出登录失败：', err);

            wx.removeStorageSync('merchantLoggedIn');
            wx.removeStorageSync('merchantToken');
            wx.removeStorageSync('merchantUsername');

            wx.showToast({
              title: '本地已退出',
              icon: 'none'
            });

            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/merchant-login/merchant-login'
              });
            }, 800);
          }
        });
      }
    });
  }
});