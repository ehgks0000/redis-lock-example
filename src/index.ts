import express from "express";
import Client from "ioredis";
import Redlock, { ResourceLockedError, ExecutionError } from "redlock";

const main = () => {
  const app = express();
  const clientA = new Client("redis://localhost:6300");
  const clientB = new Client("redis://localhost:6301");
  const clientC = new Client("redis://localhost:6302");

  const redlock = new Redlock([clientA, clientB, clientC], {
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time
    retryCount: 10,
    retryDelay: 200, // time in ms
    retryJitter: 200, // time in ms
    automaticExtensionThreshold: 500, // time in ms
  });

  redlock.on("error", (e) => {
    if (e instanceof ResourceLockedError) {
      console.log("ResourceLockedError :", e);
      return;
    }
    if (e instanceof ExecutionError) {
      console.log("ExecutionError :", e);
      return;
    }
  });

  app.get("/test", async (req, res) => {
    const a = await clientA.get("a");
    console.log("a :", a);
    res.json({ msg: "Test", a });
  });

  app.get("/lock", async (req, res) => {
    try {
      let lock = await redlock.acquire(["a"], 5000);
      try {
      } catch (error) {}
    } catch (error) {}
  });

  app.listen(3000, () => {
    console.log(`conccuruncy distributed redis example`);
  });
};

main();
