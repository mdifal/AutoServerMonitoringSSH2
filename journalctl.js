"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ssh2_1 = require("ssh2");
var fs = require("fs");
var conn = new ssh2_1.Client();
var isConnected = false;
var connectSSH = function (host, port, username, password) {
    return new Promise(function (resolve, reject) {
        if (isConnected) {
            console.log('Using existing SSH connection.');
            resolve();
            return;
        }
        conn.on('ready', function () {
            console.log('Client :: ready');
            isConnected = true;
            resolve();
        }).on('error', function (err) {
            console.error('Connection Error:', err);
            reject(err);
        }).connect({
            host: host,
            port: port,
            username: username,
            password: password
        });
    });
};
var runSudoCommand = function (command, password) {
    return new Promise(function (resolve, reject) {
        conn.exec("echo '".concat(password, "' | sudo -S ").concat(command), { pty: true }, function (err, stream) {
            if (err) {
                console.error('Error executing command:', err);
                reject(err);
            }
            var stdout = '';
            stream.on('data', function (data) {
                stdout += data.toString();
            }).stderr.on('data', function (data) {
                console.error('STDERR:', data.toString());
            });
            stream.on('close', function (code, signal) {
                console.log('Stream :: close :: code:', code, 'signal:', signal);
                resolve(stdout);
            });
        });
    });
};
var saveToFile = function (data, filePath) {
    fs.writeFile(filePath, data, function (err) {
        if (err) {
            console.error('Error writing file:', err);
        }
        else {
            console.log("Output saved to ".concat(filePath));
        }
    });
};
var appendToFile = function (data, filePath) {
    fs.appendFile(filePath, data, function (err) {
        if (err) {
            console.error('Error appending to file:', err);
        }
        else {
            console.log("Output appended to ".concat(filePath));
        }
    });
};
var extractInfo = function (commandOutput, command, host) {
    var service = 'test';
    var projectMatch = command.match(/\bndm-[^\s]*/);
    if (projectMatch) {
        var parts = projectMatch[0].split('-');
        if (parts.length >= 3) {
            if (command.includes('dev')) {
                var thirdLast = parts[parts.length - 3];
                var secondLast = parts[parts.length - 2];
                service = "".concat(capitalize(thirdLast), " ").concat(capitalize(secondLast), " Service");
            }
            else {
                var secondLast = parts[parts.length - 2];
                var last = parts[parts.length - 1];
                service = "".concat(capitalize(secondLast), " ").concat(capitalize(last), " Service");
            }
        }
    }
    var stage = command.includes('dev') ? 'DEV' : 'PROD';
    var errorLogTrace = commandOutput.toLowerCase().includes('error') ? 'TRUE' : 'FALSE';
    // Mendapatkan nilai oktet terakhir dari alamat IP host
    var lastOctet = host.split('.').pop();
    return { service: service, stage: stage, errorLogTrace: errorLogTrace, lastOctet: lastOctet };
};
var capitalize = function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
};
var getCurrentDateFormatted = function () {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var now = new Date();
    var month = months[now.getMonth()];
    var day = String(now.getDate()).padStart(2, '0');
    return "".concat(month, " ").concat(day);
};
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var currentDate, commands, host, _i, commands_1, command, commandOutput, _a, service, stage, errorLogTrace, lastOctet, logFilePath, monitoringFileName, monitoringFilePath, monitoringOutput, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                currentDate = getCurrentDateFormatted();
                commands = [
                    "journalctl | grep '".concat(currentDate, "'"),
                    "journalctl | grep '".concat(currentDate, "'")
                ];
                host = '';
                return [4 /*yield*/, connectSSH(host, 22, 'username', 'password')];
            case 1:
                _b.sent();
                _i = 0, commands_1 = commands;
                _b.label = 2;
            case 2:
                if (!(_i < commands_1.length)) return [3 /*break*/, 5];
                command = commands_1[_i];
                return [4 /*yield*/, runSudoCommand(command, 'password')];
            case 3:
                commandOutput = _b.sent();
                _a = extractInfo(commandOutput, command, host), service = _a.service, stage = _a.stage, errorLogTrace = _a.errorLogTrace, lastOctet = _a.lastOctet;
                logFilePath = "./log_".concat(service.replace(/ /g, '_'), "_").concat(new Date().toISOString().split('T')[0], ".txt");
                saveToFile(commandOutput, logFilePath);
                monitoringFileName = "log_".concat(lastOctet, "_").concat(new Date().toISOString().split('T')[0], ".csv");
                monitoringFilePath = "./".concat(monitoringFileName);
                // Menyimpan data ke file monitoring
                if (!fs.existsSync(monitoringFilePath)) {
                    saveToFile('Service,Stage,Error Log Trace\n', monitoringFilePath); // Tulis header jika file belum ada
                }
                monitoringOutput = "".concat(service, ",").concat(stage, ",").concat(errorLogTrace, "\n");
                appendToFile(monitoringOutput, monitoringFilePath);
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                conn.end();
                return [3 /*break*/, 7];
            case 6:
                err_1 = _b.sent();
                console.error('Error:', err_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
main();
