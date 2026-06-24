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
  
    if (!username.trim() || !password.trim()) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none'
      });
      return;
    }
  
    wx.request({
      url: 'http://localhost:5555/api/merchant/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        username: username.trim(),
        password
      },
      success: res => {
        console.log('商家登录返回：', res.data);
  
        if (res.data.code === 0) {
          wx.setStorageSync('merchantLoggedIn', true);
          wx.setStorageSync('merchantToken', res.data.data.token);
  
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
  
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/merchant/merchant'
            });
          }, 800);
        } else {
          wx.showToast({
            title: res.data.message || '账号或密码错误',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('商家登录失败：', err);
  
        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  }
});