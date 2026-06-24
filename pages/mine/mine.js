Page({
  data: {
    merchantLoggedIn: false
  },

  onShow() {
    const merchantLoggedIn = wx.getStorageSync('merchantLoggedIn') || false;

    this.setData({
      merchantLoggedIn
    });
  },

  goOrders() {
    wx.switchTab({
      url: '/pages/orders/orders'
    });
  },

  goMerchantLogin() {
    wx.navigateTo({
      url: '/pages/merchant-login/merchant-login'
    });
  },

  goMerchant() {
    if (!this.data.merchantLoggedIn) {
      wx.showToast({
        title: '请先商家登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/merchant/merchant'
    });
  },

  goMerchantProducts() {
    if (!this.data.merchantLoggedIn) {
      wx.showToast({
        title: '请先商家登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/merchant-products/merchant-products'
    });
  },

  logoutMerchant() {
    wx.removeStorageSync('merchantLoggedIn');

    this.setData({
      merchantLoggedIn: false
    });

    wx.showToast({
      title: '已退出商家登录',
      icon: 'success'
    });
  },

  clearLocalData() {
    wx.showModal({
      title: '确认清除',
      content: '将清空本地购物车缓存，仅用于开发调试，确定继续吗？',
      success: res => {
        if (!res.confirm) {
          return;
        }

        wx.removeStorageSync('cartItems');

        wx.showToast({
          title: '已清除',
          icon: 'success'
        });
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于乐然便利',
      content: '乐然便利线上小铺，当前版本已接入 C++ 后端与 SQLite 数据库。',
      showCancel: false
    });
  }
});