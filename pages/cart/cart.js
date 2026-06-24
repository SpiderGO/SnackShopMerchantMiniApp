Page({
  data: {
    cartItems: [],
    totalAmount: '0.00'
  },

  onShow() {
    this.loadCart();
  },

  loadCart() {
    const cartItems = wx.getStorageSync('cartItems') || [];

    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    this.setData({
      cartItems,
      totalAmount: total.toFixed(2)
    });
  },

  increase(event) {
    const productId = event.currentTarget.dataset.id;
    const cartItems = this.data.cartItems.map(item => {
      if (item.id === productId) {
        if (item.quantity >= item.stock) {
          wx.showToast({
            title: '库存不足',
            icon: 'none'
          });
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1
        };
      }

      return item;
    });

    wx.setStorageSync('cartItems', cartItems);
    this.loadCart();
  },

  decrease(event) {
    const productId = event.currentTarget.dataset.id;

    let cartItems = this.data.cartItems.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          quantity: item.quantity - 1
        };
      }

      return item;
    });

    cartItems = cartItems.filter(item => item.quantity > 0);

    wx.setStorageSync('cartItems', cartItems);
    this.loadCart();
  },

  clearCart() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('cartItems');
          this.loadCart();
        }
      }
    });
  },

  goSubmit() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      });
      return;
    }
  
    wx.showModal({
      title: '确认提交订单',
      content: `本次合计 ￥${this.data.totalAmount}，确认提交吗？`,
      success: res => {
        if (!res.confirm) {
          return;
        }
  
        const orderItems = this.data.cartItems.map(item => {
          return {
            id: item.id,
            quantity: item.quantity
          };
        });
  
        wx.request({
          url: 'http://localhost:5555/api/orders',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            items: orderItems,
            pickupType: '到店自提'
          },
          success: res => {
            console.log('创建订单接口返回：', res.data);
  
            if (res.data.code === 0) {
              wx.removeStorageSync('cartItems');
              this.loadCart();
  
              wx.showToast({
                title: '订单已提交',
                icon: 'success'
              });
  
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/orders/orders'
                });
              }, 800);
            } else {
              wx.showToast({
                title: res.data.message || '提交失败',
                icon: 'none'
              });
            }
          },
          fail: err => {
            console.error('创建订单失败：', err);
  
            wx.showToast({
              title: '无法连接后端',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  
  formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});