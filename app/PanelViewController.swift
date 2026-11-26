import UIKit
import WebKit

/// Full-screen web view. Pages live in the bundle's www folder:
///   www/Phone/phone.html  ETS2.SITE PHONE (main menu; ios-shim.js adapts it and adds the Button Box icon)
///   www/Box/panel.html    Krankmili Button Box
/// Pages talk to native code through window.webkit.messageHandlers.kb. Native code owns both TCP links
/// (KrankmiliServer :5555 and ETS2.SITE PHONE :5565), so switching pages does not drop the connections.
final class PanelViewController: UIViewController, WKScriptMessageHandler {
    static let phonePort = 5565

    private var web: WKWebView!
    private let box = BoxClient()
    private let phone = BoxClient(sendsHello: false, pingLine: "{\"ch\":\"ping\"}")

    // last Krankmili messages, replayed when the Button Box page is opened again
    private var lastLayout: String?
    private var lastStatus: String?
    private var boxState = "disconnected"
    private var boxNote = ""
    private var phoneState = "disconnected"
    private var currentPage = ""

    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

    private var wwwURL: URL? { return Bundle.main.url(forResource: "www", withExtension: nil) }

    override func loadView() {
        let d = UserDefaults.standard
        let savedPort = d.integer(forKey: "port")
        let saved: [String: Any] = [
            "host": d.string(forKey: "host") ?? "",
            "port": savedPort == 0 ? 5555 : savedPort,
            "token": d.string(forKey: "token") ?? "",
        ]
        var savedJson = "{}"
        if let data = try? JSONSerialization.data(withJSONObject: saved, options: []),
           let s = String(data: data, encoding: .utf8) {
            savedJson = s
        }

        let ucc = WKUserContentController()
        ucc.addUserScript(WKUserScript(source: "window.kbSaved = " + savedJson + ";",
                                       injectionTime: .atDocumentStart, forMainFrameOnly: true))
        if let shimURL = Bundle.main.url(forResource: "ios-shim", withExtension: "js"),
           let shim = try? String(contentsOf: shimURL, encoding: .utf8) {
            ucc.addUserScript(WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        ucc.add(WeakHandler(self), name: "kb")

        let cfg = WKWebViewConfiguration()
        cfg.userContentController = ucc
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []

        let w = WKWebView(frame: .zero, configuration: cfg)
        w.isOpaque = false
        w.backgroundColor = .black
        w.scrollView.backgroundColor = .black
        w.scrollView.bounces = false
        w.scrollView.isScrollEnabled = false
        w.scrollView.contentInsetAdjustmentBehavior = .never
        web = w
        view = w
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        box.onLine = { [weak self] line in
            guard let self = self else { return }
            if line.hasPrefix("{\"t\":\"layout\"") { self.lastLayout = line }
            else if line.hasPrefix("{\"t\":\"status\"") { self.lastStatus = line }
            if self.currentPage == "box" { self.toBox(line) }
        }
        box.onState = { [weak self] state, note in
            guard let self = self else { return }
            self.boxState = state
            self.boxNote = note
            if state != "connected" { self.lastLayout = nil; self.lastStatus = nil }
            if self.currentPage == "box" { self.boxStateToPage() }
        }
        phone.onLine = { [weak self] line in
            guard let self = self, self.currentPage == "phone" else { return }
            self.runJS("window.phoneOnLine && window.phoneOnLine(" + PanelViewController.jsString(line) + ")")
        }
        phone.onState = { [weak self] state, _ in
            guard let self = self else { return }
            self.phoneState = state
            if self.currentPage == "phone" { self.phoneStateToPage() }
        }

        // With a saved PC address the app opens on the phone menu and connects right away;
        // the first start goes to the Button Box page, which shows the IP form.
        let d = UserDefaults.standard
        let host = d.string(forKey: "host") ?? ""
        if !host.isEmpty {
            let port = d.integer(forKey: "port")
            connectAll(host: host, port: port == 0 ? 5555 : port, token: d.string(forKey: "token") ?? "")
            load("Phone/phone.html")
        } else {
            load("Box/panel.html")
        }

        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(didEnterBackground),
                       name: UIApplication.didEnterBackgroundNotification, object: nil)
        nc.addObserver(self, selector: #selector(willEnterForeground),
                       name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    private func load(_ relative: String) {
        guard let root = wwwURL else { return }
        web.loadFileURL(root.appendingPathComponent(relative), allowingReadAccessTo: root)
    }

    /// Going to the background closes the links: KrankmiliServer then releases every held key.
    @objc private func didEnterBackground() { box.suspend(); phone.suspend() }
    @objc private func willEnterForeground() { box.resume(); phone.resume() }

    private func connectAll(host: String, port: Int, token: String) {
        box.connect(host: host, port: port, token: token)
        phone.connect(host: host, port: PanelViewController.phonePort, token: "")
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String else { return }
        switch op {
        case "connect":
            // sent by the Button Box page on every load and by its IP form
            currentPage = "box"
            let host = ((body["host"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let port = (body["port"] as? NSNumber)?.intValue ?? Int((body["port"] as? String) ?? "") ?? 5555
            let token = (body["token"] as? String) ?? ""
            if box.isTargeting(host: host, port: port, token: token) {
                replayBox()
            } else {
                let d = UserDefaults.standard
                d.set(host, forKey: "host")
                d.set(port, forKey: "port")
                d.set(token, forKey: "token")
                lastLayout = nil
                lastStatus = nil
                connectAll(host: host, port: port, token: token)
            }
        case "send":
            if let line = body["line"] as? String { box.send(line) }
        case "phone":
            if let line = body["line"] as? String { phone.send(line) }
        case "ready":
            currentPage = (body["page"] as? String) ?? ""
            if currentPage == "phone" { phoneStateToPage() }
        case "openURL":
            if let s = body["url"] as? String, let url = URL(string: s),
               let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        case "disconnect":
            box.disconnect()
            phone.disconnect()
        default:
            break
        }
    }

    private func replayBox() {
        boxStateToPage()
        if let l = lastLayout { toBox(l) }
        if let s = lastStatus { toBox(s) }
    }

    private func toBox(_ line: String) {
        runJS("window.kbOnLine && window.kbOnLine(" + PanelViewController.jsString(line) + ")")
    }

    private func boxStateToPage() {
        runJS("window.kbOnState && window.kbOnState(" + PanelViewController.jsString(boxState) + "," +
              PanelViewController.jsString(boxNote) + ")")
    }

    private func phoneStateToPage() {
        runJS("window.phoneOnState && window.phoneOnState(" + PanelViewController.jsString(phoneState) + ")")
    }

    private func runJS(_ code: String) {
        web.evaluateJavaScript(code, completionHandler: nil)
    }

    /// Swift string -> JavaScript string literal.
    static func jsString(_ s: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [s], options: []),
              let arr = String(data: data, encoding: .utf8), arr.count >= 2 else { return "\"\"" }
        return String(arr.dropFirst().dropLast())
    }
}

/// Avoids the retain cycle WKUserContentController -> handler -> view controller.
final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}
