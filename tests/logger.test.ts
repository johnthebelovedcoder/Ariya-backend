// tests/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { logger, LogLevel, logDebug, logInfo, logWarn, logError } from '../src/lib/logger';

describe('Logger Service Tests', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  
  let consoleDebugSpy: MockedFunction<any>;
  let consoleInfoSpy: MockedFunction<any>;
  let consoleWarnSpy: MockedFunction<any>;
  let consoleErrorSpy: MockedFunction<any>;
  
  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  describe('Log Level Filtering', () => {
    it('should log messages at or above the set level', () => {
      logger.setLevel(LogLevel.INFO);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      // Debug should not be called since level is INFO
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      // The rest should be called
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    it('should not log messages below the set level', () => {
      logger.setLevel(LogLevel.ERROR);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      // Only error should be called since level is ERROR
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
  
  describe('Log Message Format', () => {
    it('should format log messages with timestamp, level, and message', () => {
      logger.setLevel(LogLevel.DEBUG);
      
      logger.info('Test message', 'Test context', { userId: 123 });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"context":"Test context"')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"meta":{"userId":123}')
      );
    });
  });
  
  describe('Log Convenience Functions', () => {
    it('logDebug should call logger.debug', () => {
      logger.setLevel(LogLevel.DEBUG);
      logDebug('Debug message', 'context', { meta: 'data' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"DEBUG"')
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Debug message"')
      );
    });
    
    it('logInfo should call logger.info', () => {
      logger.setLevel(LogLevel.INFO);
      logInfo('Info message', 'context', { meta: 'data' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Info message"')
      );
    });
    
    it('logWarn should call logger.warn', () => {
      logger.setLevel(LogLevel.WARN);
      logWarn('Warning message', 'context', { meta: 'data' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"WARN"')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Warning message"')
      );
    });
    
    it('logError should call logger.error', () => {
      logger.setLevel(LogLevel.ERROR);
      const error = new Error('Test error');
      logError('Error message', 'context', error, { meta: 'data' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Error message"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error":{"name":"Error","message":"Test error"')
      );
    });
  });
  
  describe('Error Logging', () => {
    it('should include error details in log', () => {
      logger.setLevel(LogLevel.ERROR);
      const testError = new Error('Test error message');
      testError.stack = 'Error: Test error message\n    at testFunction (test.js:1:1)';
      
      logger.error('Error occurred', 'Test context', testError, { userId: 123 });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error":{"name":"Error","message":"Test error message"')
      );
    });
  });
});