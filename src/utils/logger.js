const winston = require('winston');

class Logger {
  static initialize() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}] - ${info.message}`),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  static log(message) {
    this.logger.log('info', message);
  }

  static error(message) {
    this.logger.error(message);
  }

  static warn(message) {
    this.logger.warn(message);
  }
}

Logger.initialize();

module.exports = Logger;
