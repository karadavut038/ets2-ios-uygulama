import UIKit

final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.backgroundColor = UIColor(red: 0.063, green: 0.075, blue: 0.09, alpha: 1)
        w.rootViewController = PanelViewController()
        w.makeKeyAndVisible()
        window = w
        application.isIdleTimerDisabled = true   // screen stays on while the panel is open
        return true
    }
}
