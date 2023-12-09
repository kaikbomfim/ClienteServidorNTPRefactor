const dgram = require('dgram');

// Configurar o cliente UDP
const client = dgram.createSocket('udp4');

// Configurações do servidor NTP
const serverAddress = '127.0.0.1';
const serverPort = 123; // Alterei para corresponder ao serverPort configurado no servidor

// Função para construir o pacote NTP
function construirPacoteNTP() {
  const buffer = Buffer.alloc(48);
  // Configurar o modo (client) e o número de versão (3)
  buffer.writeUInt8(0b00100011, 0);
  // Preencher os campos de timestamp com 0 (inicialmente)
  for (let i = 1; i < 48; i++) {
    buffer.writeUInt8(0, i);
  }
  return buffer;
}

// Função para extrair o timestamp da resposta do servidor
function extrairTimestamp(response) {
  const buffer = Buffer.from(response);
  const seconds= buffer.readUInt32BE(16);
  const fraction = buffer.readUInt32BE(20);
  const unixEpoch = Date.UTC(1900, 0, 1, 0, 0, 0);
  const timestamp = unixEpoch + (seconds * 1000) + (fraction / 4294967296 * 1000);
  return new Date(timestamp);
}

// Função para enviar pacote NTP para o servidor e lidar com a resposta
function enviarPacoteNTP() {
  const message = construirPacoteNTP();
  client.send(message, 0, message.length, serverPort, serverAddress, (err) => {
    if (err) {
      console.error(`Erro ao enviar pacote NTP: ${err.message}`);
    } else {
      console.log('Pacote NTP enviado com sucesso');
    }
  });
}

// Lidar com a resposta do servidor
client.on('message', (msg, rinfo) => {
  const timestamp = extrairTimestamp(msg);
  console.log(`Resposta do servidor NTP: ${timestamp.toLocaleString()}`);
  
  // Agendar o próximo envio após 1000 milissegundos (1 segundo)
  setTimeout(() => {
    enviarPacoteNTP();
  }, 1000);
});

// Lidar com erros no socket
client.on('error', (err) => {
  console.error(`Erro no cliente UDP: ${err.message}`);
  client.close();
});

// Iniciar a troca de mensagens
enviarPacoteNTP();
