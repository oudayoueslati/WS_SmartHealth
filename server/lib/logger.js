/**
 * Logger - Système de logging centralisé avec niveaux et audit
 * Pour production, considérer Winston ou Pino
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.auditDir = path.join(__dirname, '../logs/audit');
    this.ensureLogDirectories();
  }

  ensureLogDirectories() {
    [this.logDir, this.auditDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Format timestamp ISO
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatEntry(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta
    });
  }

  /**
   * Écrire dans un fichier log
   */
  writeToFile(filename, content) {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, content + '\n', 'utf8');
  }

  /**
   * Écrire dans le log d'audit
   */
  writeToAudit(content) {
    const date = new Date().toISOString().split('T')[0];
    const filepath = path.join(this.auditDir, `audit-${date}.log`);
    fs.appendFileSync(filepath, content + '\n', 'utf8');
  }

  /**
   * Log INFO
   */
  info(message, meta = {}) {
    const entry = this.formatEntry('INFO', message, meta);
    console.log(`ℹ️  ${message}`, meta);
    this.writeToFile('app.log', entry);
  }

  /**
   * Log ERROR
   */
  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      error: error.message,
      stack: error.stack,
      ...meta
    } : meta;
    
    const entry = this.formatEntry('ERROR', message, errorMeta);
    console.error(`❌ ${message}`, errorMeta);
    this.writeToFile('error.log', entry);
  }

  /**
   * Log WARNING
   */
  warn(message, meta = {}) {
    const entry = this.formatEntry('WARN', message, meta);
    console.warn(`⚠️  ${message}`, meta);
    this.writeToFile('app.log', entry);
  }

  /**
   * Log DEBUG (seulement en dev)
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = this.formatEntry('DEBUG', message, meta);
      console.debug(`🐛 ${message}`, meta);
      this.writeToFile('debug.log', entry);
    }
  }

  /**
   * Log AUDIT - pour tracer les opérations critiques
   */
  audit(action, details = {}) {
    const entry = this.formatEntry('AUDIT', action, {
      user: details.user || 'system',
      resource: details.resource,
      operation: details.operation,
      status: details.status || 'success',
      ip: details.ip,
      ...details
    });
    
    console.log(`📋 AUDIT: ${action}`, details);
    this.writeToAudit(entry);
  }

  /**
   * Log requête HTTP
   */
  http(req, res, duration) {
    const entry = this.formatEntry('HTTP', `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    this.writeToFile('http.log', entry);
  }

  /**
   * Log opération SPARQL
   */
  sparql(operation, query, duration, success = true) {
    const entry = this.formatEntry('SPARQL', operation, {
      operation,
      query: query.substring(0, 200), // Tronquer pour éviter logs trop longs
      duration: `${duration}ms`,
      success
    });
    
    this.writeToFile('sparql.log', entry);
  }
}

// Export singleton
const logger = new Logger();

/**
 * Middleware Express pour logger les requêtes HTTP
 */
function httpLoggerMiddleware(req, res, next) {
  const start = Date.now();
  
  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req, res, duration);
  });
  
  next();
}

/**
 * Middleware Express pour logger les erreurs
 */
function errorLoggerMiddleware(err, req, res, next) {
  logger.error('Express Error', err, {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next(err);
}

module.exports = logger;
module.exports.httpLoggerMiddleware = httpLoggerMiddleware;
module.exports.errorLoggerMiddleware = errorLoggerMiddleware;
