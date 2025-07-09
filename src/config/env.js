// 环境配置
const env = {
  development: {
    API_BASE_URL: 'http://localhost:3100',
    // 其他开发环境配置
  },
  production: {
    API_BASE_URL: 'https://api.xiaomingyan.com',
    // 其他生产环境配置
  }
}

// 根据当前环境获取配置
const currentEnv = import.meta.env.MODE || 'development'
export default env[currentEnv] 