import Foundation
import Network

/// TCP client for KrankmiliServer (newline-delimited JSON, same protocol as the Android app).
/// Reconnects every 2 s until disconnect() is called. Callbacks arrive on the main thread.
final class BoxClient {
    var onLine: ((String) -> Void)?
    var onState: ((String, String) -> Void)?   // "connecting" | "disconnected", note

    private let queue = DispatchQueue(label: "krankmili.client")
    private var conn: NWConnection?
    private var buffer = Data()
    private var host = ""
    private var port = 5555
    private var token = ""
    private var wanted = false
    private var generation = 0
    private var pingTimer: DispatchSourceTimer?
    private var lastRx = Date()

    func connect(host: String, port: Int, token: String) {
        queue.async {
            self.host = host
            self.port = port
            self.token = token
            self.wanted = true
            self.start()
        }
    }

    func disconnect() {
        queue.async {
            self.wanted = false
            self.teardown()
            self.emit("disconnected", "")
        }
    }

    /// App went to the background: close the link but remember to come back.
    func suspend() { queue.async { self.teardown() } }

    func resume() { queue.async { if self.wanted && self.conn == nil { self.start() } } }

    func send(_ line: String) { queue.async { self.write(line) } }

    // MARK: - internals (all on `queue`)

    private func emit(_ state: String, _ note: String) {
        DispatchQueue.main.async { self.onState?(state, note) }
    }

    private func start() {
        teardown()
        let gen = generation
        guard !host.isEmpty, port > 0, port < 65536, let p = NWEndpoint.Port(rawValue: UInt16(port)) else {
            emit("disconnected", "PC'nin IP adresini gir")
            return
        }
        emit("connecting", "")

        let tcp = NWProtocolTCP.Options()
        tcp.noDelay = true
        tcp.connectionTimeout = 4
        let params = NWParameters(tls: nil, tcp: tcp)
        let c = NWConnection(host: NWEndpoint.Host(host), port: p, using: params)
        conn = c
        c.stateUpdateHandler = { [weak self] st in
            guard let self = self, gen == self.generation else { return }
            switch st {
            case .ready:
                self.buffer.removeAll()
                self.lastRx = Date()
                let hello: [String: Any] = ["t": "hello", "token": self.token]
                if let d = try? JSONSerialization.data(withJSONObject: hello, options: []),
                   let s = String(data: d, encoding: .utf8) {
                    self.write(s)
                }
                self.receive(c, gen)
                self.startPing(gen)
            case .waiting(let e):
                self.fail(gen, e.localizedDescription)
            case .failed(let e):
                self.fail(gen, e.localizedDescription)
            default:
                break
            }
        }
        c.start(queue: queue)
    }

    private func receive(_ c: NWConnection, _ gen: Int) {
        c.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, isComplete, error in
            guard let self = self, gen == self.generation else { return }
            if let data = data, !data.isEmpty {
                self.lastRx = Date()
                self.buffer.append(data)
                while let nl = self.buffer.firstIndex(of: 10) {
                    let lineData = self.buffer.subdata(in: self.buffer.startIndex..<nl)
                    self.buffer.removeSubrange(self.buffer.startIndex...nl)
                    guard let line = String(data: lineData, encoding: .utf8) else { continue }
                    let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                    if trimmed.isEmpty || trimmed.contains("\"pong\"") { continue }
                    DispatchQueue.main.async { self.onLine?(trimmed) }
                }
            }
            if isComplete { self.fail(gen, "sunucu bağlantıyı kapattı"); return }
            if let error = error { self.fail(gen, error.localizedDescription); return }
            self.receive(c, gen)
        }
    }

    /// The server answers every ping with a pong, so 6 s of silence means a dead link.
    private func startPing(_ gen: Int) {
        pingTimer?.cancel()
        let t = DispatchSource.makeTimerSource(queue: queue)
        t.schedule(deadline: .now() + 2, repeating: 2)
        t.setEventHandler { [weak self] in
            guard let self = self, gen == self.generation else { return }
            if Date().timeIntervalSince(self.lastRx) > 6 { self.fail(gen, "zaman aşımı"); return }
            self.write("{\"t\":\"ping\"}")
        }
        pingTimer = t
        t.resume()
    }

    private func write(_ line: String) {
        guard let c = conn, let data = (line + "\n").data(using: .utf8) else { return }
        c.send(content: data, completion: .contentProcessed { _ in })
    }

    private func fail(_ gen: Int, _ note: String) {
        guard gen == generation else { return }
        teardown()
        guard wanted else { return }
        emit("connecting", note)
        let g = generation
        queue.asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self = self, self.wanted, g == self.generation, self.conn == nil else { return }
            self.start()
        }
    }

    private func teardown() {
        generation += 1
        pingTimer?.cancel()
        pingTimer = nil
        if let c = conn {
            c.stateUpdateHandler = nil
            c.cancel()   // closing the socket makes the server release every held key
        }
        conn = nil
    }
}
