const dgram = require('dgram');

// Configurar o servidor UDP
const server = dgram.createSocket('udp4');

// Configurações do servidor NTP
const serverPort = 3000;

// Endereço IP em que o servidor deve escutar
const serverAddress = '127.0.0.1';

// Função para construir o pacote NTP de resposta
function construirRespostaNTP(requestMessage) {
  const buffer = Buffer.alloc(48);
  // Configurar o modo (server) e o número de versão (3)
  buffer.writeUInt8(0b00100100, 0);
  // Copiar o campo Transmit Timestamp do pacote de requisição
  requestMessage.copy(buffer, 40, 32, 40);

  // Preencher os campos de timestamp com o tempo atual
  const timestamp = Date.now();

  const seconds = Math.floor(timestamp / 1000) + 2208988800;
  const fraction = Math.floor((timestamp % 1000) / 1000 * Math.pow(2, 32));

  buffer.writeUInt32BE(seconds, 16); // Seconds since 1900
  buffer.writeUInt32BE(fraction, 20); // Fractions of a second

  return buffer;
}

// Lidar com mensagens recebidas do cliente
server.on('message', (msg, rinfo) => {
  console.log(`Recebido pacote NTP do cliente: ${rinfo.address}:${rinfo.port}`);
  
  // Construir a resposta NTP
  const respostaNTP = construirRespostaNTP(msg);
  
  // Enviar a resposta para o cliente
  server.send(respostaNTP, 0, respostaNTP.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.error(`Erro ao enviar resposta NTP para o cliente: ${err.message}`);
    } else {
      console.log('Resposta NTP enviada com sucesso para o cliente.');
    }
  });
});

// Lidar com erros no socket
server.on('error', (err) => {
  console.error(`Erro no servidor UDP: ${err.message}`);
  server.close();
});

// Lidar com eventos de fechamento do servidor
server.on('close', () => {
  console.log('Servidor NTP encerrado.');
});

// Iniciar o servidor na porta especificada
server.bind(serverPort, serverAddress, () => {
  console.log(`Servidor NTP iniciado em ${serverAddress}:${serverPort}`);
});
