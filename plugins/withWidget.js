// Expo config plugin: adds iOS WidgetKit extension for FieldLens
// Run `expo prebuild` to generate native files, then EAS Build will include the widget.
const { withXcodeProject, withEntitlementsPlist, IOSConfig } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_NAME = 'FieldLensWidget';
const BUNDLE_ID = 'com.fieldlens.app.widget';
const APP_GROUP = 'group.com.fieldlens.app';

/**
 * Copies Swift widget source files into the generated iOS project and
 * registers them as a new WidgetKit extension target.
 */
const withWidgetExtension = (config) => {
  // 1. Copy Swift files into ios/{WidgetName}/ during prebuild
  config = withXcodeProject(config, async (cfg) => {
    const xcodeProject = cfg.modResults;
    const iosDir = cfg.modRequest.platformProjectRoot;
    const widgetDir = path.join(iosDir, WIDGET_NAME);
    const srcDir = path.join(cfg.modRequest.projectRoot, 'widgets', 'ios');

    fs.mkdirSync(widgetDir, { recursive: true });

    // Copy Swift source
    const swiftSrc = path.join(srcDir, WIDGET_NAME + '.swift');
    if (fs.existsSync(swiftSrc)) {
      fs.copyFileSync(swiftSrc, path.join(widgetDir, WIDGET_NAME + '.swift'));
    }

    // Write Info.plist for widget extension
    const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(widgetDir, 'Info.plist'), infoPlist, 'utf8');

    // Add widget target to Xcode project
    try {
      const widgetTarget = xcodeProject.addTarget(
        WIDGET_NAME,
        'app_extension',
        WIDGET_NAME,
        BUNDLE_ID
      );

      // Add build phase
      xcodeProject.addBuildPhase(
        [WIDGET_NAME + '.swift'],
        'PBXSourcesBuildPhase',
        'Sources',
        widgetTarget.uuid
      );

      // Link WidgetKit framework
      xcodeProject.addFramework('WidgetKit.framework', { target: widgetTarget.uuid });
      xcodeProject.addFramework('SwiftUI.framework', { target: widgetTarget.uuid });

      // Build settings
      const configurations = xcodeProject.pbxXCBuildConfigurationSection();
      Object.entries(configurations).forEach(([key, config]) => {
        if (config.buildSettings && config.buildSettings.PRODUCT_NAME === WIDGET_NAME) {
          config.buildSettings.SWIFT_VERSION = '5.0';
          config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
          config.buildSettings.INFOPLIST_FILE = WIDGET_NAME + '/Info.plist';
        }
      });
    } catch (e) {
      console.warn('[withWidget] Xcode target setup warning:', e.message);
    }

    return cfg;
  });

  // 2. Add App Groups entitlement to main app
  config = withEntitlementsPlist(config, (cfg) => {
    if (!cfg.modResults['com.apple.security.application-groups']) {
      cfg.modResults['com.apple.security.application-groups'] = [];
    }
    const groups = cfg.modResults['com.apple.security.application-groups'];
    if (!groups.includes(APP_GROUP)) groups.push(APP_GROUP);
    return cfg;
  });

  return config;
};

module.exports = withWidgetExtension;
