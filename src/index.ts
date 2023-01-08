import express, { NextFunction, Request, Response } from "express";
import Client from "ioredis";
import Redlock, { ResourceLockedError, ExecutionError } from "redlock";

const main = () => {
  const app = express();

  // Check this, https://stackoverflow.com/questions/64374113/replyerror-moved-error-after-connecting-to-redis-cluster-aws
  const cluster = new Client.Cluster([
    { host: "redis-node1", port: 6300 },
    { host: "redis-node2", port: 6301 },
    { host: "redis-node3", port: 6302 },
    { host: "redis-node4", port: 6303 },
    { host: "redis-node5", port: 6304 },
    { host: "redis-node6", port: 6305 },
  ]);

  cluster.once("connect", () => {
    console.log("connected");
  });

  cluster.on("reconnecting", () => {
    console.log("connected");
  });

  cluster.on("error", (e) => {
    console.log("error: ", e);
  });

  const redlock = new Redlock([cluster], {
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time
    retryCount: 10,
    retryDelay: 2000, // time in ms
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

  app.get("/ping", async (req, res) => {
    console.log("pong");
    
    res.json({ msg: "pong"});
  });

  app.get("/set", async (req, res) => {
    try {
      console.log("test set");
      const a = await cluster.get("a");
      console.log("a :", a);
      if(!a){
        await cluster.set("a", "testA");
      }

      const counter = await cluster.get("bbb");
      if(!counter){
        await cluster.set("bbb", 100);
      }

      res.json({ msg: "Test", a, counter });
    } catch (error) {
      res.json({ msg: "Test", error });
    }
  });

  app.get("/count", async (req, res) => {
    const counter = await cluster.get("bbb");
    console.log("a :", counter);

    if (Number(counter) <= 0) {
      res.json({ msg: "0 됨." });
      return;
    }

    const rv = await cluster.decrby("bbb", 1);
    res.json({ msg: "Test", counter, rv });
  });

  app.get("/lock", async (req, res) => {
    console.log("in lock");
    try {
      let lock = await redlock.acquire(["aASDF"], 5000);
      try {
        const counter = await cluster.get("bbb");

        if (Number(counter) <= 0) {
          console.log("재고소진.");
          res.json({ msg: "0 됨." });
          return;
        }

        // Something do to db

        const rv = await cluster.decrby("bbb", 1);

        console.log("rv :", rv);
        res.json({ msg: "Test", counter, rv });
      } catch (error) {
        console.log("error :", error);
      } finally {
        await lock.release();
        console.log("unlock");
      }
    } catch (error) {
      res.json({ msg: " lock error", error });
    }
  });

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    res.status(400).json({ msg: err });
  });

  const PORT = 3000;
  const HOST = "0.0.0.0";
  app.listen(PORT, HOST, () => {
    console.log(`conccuruncy distributed redis example`);
  });
};

main();
