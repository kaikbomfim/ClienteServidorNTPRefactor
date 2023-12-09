const dgram = require('dgram');
const ntpClient = require('ntp-client');

const server = dgram.createSocket('udp4');

const serverPort = 123;
const serverAddress = '127.0.0.1';

function construirRespostaNTP(requestMessage, callback) {
  const buffer = Buffer.alloc(48);
  buffer.writeUInt8(0b00100100, 0);
  requestMessage.copy(buffer, 40, 32, 40);

  ntpClient.getNetworkTime("a.st1.ntp.br", 123, (err, date) => {
    if (!err) {
      const seconds = Math.floor(date.getTime() / 1000) + 2208988800;
      const fraction = Math.floor((date.getMilliseconds() / 1000) * Math.pow(2, 32));

      buffer.writeUInt32BE(seconds, 16);
      buffer.writeUInt32BE(fraction, 20);

      callback(buffer);
    } else {
      console.error(`Erro ao obter o timestamp do servidor NTP: ${err.message}`);
    }
  });
}

server.on('message', (msg, rinfo) => {
  console.log(`Recebido pacote NTP do cliente: ${rinfo.address}:${rinfo.port}`);

  construirRespostaNTP(msg, (respostaNTP) => {
    // Enviar a resposta para o cliente
    server.send(respostaNTP, 0, respostaNTP.length, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error(`Erro ao enviar resposta NTP para o cliente: ${err.message}`);
      } else {
        console.log('Resposta NTP enviada com sucesso para o cliente.');
      }
    });
  });
});

server.on('error', (err) => {
  console.error(`Erro no servidor UDP: ${err.message}`);
  server.close();
});

server.on('close', () => {
  console.log('Servidor NTP encerrado.');
});

server.bind(serverPort, serverAddress, () => {
  console.log(`Servidor NTP iniciado em ${serverAddress}:${serverPort}`);
});
