Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(event) {
    this.setData({
      username: event.detail.value
    });
  },

  onPasswordInput(event) {
    this.setData({
      password: event.detail.value
    });
  },

  login() {
    const { username, password } = this.data;

    if (username === 'merchant' && password === '123456') {
      wx.setStorageSync('merchantLoggedIn', true);

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/merchant/merchant'
        });
      }, 800);

      return;
    }

    wx.showToast({
      title: '账号或密码错误',
      icon: 'none'
    });
  }
});