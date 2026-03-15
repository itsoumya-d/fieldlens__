import WidgetKit
import SwiftUI

// MARK: - Data Model
struct FieldLensWidgetEntry: TimelineEntry {
    let date: Date
    let value: Int
}

// MARK: - Timeline Provider
struct FieldLensWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> FieldLensWidgetEntry {
        FieldLensWidgetEntry(date: Date(), value: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (FieldLensWidgetEntry) -> Void) {
        completion(FieldLensWidgetEntry(date: Date(), value: loadValue()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FieldLensWidgetEntry>) -> Void) {
        let entry = FieldLensWidgetEntry(date: Date(), value: loadValue())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadValue() -> Int {
        let defaults = UserDefaults(suiteName: "group.com.fieldlens.app")
        return defaults?.integer(forKey: "fieldlens_open_jobs") ?? 0
    }
}

// MARK: - Widget View
struct FieldLensWidgetEntryView: View {
    var entry: FieldLensWidgetEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(Color(red: 0.9, green: 0.6, blue: 0.1).gradient)
            VStack(alignment: .leading, spacing: 4) {
                Text("🔧")
                    .font(.title2)
                Spacer()
                Text("\(entry.value)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("open jobs")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.85))
            }
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Widget Configuration
struct FieldLensWidget: Widget {
    let kind: String = "FieldLensWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FieldLensWidgetProvider()) { entry in
            FieldLensWidgetEntryView(entry: entry)
                .containerBackground(Color(red: 0.9, green: 0.6, blue: 0.1).gradient, for: .widget)
        }
        .configurationDisplayName("FieldLens")
        .description("See your open field jobs at a glance")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview
#Preview(as: .systemSmall) {
    FieldLensWidget()
} timeline: {
    FieldLensWidgetEntry(date: .now, value: 7)
}
