import { Client } from 'ssh2';

import * as fs from 'fs';
 
const conn = new Client();

let isConnected = false;
 
const connectSSH = (host, port, username, password) => {

  return new Promise<void>((resolve, reject) => {

    if (isConnected) {

      console.log('Using existing SSH connection.');

      resolve();

      return;

    }

    conn.on('ready', () => {

      console.log('Client :: ready');

      isConnected = true;

      resolve();

    }).on('error', (err) => {

      console.error('Connection Error:', err);

      reject(err);

    }).connect({

      host,

      port,

      username,

      password

    });

  });

};
 
const runSudoCommand = (command, password) => {

  return new Promise((resolve, reject) => {

    conn.exec(`echo '${password}' | sudo -S ${command}`, { pty: true }, (err, stream) => {

      if (err) {

        console.error('Error executing command:', err);

        reject(err);

      }

      let stdout = '';

      stream.on('data', (data) => {

        stdout += data.toString();

      }).stderr.on('data', (data) => {

        console.error('STDERR:', data.toString());

      });

      stream.on('close', (code, signal) => {

        console.log('Stream :: close :: code:', code, 'signal:', signal);

        resolve(stdout);

      });

    });

  });

};
 
const saveToFile = (data, filePath) => {

  fs.writeFile(filePath, data, (err) => {

    if (err) {

      console.error('Error writing file:', err);

    } else {

      console.log(`Output saved to ${filePath}`);

    }

  });

};
 
const appendToFile = (data, filePath) => {

  fs.appendFile(filePath, data, (err) => {

    if (err) {

      console.error('Error appending to file:', err);

    } else {

      console.log(`Output appended to ${filePath}`);

    }

  });

};
 
const extractInfo = (commandOutput, command, host) => {

  let service = 'test';

  const projectMatch = command.match(/\bndm-[^\s]*/);

  if (projectMatch) {

    const parts = projectMatch[0].split('-');

    if (parts.length >= 3) {

      if (command.includes('dev')) {

        const thirdLast = parts[parts.length - 3];

        const secondLast = parts[parts.length - 2];

        service = `${capitalize(thirdLast)} ${capitalize(secondLast)} Service`;

      } else {

        const secondLast = parts[parts.length - 2];

        const last = parts[parts.length - 1];

        service = `${capitalize(secondLast)} ${capitalize(last)} Service`;

      }

    }

  }

  const stage = command.includes('dev') ? 'DEV' : 'PROD';

  const errorLogTrace = commandOutput.toLowerCase().includes('error') ? 'TRUE' : 'FALSE';
 
  // Mendapatkan nilai oktet terakhir dari alamat IP host

  const lastOctet = host.split('.').pop();
 
  return { service, stage, errorLogTrace, lastOctet };

};
 
const capitalize = (word) => {

  return word.charAt(0).toUpperCase() + word.slice(1);

};
 
const getCurrentDateFormatted = () => {

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const now = new Date();

  const month = months[now.getMonth()];

  const day = String(now.getDate()).padStart(2, '0');

  return `${month} ${day}`;

};
 
const main = async () => {

  try {

    const currentDate = getCurrentDateFormatted();
    //list of command yang akan dieksekusi
    const commands = [

      `journalctl | grep '${currentDate}'`,

      `journalctl | grep '${currentDate}'`

    ];
 
    const host = ''; // Ganti dengan alamat IP host yang sebenarnya
 
    await connectSSH(host, 22, 'username', 'password');
 
    for (const command of commands) {

      const commandOutput = await runSudoCommand(command, 'password');
 
      // Extract information

      const { service, stage, errorLogTrace, lastOctet } = extractInfo(commandOutput, command, host);
 
      // Save log to log-namaservice-tanggal file

      const logFilePath = `./log_${service.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;

      saveToFile(commandOutput, logFilePath);
 
      // File monitoring dengan nama mengandung nilai oktet terakhir dari alamat IP host

      const monitoringFileName = `log_${lastOctet}_${new Date().toISOString().split('T')[0]}.csv`;

      const monitoringFilePath = `./${monitoringFileName}`;
 
      // Menyimpan data ke file monitoring

      if (!fs.existsSync(monitoringFilePath)) {

        saveToFile('Service,Stage,Error Log Trace\n', monitoringFilePath); // Tulis header jika file belum ada

      }

      const monitoringOutput = `${service},${stage},${errorLogTrace}\n`;

      appendToFile(monitoringOutput, monitoringFilePath);

    }
 
    conn.end();

  } catch (err) {

    console.error('Error:', err);

  }

};
 
main();

 