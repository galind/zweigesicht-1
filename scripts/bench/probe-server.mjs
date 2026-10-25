/** Loopback-only collector for the visible-browser console probe.
 * Start at the repository root, then load workload-probe.js from this origin.
 * Evidence and generated assets stay ignored/local.
 */
import http from "node:http";
import fs from "node:fs/promises";
const out = process.env.PLAY_QA_OUTPUT || "artifacts/bench-performance";
await fs.mkdir(out, { recursive: true });
http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:4198");
    try {
      if (req.method === "POST" && req.url === "/report") {
        let body = "";
        for await (const c of req) {
          body += c;
          if (body.length > 32 * 1024 * 1024) throw Error("Report too large");
        }
        const report = JSON.parse(body);
        if (!/^[a-zA-Z0-9_-]+$/.test(report.label)) throw Error("Invalid report label");
        await fs.writeFile(`${out}/${report.label}.json`, JSON.stringify(report));
        console.log("Saved", report.label, report.samples.length, "samples");
        res.end("ok");
      } else if (req.method === "GET" && req.url === "/probe.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(await fs.readFile("scripts/bench/workload-probe.js"));
      } else {
        res.statusCode = 404;
        res.end();
      }
    } catch (error) {
      res.statusCode = 400;
      res.end(String(error));
    }
  })
  .listen(4201, "127.0.0.1", () =>
    console.log("Local probe collector: http://127.0.0.1:4201/probe.js"),
  );
