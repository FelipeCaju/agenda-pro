import { app } from "./app.js";
import { initDataStore } from "./lib/data.js";
import { describeDatabaseTarget, verifyDatabaseConnection } from "./lib/database.js";
import { loadEnvironment } from "./lib/env.js";
import { processAutomaticReminders } from "./services/reminder.service.js";

loadEnvironment();

const PORT = Number(process.env.PORT ?? 3333);
const REMINDER_INTERVAL_MS = 60_000;

function startReminderScheduler() {
  let isRunning = false;

  const runSweep = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      await processAutomaticReminders();
    } catch (error) {
      console.error("Falha ao processar lembretes automaticos.");
      console.error(error.message ?? error);
    } finally {
      isRunning = false;
    }
  };

  void runSweep();
  setInterval(() => {
    void runSweep();
  }, REMINDER_INTERVAL_MS);
}

async function startServer() {
  try {
    await verifyDatabaseConnection();
    await initDataStore();

    app.listen(PORT, () => {
      const target = describeDatabaseTarget();
      console.log(`AgendaPro backend ativo em http://localhost:${PORT}`);
      console.log(
        `MySQL conectado em ${target.host}:${target.port} / banco ${target.database}`,
      );
    });

    startReminderScheduler();
  } catch (error) {
    console.error("Falha ao iniciar o backend AgendaPro.");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
