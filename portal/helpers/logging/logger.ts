import pino, { Logger } from "pino";

export function getLogger(name: string): Logger {
  return pino({
    name,
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info",
    formatters: {
      level: (label) => {
        return {
          level: label,
        };
      },
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  });
}
