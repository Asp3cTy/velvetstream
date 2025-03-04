// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

// Define o formato de saída dos logs
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Cria o logger com as configurações desejadas
const logger = createLogger({
  level: 'info', // Define o nível de log padrão (pode ser 'debug', 'info', 'warn', 'error', etc.)
  format: combine(
    timestamp(),
    colorize(), // Colore a saída no console (apenas para ambiente de desenvolvimento)
    myFormat
  ),
  transports: [
    new transports.Console(), // Registra os logs no console
    // Para salvar em arquivo, descomente a linha abaixo e configure o caminho:
    // new transports.File({ filename: 'logs/app.log', level: 'info' })
  ]
});

module.exports = logger;
