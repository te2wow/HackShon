import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { dbService } from '../db/models.js';
import { eventEmitter } from '../services/eventEmitter.js';

const app = new Hono();

app.get('/', (c) => {
  return streamSSE(c, async (stream) => {
    const sendUpdate = async () => {
      const teams = await dbService.getAllTeams();
      const updates = await Promise.all(
        teams.map(async (team) => {
          const chartData = await fetch(`http://localhost:${process.env.PORT || 3000}/api/metrics/chart/${team.id}`)
            .then(res => res.json())
            .catch(() => null);
          return chartData;
        })
      );
      
      await stream.writeSSE({
        data: JSON.stringify(updates.filter(Boolean)),
        event: 'update',
        id: Date.now().toString(),
      });
    };

    await sendUpdate();

    const listener = () => {
      sendUpdate().catch(console.error);
    };

    eventEmitter.on('metrics-updated', listener);

    stream.onAbort(() => {
      eventEmitter.off('metrics-updated', listener);
    });
  });
});

export default app;