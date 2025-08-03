// lib/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private level: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    
    if (args.length === 0) {
      return `${prefix} ${message}`
    }
    
    return `${prefix} ${message} ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}`
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // console.log(this.formatMessage('DEBUG', message, ...args))
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      // console.info(this.formatMessage('INFO', message, ...args))
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      // console.warn(this.formatMessage('WARN', message, ...args))
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      // console.error(this.formatMessage('ERROR', message, ...args))
    }
  }

  // 性能监控专用方法
  performance(operation: string, duration: number, metadata?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const message = `Performance: ${operation} took ${duration.toFixed(2)}ms`
      if (metadata) {
        // console.log(this.formatMessage('PERF', message, metadata))
      } else {
        // console.log(this.formatMessage('PERF', message))
      }
    }
  }

  // 数据操作专用方法
  dataOperation(operation: string, result: any, metadata?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const message = `Data operation: ${operation}`
      const args = [result]
      if (metadata) {
        args.push(metadata)
      }
      // console.log(this.formatMessage('DATA', message, ...args))
    }
  }

  // 用户交互专用方法
  interaction(action: string, details?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const message = `User interaction: ${action}`
      if (details) {
        // console.log(this.formatMessage('INTERACTION', message, details))
      } else {
        // console.log(this.formatMessage('INTERACTION', message))
      }
    }
  }

  // 错误处理专用方法
  errorWithContext(error: Error, context: string, additionalInfo?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const message = `Error in ${context}: ${error.message}`
      const args = [error.stack]
      if (additionalInfo) {
        args.push(additionalInfo)
      }
      // console.error(this.formatMessage('ERROR', message, ...args))
    }
  }
}

// 创建全局日志实例
export const logger = new Logger()

// 便捷的导出方法
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const performance = logger.performance.bind(logger)
export const dataOperation = logger.dataOperation.bind(logger)
export const interaction = logger.interaction.bind(logger)
export const errorWithContext = logger.errorWithContext.bind(logger)

// 设置日志级别的便捷方法
export const setLogLevel = logger.setLevel.bind(logger) 