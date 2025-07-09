import env from '../config/env'

// 创建请求函数
const request = {
  baseURL: env.API_BASE_URL,
  
  // 通用请求方法
  async request(url, options = {}) {
    const fullUrl = `${this.baseURL}${url}`
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  },
  
  // GET 请求
  async get(url, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request(fullUrl, {
      method: 'GET',
      ...options
    })
  },
  
  // POST 请求
  async post(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
  },
  
  // PUT 请求
  async put(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
  },
  
  // DELETE 请求
  async delete(url, options = {}) {
    return this.request(url, {
      method: 'DELETE',
      ...options
    })
  },
  
  // 上传文件
  async upload(url, file, options = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.request(url, {
      method: 'POST',
      body: formData,
      headers: {
        // 上传文件时不需要设置 Content-Type，浏览器会自动设置
        ...options.headers
      },
      ...options
    })
  },

  /**
   * 获取请求数据
   * @param {Object} options - 请求配置
   * @returns {Object} 处理后的请求数据
   * @private
   */
  _getData(options) {
    const { data, method } = options;
    if (!data) return {};

    // 如果是 GET 请求，将数据转换为查询字符串
    if (method === 'GET') {
        return this._convertToQueryString(data);
    }

    // 如果是 POST 请求，检查是否需要转换数据格式
    if (method === 'POST') {
        // 如果数据是字符串，尝试解析为 JSON
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return { data };
            }
        }
        // 如果数据是对象，直接返回
        if (typeof data === 'object') {
            return data;
        }
    }

    return data;
  },

  /**
   * 将对象转换为查询字符串
   * @param {Object} data - 要转换的数据对象
   * @returns {Object} 转换后的查询字符串对象
   * @private
   */
  _convertToQueryString(data) {
    if (typeof data !== 'object') return {};
    
    const queryString = Object.entries(data)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    return { [queryString]: '' };
  }
}

export default request 