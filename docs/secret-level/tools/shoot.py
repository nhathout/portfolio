"""Headless QA driver: open the game in Chrome, poke it, screenshot it.

Why CDP and not `chrome --screenshot`: the level needs a click to start, and
`--virtual-time-budget` freezes kaplay's rAF loop (the canvas stops repainting
while JS keeps going), so anything after the first frame never shows up.

    python tools/shoot.py out.png --map la_house_in
    python tools/shoot.py out.png --map boston --wait 2 --keys right,right,e
    python tools/shoot.py out.png --url "?map=route&all" --eval "window.__sl.game.state.map"

Assumes `python3 -m http.server 8321` is serving docs/ (see README).
"""
import argparse, base64, json, os, shutil, socket, subprocess, sys, tempfile, time
import urllib.request

import websocket  # websocket-client

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
KEYCODES = {  # what kaplay's window-level handler looks at is `code`
    "left": ("ArrowLeft", 37), "right": ("ArrowRight", 39),
    "up": ("ArrowUp", 38), "down": ("ArrowDown", 40),
    "e": ("KeyE", 69), "space": ("Space", 32), "escape": ("Escape", 27),
    "enter": ("Enter", 13),
}


class Tab:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.n = 0

    def send(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def key(self, name):
        code, win = KEYCODES[name]
        for typ in ("keyDown", "keyUp"):
            self.send("Input.dispatchKeyEvent", type=typ, code=code, key=code,
                      windowsVirtualKeyCode=win, nativeVirtualKeyCode=win)
            time.sleep(0.06)

    def click(self, x, y):
        for typ in ("mousePressed", "mouseReleased"):
            self.send("Input.dispatchMouseEvent", type=typ, x=x, y=y,
                      button="left", clickCount=1)
            time.sleep(0.05)


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--map", default=None)
    ap.add_argument("--url", default=None, help="query string, e.g. '?map=la&all'")
    ap.add_argument("--host", default="http://localhost:8321/secret-level/")
    ap.add_argument("--wait", type=float, default=1.5, help="seconds after start")
    ap.add_argument("--keys", default="", help="comma list: right,right,e,…")
    ap.add_argument("--eval", default=None, help="JS expression to print")
    ap.add_argument("--size", default="640x480")
    a = ap.parse_args()

    q = a.url if a.url else (f"?map={a.map}&reset=1" if a.map else "?reset=1")
    url = a.host + q
    w, h = (int(v) for v in a.size.split("x"))
    port = free_port()
    prof = tempfile.mkdtemp(prefix="slqa-")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", "--enable-unsafe-swiftshader", "--mute-audio",
         "--hide-scrollbars", "--remote-allow-origins=*", f"--user-data-dir={prof}",
         f"--remote-debugging-port={port}", f"--window-size={w},{h}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        ws_url = None
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list"))
                pages = [t for t in tabs if t["type"] == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except Exception:
                pass
            time.sleep(0.15)
        if not ws_url:
            sys.exit("chrome never came up")

        tab = Tab(ws_url)
        tab.send("Page.enable")
        tab.send("Runtime.enable")
        tab.send("Page.navigate", url=url)
        time.sleep(2.2)
        # the DOM start button (kaplay steals focus otherwise — see world.js)
        tab.send("Runtime.evaluate", expression=
                 "(document.getElementById('btn-start')||document.querySelector('#start button,#intro button'))?.click()")
        time.sleep(a.wait)
        for name in [k.strip() for k in a.keys.split(",") if k.strip()]:
            tab.key(name)
            time.sleep(0.25)
        if a.eval:
            r = tab.send("Runtime.evaluate", expression=a.eval, returnByValue=True)
            print("eval:", json.dumps(r.get("result", {}).get("value")))
        errs = tab.send("Runtime.evaluate", returnByValue=True, expression=
                        "JSON.stringify({err: localStorage.getItem('sl_lasterror')})")
        print("errors:", errs.get("result", {}).get("value"))
        shot = tab.send("Page.captureScreenshot", format="png")
        with open(a.out, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print("wrote", a.out)
    finally:
        proc.terminate()
        shutil.rmtree(prof, ignore_errors=True)


if __name__ == "__main__":
    main()
