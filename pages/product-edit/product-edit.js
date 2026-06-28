const { BASE_URL } = require('../../utils/config');

Page({
  data: {
    productId: 0,
    product: null,
    categoryOptions: [],

    productForm: {
      name: '',
      category: '',
      price: 0,
      mainImageUrl: ''
    },

    variants: [],

    newVariant: {
      variantName: '',
      price: '',
      stock: '',
      imageUrl: ''
    }
  },

  onLoad(options) {
    const productId = Number(options.id || 0);

    if (!productId) {
      wx.showToast({
        title: '商品ID异常',
        icon: 'none'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 800);

      return;
    }

    this.setData({
      productId
    });
  },

  onShow() {
    this.loadProduct();
  },

  handleUnauthorized() {
    wx.removeStorageSync('merchantLoggedIn');
    wx.removeStorageSync('merchantToken');
    wx.removeStorageSync('merchantUsername');

    wx.showToast({
      title: '登录已失效',
      icon: 'none'
    });

    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/merchant-login/merchant-login'
      });
    }, 800);
  },

  loadProduct() {
    wx.request({
      url: `${BASE_URL}/api/merchant/products`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      success: res => {
        console.log('商品编辑页商品列表：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code !== 0) {
          wx.showToast({
            title: res.data.message || '商品加载失败',
            icon: 'none'
          });
          return;
        }

        const allProducts = res.data.data || [];
        const savedCategories = wx.getStorageSync('merchantCategories') || [];

        const categorySet = new Set(savedCategories);

        allProducts.forEach(item => {
          if (item.category) {
            categorySet.add(item.category);
          }
        });

        const categoryOptions = Array.from(categorySet);

        const product = allProducts.find(item => item.id === this.data.productId);

        if (!product) {
          wx.showToast({
            title: '商品不存在',
            icon: 'none'
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 800);

          return;
        }

        const variants = (product.variants || []).map(variant => ({
          ...variant,
          editVariantName: variant.variantName || '',
          editPrice: String(variant.price),
          editStock: String(variant.stock),
          editImageUrl: variant.imageUrl || ''
        }));

        this.setData({
          product,
          categoryOptions,
          productForm: {
            name: product.name || '',
            category: product.category || '',
            price: product.price || 0,
            mainImageUrl: product.mainImageUrl || product.imageUrl || ''
          },
          variants
        });
      },
      fail: err => {
        console.error('加载商品详情失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  uploadImage(callback) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: chooseRes => {
        const filePath = chooseRes.tempFiles[0].tempFilePath;

        wx.uploadFile({
          url: `${BASE_URL}/api/upload/product-image`,
          filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
          },
          success: uploadRes => {
            console.log('图片上传返回：', uploadRes.data);

            if (uploadRes.statusCode === 401) {
              this.handleUnauthorized();
              return;
            }

            let result = null;

            try {
              result = JSON.parse(uploadRes.data);
            } catch (e) {
              wx.showToast({
                title: '上传返回异常',
                icon: 'none'
              });
              return;
            }

            if (result.code === 0) {
              const imageUrl = result.data.fullUrl || `${BASE_URL}${result.data.url}`;

              callback(imageUrl);

              wx.showToast({
                title: '图片已上传',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.message || '上传失败',
                icon: 'none'
              });
            }
          },
          fail: err => {
            console.error('图片上传失败：', err);

            wx.showToast({
              title: '图片上传失败',
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        console.log('取消选择图片或选择失败：', err);
      }
    });
  },

  uploadProductMainImage() {
    this.uploadImage(imageUrl => {
      this.setData({
        'productForm.mainImageUrl': imageUrl
      });
    });
  },

  uploadVariantImage(event) {
    const variantId = Number(event.currentTarget.dataset.variantId);

    if (!variantId) {
      wx.showToast({
        title: '规格ID异常',
        icon: 'none'
      });
      return;
    }

    this.uploadImage(imageUrl => {
      const variants = this.data.variants.map(item => {
        if (item.id === variantId) {
          return {
            ...item,
            editImageUrl: imageUrl
          };
        }

        return item;
      });

      this.setData({
        variants
      });
    });
  },

  uploadNewVariantImage() {
    this.uploadImage(imageUrl => {
      this.setData({
        'newVariant.imageUrl': imageUrl
      });
    });
  },

  onProductNameInput(event) {
    this.setData({
      'productForm.name': event.detail.value
    });
  },

  onProductCategoryChange(event) {
    const index = Number(event.detail.value);
    const category = this.data.categoryOptions[index];

    if (!category) {
      return;
    }

    this.setData({
      'productForm.category': category
    });
  },

  saveProductBase() {
    const name = this.data.productForm.name.trim();
    const category = this.data.productForm.category.trim();
    const price = Number(this.data.productForm.price || 0);
    const mainImageUrl = this.data.productForm.mainImageUrl.trim();

    if (!name) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      });
      return;
    }

    if (!category) {
      wx.showToast({
        title: '请选择商品分类',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/products/${this.data.productId}`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        name,
        category,
        price,
        mainImageUrl
      },
      success: res => {
        console.log('保存商品基础信息返回：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          wx.showToast({
            title: '商品已保存',
            icon: 'success'
          });

          this.loadProduct();
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('保存商品基础信息失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  onVariantInput(event) {
    const index = event.currentTarget.dataset.index;
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;

    this.setData({
      [`variants[${index}].${field}`]: value
    });
  },

  saveVariant(event) {
    const index = event.currentTarget.dataset.index;
    const variant = this.data.variants[index];

    if (!variant) {
      wx.showToast({
        title: '规格不存在',
        icon: 'none'
      });
      return;
    }

    const variantName = variant.editVariantName.trim();
    const price = Number(variant.editPrice);
    const stock = Number(variant.editStock);
    const imageUrl = variant.editImageUrl.trim();

    if (!variantName) {
      wx.showToast({
        title: '请输入口味名',
        icon: 'none'
      });
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      wx.showToast({
        title: '请输入正确价格',
        icon: 'none'
      });
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      wx.showToast({
        title: '请输入正确库存',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/product-variants/${variant.id}`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        variantName,
        price,
        stock,
        imageUrl
      },
      success: res => {
        console.log('保存口味返回：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          wx.showToast({
            title: '口味已保存',
            icon: 'success'
          });

          this.loadProduct();
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('保存口味失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  toggleVariantEnabled(event) {
    const index = event.currentTarget.dataset.index;
    const variant = this.data.variants[index];

    if (!variant) {
      wx.showToast({
        title: '规格不存在',
        icon: 'none'
      });
      return;
    }

    const nextEnabled = !variant.enabled;

    wx.request({
      url: `${BASE_URL}/api/product-variants/${variant.id}/enabled`,
      method: 'PATCH',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        enabled: nextEnabled
      },
      success: res => {
        console.log('冻结/启用口味返回：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          wx.showToast({
            title: nextEnabled ? '已启用' : '已冻结',
            icon: 'success'
          });

          this.loadProduct();
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('冻结/启用口味失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  },

  onNewVariantInput(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;

    this.setData({
      [`newVariant.${field}`]: value
    });
  },

  createVariant() {
    const variantName = this.data.newVariant.variantName.trim();
    const price = Number(this.data.newVariant.price);
    const stock = Number(this.data.newVariant.stock);
    const imageUrl = this.data.newVariant.imageUrl.trim();

    if (!variantName) {
      wx.showToast({
        title: '请输入口味名',
        icon: 'none'
      });
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      wx.showToast({
        title: '请输入正确价格',
        icon: 'none'
      });
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      wx.showToast({
        title: '请输入正确库存',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/products/${this.data.productId}/variants`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        variantName,
        price,
        stock,
        imageUrl
      },
      success: res => {
        console.log('新增口味返回：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          wx.showToast({
            title: '口味已新增',
            icon: 'success'
          });

          this.setData({
            newVariant: {
              variantName: '',
              price: '',
              stock: '',
              imageUrl: ''
            }
          });

          this.loadProduct();
        } else {
          wx.showToast({
            title: res.data.message || '新增失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('新增口味失败：', err);

        wx.showToast({
          title: '无法连接后端',
          icon: 'none'
        });
      }
    });
  }
});