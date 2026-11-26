import UIKit
import WebKit

/// Full-screen web view showing panel.html. The page talks to native code through
/// window.webkit.messageHandlers.kb; native code owns the TCP link to KrankmiliServer.
final class PanelViewController: UIViewController, WKScriptMessageHandler {
    private var web: WKWebView!
    private let client = BoxClient()

    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

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
        ucc.add(WeakHandler(self), name: "kb")

        let cfg = WKWebViewConfiguration()
        cfg.userContentController = ucc
        cfg.allowsInlineMediaPlayback = true

        let w = WKWebView(frame: .zero, configuration: cfg)
        w.isOpaque = false
        w.backgroundColor = UIColor(red: 0.063, green: 0.075, blue: 0.09, alpha: 1)
        w.scrollView.backgroundColor = w.backgroundColor
        w.scrollView.bounces = false
        w.scrollView.isScrollEnabled = false
        w.scrollView.contentInsetAdjustmentBehavior = .never
        web = w
        view = w
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        client.onLine = { [weak self] line in
            self?.runJS("window.kbOnLine && window.kbOnLine(" + PanelViewController.jsString(line) + ")")
        }
        client.onState = { [weak self] state, note in
            self?.runJS("window.kbOnState && window.kbOnState(" + PanelViewController.jsString(state) + "," +
                        PanelViewController.jsString(note) + ")")
        }

        if let url = Bundle.main.url(forResource: "panel", withExtension: "html") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }

        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(didEnterBackground),
                       name: UIApplication.didEnterBackgroundNotification, object: nil)
        nc.addObserver(self, selector: #selector(willEnterForeground),
                       name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    /// Going to the background closes the link: the server then releases every held key.
    @objc private func didEnterBackground() { client.suspend() }
    @objc private func willEnterForeground() { client.resume() }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String else { return }
        switch op {
        case "connect":
            let host = ((body["host"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let port = (body["port"] as? NSNumber)?.intValue ?? Int((body["port"] as? String) ?? "") ?? 5555
            let token = (body["token"] as? String) ?? ""
            let d = UserDefaults.standard
            d.set(host, forKey: "host")
            d.set(port, forKey: "port")
            d.set(token, forKey: "token")
            client.connect(host: host, port: port, token: token)
        case "send":
            if let line = body["line"] as? String { client.send(line) }
        case "disconnect":
            client.disconnect()
        default:
            break
        }
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
