const { BASE_URL } = require('../../utils/config');

Page({
  data: {
    products: [],
    categories: [],
    categoryOptions: [],
    selectedCategory: '全部',
    filteredProducts: [],
    newCategoryName: '',

    categoryActionVisible: false,
    actionCategory: '',

    renameCategoryVisible: false,
    renameOldCategory: '',
    renameNewCategory: '',

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

  loadSavedCategories() {
    return wx.getStorageSync('merchantCategories') || [];
  },

  saveCategories(categories) {
    wx.setStorageSync('merchantCategories', categories);
  },

  buildCategories(products) {
    const savedCategories = this.loadSavedCategories();
    const categorySet = new Set(savedCategories);

    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });

    const categoryOptions = Array.from(categorySet);

    return {
      categories: ['全部', ...categoryOptions],
      categoryOptions
    };
  },

  refreshProductFilter() {
    const { products, selectedCategory } = this.data;

    let filteredProducts = products;

    if (selectedCategory !== '全部') {
      filteredProducts = products.filter(item => item.category === selectedCategory);
    }

    this.setData({
      filteredProducts
    });
  },

  loadProducts() {
    wx.request({
      url: `${BASE_URL}/api/merchant/products`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      success: res => {
        console.log('商品管理商品列表：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          const products = res.data.data.map(item => ({
            ...item
          }));

          const { categories, categoryOptions } = this.buildCategories(products);

          let selectedCategory = this.data.selectedCategory || '全部';

          if (!categories.includes(selectedCategory)) {
            selectedCategory = '全部';
          }

          this.setData({
            products,
            categories,
            categoryOptions,
            selectedCategory
          }, () => {
            this.refreshProductFilter();
          });
        } else {
          wx.showToast({
            title: '商品加载失败',
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

  selectProductCategory(event) {
    const category = event.currentTarget.dataset.category;

    this.setData({
      selectedCategory: category
    }, () => {
      this.refreshProductFilter();
    });
  },

  onNewCategoryInput(event) {
    this.setData({
      newCategoryName: event.detail.value
    });
  },

  createCategory() {
    const categoryName = this.data.newCategoryName.trim();

    if (!categoryName) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    const savedCategories = this.loadSavedCategories();

    if (this.data.categoryOptions.includes(categoryName)) {
      wx.showToast({
        title: '分类已存在',
        icon: 'none'
      });
      return;
    }

    const nextCategories = [...savedCategories, categoryName];

    this.saveCategories(nextCategories);

    const { categories, categoryOptions } = this.buildCategories(this.data.products);

    this.setData({
      categories,
      categoryOptions,
      selectedCategory: categoryName,
      newCategoryName: '',
      'newProduct.category': categoryName
    }, () => {
      this.refreshProductFilter();
    });

    wx.showToast({
      title: '分类已新增',
      icon: 'success'
    });
  },

  openCategoryAction(event) {
    const category = event.currentTarget.dataset.category;

    this.setData({
      categoryActionVisible: true,
      actionCategory: category
    });
  },

  closeCategoryAction() {
    this.setData({
      categoryActionVisible: false,
      actionCategory: ''
    });
  },

  openRenameCategory() {
    const category = this.data.actionCategory;

    if (!category) {
      return;
    }

    this.setData({
      categoryActionVisible: false,
      renameCategoryVisible: true,
      renameOldCategory: category,
      renameNewCategory: category
    });
  },

  closeRenameCategory() {
    this.setData({
      renameCategoryVisible: false,
      renameOldCategory: '',
      renameNewCategory: ''
    });
  },

  onRenameCategoryInput(event) {
    this.setData({
      renameNewCategory: event.detail.value
    });
  },

  submitRenameCategory() {
    const oldCategory = this.data.renameOldCategory;
    const newCategory = this.data.renameNewCategory.trim();

    if (!oldCategory || !newCategory) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    if (oldCategory === newCategory) {
      this.closeRenameCategory();
      return;
    }

    if (this.data.categoryOptions.includes(newCategory)) {
      wx.showToast({
        title: '分类已存在',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认修改分类',
      content: `将「${oldCategory}」修改为「${newCategory}」，该分类下的商品也会同步修改，确认继续吗？`,
      success: res => {
        if (!res.confirm) return;

        this.renameCategoryProducts(oldCategory, newCategory);
      }
    });
  },

  renameCategoryProducts(oldCategory, newCategory) {
    const productsToUpdate = this.data.products.filter(
      item => item.category === oldCategory
    );

    const token = wx.getStorageSync('merchantToken') || '';

    const finishRename = () => {
      const savedCategories = this.loadSavedCategories();

      let nextCategories = savedCategories.map(item => {
        if (item === oldCategory) {
          return newCategory;
        }

        return item;
      });

      nextCategories = nextCategories.filter(item => item !== oldCategory);

      if (!nextCategories.includes(newCategory)) {
        nextCategories.push(newCategory);
      }

      this.saveCategories(nextCategories);

      this.setData({
        selectedCategory: newCategory,
        'newProduct.category': newCategory
      });

      this.closeRenameCategory();
      this.loadProducts();

      wx.showToast({
        title: '分类已修改',
        icon: 'success'
      });
    };

    if (productsToUpdate.length === 0) {
      finishRename();
      return;
    }

    const updateOne = index => {
      if (index >= productsToUpdate.length) {
        finishRename();
        return;
      }

      const product = productsToUpdate[index];

      wx.request({
        url: `${BASE_URL}/api/products/${product.id}`,
        method: 'PATCH',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {
          name: product.name,
          category: newCategory,
          price: product.price
        },
        success: res => {
          if (res.statusCode === 401) {
            this.handleUnauthorized();
            return;
          }

          if (res.data.code !== 0) {
            wx.showToast({
              title: res.data.message || '修改失败',
              icon: 'none'
            });
            return;
          }

          updateOne(index + 1);
        },
        fail: err => {
          console.error('修改分类失败：', err);

          wx.showToast({
            title: '无法连接后端',
            icon: 'none'
          });
        }
      });
    };

    updateOne(0);
  },

  deleteCategoryFromAction() {
    const category = this.data.actionCategory;

    if (!category) {
      return;
    }

    this.setData({
      categoryActionVisible: false
    });

    this.deleteCategoryByName(category);
  },

  deleteCategoryByName(category) {
    const hasProduct = this.data.products.some(item => item.category === category);

    if (hasProduct) {
      wx.showToast({
        title: '该分类下还有商品',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除分类',
      content: `确定删除「${category}」吗？`,
      success: res => {
        if (!res.confirm) return;

        const savedCategories = this.loadSavedCategories();
        const nextCategories = savedCategories.filter(item => item !== category);

        this.saveCategories(nextCategories);

        const { categories, categoryOptions } = this.buildCategories(this.data.products);

        let selectedCategory = this.data.selectedCategory;

        if (selectedCategory === category) {
          selectedCategory = '全部';
        }

        this.setData({
          categories,
          categoryOptions,
          selectedCategory,
          actionCategory: ''
        }, () => {
          this.refreshProductFilter();
        });

        wx.showToast({
          title: '分类已删除',
          icon: 'success'
        });
      }
    });
  },

  selectNewProductCategory(event) {
    const category = event.currentTarget.dataset.category;

    this.setData({
      'newProduct.category': category
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
    const name = this.data.newProduct.name.trim();
    const category = this.data.newProduct.category.trim();
    const price = Number(this.data.newProduct.price);
    const stock = Number(this.data.newProduct.stock);

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
      url: `${BASE_URL}/api/products`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('merchantToken') || ''}`
      },
      data: {
        name,
        category,
        price,
        stock
      },
      success: res => {
        console.log('新增商品返回：', res.data);

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

        if (res.data.code === 0) {
          const savedCategories = this.loadSavedCategories();

          if (!savedCategories.includes(category)) {
            this.saveCategories([...savedCategories, category]);
          }

          wx.showToast({
            title: '商品已新增',
            icon: 'success'
          });

          this.setData({
            selectedCategory: category,
            newProduct: {
              name: '',
              category,
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

  toggleEnabledById(event) {
    const productId = event.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);

    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      });
      return;
    }

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

        if (res.statusCode === 401) {
          this.handleUnauthorized();
          return;
        }

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

  goProductEdit(event) {
    const productId = event.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/product-edit/product-edit?id=${productId}`
    });
  }
});