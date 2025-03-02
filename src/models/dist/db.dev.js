"use strict";

var _require = require('undici'),
    fetch = _require.fetch;

require('dotenv').config();

var D1_URL = process.env.D1_URL;
var D1_AUTH = process.env.D1_AUTH;
/**
 * Executa a query SQL contra o Cloudflare D1.
 * Adicionamos logs extras e ajustamos o parsing do JSON para extrair os resultados corretamente.
 */

function queryDatabase(query) {
  var params,
      response,
      rawText,
      result,
      _args = arguments;
  return regeneratorRuntime.async(function queryDatabase$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          params = _args.length > 1 && _args[1] !== undefined ? _args[1] : [];
          console.log("Executando SQL:", query);
          console.log("Com parâmetros:", params);
          _context.prev = 3;
          _context.next = 6;
          return regeneratorRuntime.awrap(fetch(D1_URL, {
            method: 'POST',
            headers: {
              'Authorization': "Bearer ".concat(D1_AUTH),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sql: query,
              params: params
            })
          }));

        case 6:
          response = _context.sent;
          _context.next = 9;
          return regeneratorRuntime.awrap(response.text());

        case 9:
          rawText = _context.sent;
          console.log("Raw DB response text:", rawText);
          _context.prev = 11;
          result = JSON.parse(rawText);
          _context.next = 18;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](11);
          throw new Error("Falha ao converter resposta do DB para JSON: " + rawText);

        case 18:
          console.log("Parsed DB result:", result);

          if (!(result.errors && result.errors.length > 0)) {
            _context.next = 21;
            break;
          }

          throw new Error(result.errors.map(function (err) {
            return err.message;
          }).join(', '));

        case 21:
          if (!(result.result && Array.isArray(result.result) && result.result.length > 0)) {
            _context.next = 24;
            break;
          }

          if (!(result.result[0].results && Array.isArray(result.result[0].results))) {
            _context.next = 24;
            break;
          }

          return _context.abrupt("return", result.result[0].results);

        case 24:
          return _context.abrupt("return", []);

        case 27:
          _context.prev = 27;
          _context.t1 = _context["catch"](3);
          console.error("❌ Erro na query do DB:", _context.t1);
          throw _context.t1;

        case 31:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 27], [11, 15]]);
}

var initializeDatabase = function initializeDatabase() {
  var queries, _i, _queries, query;

  return regeneratorRuntime.async(function initializeDatabase$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          queries = ["CREATE TABLE IF NOT EXISTS users (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT NOT NULL UNIQUE,\n      password TEXT NOT NULL,\n      role TEXT NOT NULL DEFAULT 'user',\n      subscription_status TEXT NOT NULL CHECK (subscription_status IN ('active', 'expired', 'pending')),\n      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    );", "CREATE TABLE IF NOT EXISTS videos (\n      id TEXT PRIMARY KEY,\n      title TEXT NOT NULL,\n      description TEXT,\n      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    );", "CREATE TABLE IF NOT EXISTS seasons (\n      id TEXT PRIMARY KEY,\n      series_id TEXT NOT NULL,\n      season_number INTEGER NOT NULL,\n      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    );", "CREATE TABLE IF NOT EXISTS episodes (\n      id TEXT PRIMARY KEY,\n      series_id TEXT NOT NULL,\n      season_number INTEGER NOT NULL,\n      episode_number INTEGER NOT NULL,\n      title TEXT NOT NULL,\n      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    );"];
          _i = 0, _queries = queries;

        case 2:
          if (!(_i < _queries.length)) {
            _context2.next = 9;
            break;
          }

          query = _queries[_i];
          _context2.next = 6;
          return regeneratorRuntime.awrap(queryDatabase(query));

        case 6:
          _i++;
          _context2.next = 2;
          break;

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
};

var getUserByEmail = function getUserByEmail(email) {
  var result;
  return regeneratorRuntime.async(function getUserByEmail$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(queryDatabase("SELECT * FROM users WHERE email = ?", [email]));

        case 2:
          result = _context3.sent;
          console.log("🔍 [DB] getUserByEmail result:", JSON.stringify(result));
          return _context3.abrupt("return", result.length > 0 ? result[0] : null);

        case 5:
        case "end":
          return _context3.stop();
      }
    }
  });
};

var getUserById = function getUserById(id) {
  var result;
  return regeneratorRuntime.async(function getUserById$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(queryDatabase("SELECT * FROM users WHERE id = ?", [id]));

        case 2:
          result = _context4.sent;
          console.log("🔍 [DB] getUserById result:", JSON.stringify(result));
          return _context4.abrupt("return", result.length > 0 ? result[0] : null);

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  });
};

var createUser = function createUser(name, email, password, role, subscription_status) {
  var id;
  return regeneratorRuntime.async(function createUser$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          id = generateId();
          _context5.next = 3;
          return regeneratorRuntime.awrap(queryDatabase("INSERT INTO users (id, name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?, ?)", [id, name, email, password, role, subscription_status]));

        case 3:
          return _context5.abrupt("return", id);

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  });
};

var updateUserStatus = function updateUserStatus(userId, status) {
  return regeneratorRuntime.async(function updateUserStatus$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(queryDatabase("UPDATE users SET subscription_status = ? WHERE id = ?", [status, userId]));

        case 2:
        case "end":
          return _context6.stop();
      }
    }
  });
};

var deleteUserByEmail = function deleteUserByEmail(email) {
  return regeneratorRuntime.async(function deleteUserByEmail$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(queryDatabase("DELETE FROM users WHERE email = ?", [email]));

        case 2:
        case "end":
          return _context7.stop();
      }
    }
  });
};

var generateId = function generateId() {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function () {
    return (Math.random() * 16 | 0).toString(16);
  });
}; // Função para atualizar o preapproval_id do usuário no banco de dados


var savePreapprovalId = function savePreapprovalId(userId, preapprovalId) {
  return regeneratorRuntime.async(function savePreapprovalId$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(queryDatabase("UPDATE users SET mp_preapproval_id = ? WHERE id = ?", [preapprovalId, userId]));

        case 3:
          console.log("Preapproval_id ".concat(preapprovalId, " salvo para o user ").concat(userId));
          _context8.next = 10;
          break;

        case 6:
          _context8.prev = 6;
          _context8.t0 = _context8["catch"](0);
          console.error("Erro ao salvar preapproval_id para o usu\xE1rio ".concat(userId, ":"), _context8.t0);
          throw _context8.t0;

        case 10:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 6]]);
}; // Resetar a Senha do


var updateUserPassword = function updateUserPassword(userId, hashedPassword) {
  return regeneratorRuntime.async(function updateUserPassword$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _context9.next = 3;
          return regeneratorRuntime.awrap(queryDatabase("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]));

        case 3:
          console.log("Senha atualizada para o usu\xE1rio ".concat(userId));
          _context9.next = 10;
          break;

        case 6:
          _context9.prev = 6;
          _context9.t0 = _context9["catch"](0);
          console.error("Erro ao atualizar senha para o usu\xE1rio ".concat(userId, ":"), _context9.t0);
          throw _context9.t0;

        case 10:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 6]]);
};

module.exports = {
  initializeDatabase: initializeDatabase,
  queryDatabase: queryDatabase,
  getUserByEmail: getUserByEmail,
  getUserById: getUserById,
  createUser: createUser,
  updateUserStatus: updateUserStatus,
  deleteUserByEmail: deleteUserByEmail,
  savePreapprovalId: savePreapprovalId,
  updateUserPassword: updateUserPassword // Exporta a nova função

};