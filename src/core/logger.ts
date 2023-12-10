import pino from 'pino';
import { join } from 'path';

const transports = pino.transport({
  targets: [
    {
      level: 'info',
      target: 'pino/file',
      options: {
        mkdir: true,
        destination: join(__dirname, '../../info/info.log'),
      },
    },
    {
      level: 'error',
      target: 'pino/file',
      options: {
        mkdir: true,
        destination: join(__dirname, '../../errors/error.log'),
      },
    },
  ],
});
const logger = pino(transports);
export default logger;
