// 字体管理器
class FontManager {
  constructor() {
    this.fontCache = new Map(); // 字体缓存
    this.currentFont = null;    // 当前字体
    this.fontLoading = false;   // 字体加载状态
    this.currentFamilyLoadingName = ''; // 当前正在加载的字体族名称
    this.fontWeight = 'normal'; // 当前字体粗细
    this.fontFamily = '';       // 当前字体族
    this.fontCategories = new Map(); // 字体分类
    this.googleFonts = new Set(); // 已加载的 Google Fonts
  }

  // 初始化字体分类
  initFontCategories() {
    this.fontCategories.set('all', []);
    this.fontCategories.set('serif', []);    // 衬线字体
    this.fontCategories.set('sans-serif', []); // 无衬线字体
    this.fontCategories.set('display', []);  // 艺术字体
    this.fontCategories.set('handwriting', []); // 手写字体
  }

  // 添加字体
  addFont(fontData) {
    const {
      id,
      name,
      previewUrl,    // 字体预览图片URL
      fontUrl,       // 字体文件URL
      category = 'all',
      isCommercial = false,
      variants = []
    } = fontData;

    const font = {
      id,
      name,
      previewUrl,
      fontUrl,
      category,
      isCommercial,
      variants,
      previewImage: null
    };

    // 添加到分类
    if (!this.fontCategories.has(category)) {
      this.fontCategories.set(category, []);
    }
    this.fontCategories.get(category).push(font);
    this.fontCategories.get('all').push(font);

    // 预加载预览图片
    this.preloadPreviewImage(font);
  }

  // 预加载预览图片
  preloadPreviewImage(font) {
    if (font.previewUrl) {
      const img = new Image();
      img.src = font.previewUrl;
      font.previewImage = img;
    }
  }

  // 获取字体列表
  getFonts(category = 'all') {
    return this.fontCategories.get(category) || [];
  }

  // 搜索字体
  searchFonts(keyword) {
    const allFonts = this.fontCategories.get('all');
    return allFonts.filter(font => 
      font.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // 加载 Google Font
  async loadGoogleFont(fontFamily, weights = ['400', '700'], styles = ['normal']) {
    if (this.googleFonts.has(fontFamily)) {
      return true;
    }

    try {
      const weightsStr = weights.join(',');
      const stylesStr = styles.join(',');
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightsStr}&display=swap`;
      
      const link = document.createElement('link');
      link.href = url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // 等待字体加载
      await new Promise((resolve) => {
        link.onload = resolve;
        link.onerror = resolve;
      });

      this.googleFonts.add(fontFamily);
      return true;
    } catch (error) {
      console.error('Google Font 加载失败:', error);
      return false;
    }
  }

  // 获取 Google Fonts 列表
  async getGoogleFonts() {
    try {
      const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY');
      const data = await response.json();
      return data.items.map(font => ({
        family: font.family,
        variants: font.variants,
        category: font.category
      }));
    } catch (error) {
      console.error('获取 Google Fonts 列表失败:', error);
      return [];
    }
  }

  // 加载字体
  async loadFont(fontUrl, fontFamily) {
    if (this.fontCache.has(fontFamily)) {
      return this.fontCache.get(fontFamily);
    }

    try {
      const font = new FontFace(fontFamily, `url(${fontUrl})`);
      await font.load();
      document.fonts.add(font);
      this.fontCache.set(fontFamily, font);
      return font;
    } catch (error) {
      console.error('字体加载失败:', error);
      return null;
    }
  }

  // 加载字体族
  async loadFontFamily(fontFamilyData) {
    this.fontLoading = true;
    this.currentFamilyLoadingName = fontFamilyData.name;

    try {
      const fontUrl = `https://static.fotor.com.cn/${fontFamilyData.fontUrl}`;
      const fontList = fontFamilyData.variants || [];
      
      const hasBold = fontList.some(f => f.type === 'bold');
      const supportItalic = fontList.some(f => f.style === 'italic');

      // 加载字体变体
      const fontPromises = fontList.map(async (variant) => {
        const variantUrl = variant.url ? `https://static.fotor.com.cn/${variant.url}` : fontUrl;
        const variantName = this.getVariantFontName(fontFamilyData.name, variant);
        return this.loadFont(variantUrl, variantName);
      });

      await Promise.all(fontPromises);

      const font = await this.loadFont(fontUrl, fontFamilyData.name);
      if (font) {
        this.currentFont = {
          name: fontFamilyData.name,
          fontList,
          hasBold,
          supportItalic,
          isCommercial: fontFamilyData.isCommercial,
          variants: this.processFontVariants(fontList)
        };

        if (this.fontWeight === 'bold' && !hasBold) {
          this.fontWeight = 'normal';
        }

        this.fontFamily = fontFamilyData.name;
        this.fontLoading = false;
        this.currentFamilyLoadingName = '';

        return {
          success: true,
          fontFamily: fontFamilyData.name,
          fontWeight: this.fontWeight,
          vip: fontFamilyData.isCommercial,
          supportItalic,
          startDrag: false,
          isDone: true,
          variants: this.currentFont.variants
        };
      }
      return { success: false };
    } catch (error) {
      console.error('字体族加载失败:', error);
      this.fontLoading = false;
      this.currentFamilyLoadingName = '';
      return { success: false, error };
    }
  }

  // 处理字体变体
  processFontVariants(fontList) {
    return fontList.map(variant => ({
      type: variant.type || 'normal',
      style: variant.style || 'normal',
      weight: this.getFontWeight(variant.type),
      url: variant.url ? `https://static.fotor.com.cn/${variant.url}` : null
    }));
  }

  // 获取变体字体名称
  getVariantFontName(familyName, variant) {
    const type = variant.type || 'normal';
    const style = variant.style || 'normal';
    return `${familyName}-${type}-${style}`;
  }

  // 获取字体粗细值
  getFontWeight(type) {
    switch (type) {
      case 'bold':
        return '700';
      case 'normal':
        return '400';
      case 'light':
        return '300';
      default:
        return '400';
    }
  }

  // 设置字体粗细
  setFontWeight(weight) {
    this.fontWeight = weight;
  }

  // 获取当前字体信息
  getCurrentFont() {
    return this.currentFont;
  }

  // 检查是否支持粗体
  hasBold() {
    return this.currentFont?.hasBold || false;
  }

  // 检查是否支持斜体
  supportItalic() {
    return this.currentFont?.supportItalic || false;
  }

  // 应用字体样式
  applyFontStyle(element, options) {
    const { fontFamily, fontWeight, fontStyle } = options;
    
    if (fontFamily) {
      element.style.fontFamily = fontFamily;
    }
    if (fontWeight) {
      element.style.fontWeight = fontWeight;
    }
    if (fontStyle) {
      element.style.fontStyle = fontStyle;
    }
  }

  // 字体变更事件处理
  async onFontChange(options) {
    const { fontFamily, fontWeight, fontStyle, onComplete } = options;
    
    if (fontFamily) {
      try {
        const result = await this.loadFontFamily(fontFamily);
        if (result.success && onComplete) {
          onComplete({
            fontFamily,
            fontWeight: this.hasBold() ? fontWeight : 'normal',
            supportItalic: this.supportItalic(),
            fontStyle,
            vip: this.currentFont?.isCommercial === 1,
            variants: this.currentFont?.variants
          });
        }
      } catch (error) {
        console.error('字体变更失败:', error);
      }
    }
  }

  // 获取加载状态
  getLoadingState() {
    return {
      fontLoading: this.fontLoading,
      currentFamilyLoadingName: this.currentFamilyLoadingName,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight
    };
  }

  // 创建字体预览元素
  createFontPreview(font, options = {}) {
    const {
      width = 200,
      height = 50,
      text = '预览文字',
      onClick
    } = options;

    const container = document.createElement('div');
    container.className = 'font-preview';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.cursor = 'pointer';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    if (font.previewImage) {
      const img = document.createElement('img');
      img.src = font.previewUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      container.appendChild(img);
    } else {
      const textElement = document.createElement('div');
      textElement.textContent = text;
      textElement.style.fontFamily = font.name;
      textElement.style.width = '100%';
      textElement.style.height = '100%';
      textElement.style.display = 'flex';
      textElement.style.alignItems = 'center';
      textElement.style.justifyContent = 'center';
      container.appendChild(textElement);
    }

    if (onClick) {
      container.addEventListener('click', () => onClick(font));
    }

    return container;
  }

  // 创建字体选择器
  createFontPicker(options = {}) {
    const {
      container,
      category = 'all',
      width = 200,
      height = 50,
      onSelect
    } = options;

    const picker = document.createElement('div');
    picker.className = 'font-picker';
    picker.style.display = 'flex';
    picker.style.flexWrap = 'wrap';
    picker.style.gap = '10px';

    const fonts = this.getFonts(category);
    fonts.forEach(font => {
      const preview = this.createFontPreview(font, {
        width,
        height,
        onClick: () => {
          if (onSelect) {
            onSelect(font);
          }
        }
      });
      picker.appendChild(preview);
    });

    if (container) {
      container.appendChild(picker);
    }

    return picker;
  }
}

// 导出单例
export const fontManager = new FontManager(); 