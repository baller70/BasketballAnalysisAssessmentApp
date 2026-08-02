// GENERATED from the canonical HoopTrackLayoutSidecar design tokens.
// Source: 92 embedded screens, batch shotiq-white-court-imagegen2-2026-07-30-v2.
// Verified identical across all 92 screens (zero drift).
// Regenerate with tools/shotiq-sidecar/emit.py - do not hand-edit.

import SwiftUI

public enum ShotIQColor {
    /// #2D6CDF
    public static let analysisBlue = Color(red: 0.176471, green: 0.423529, blue: 0.874510)
    /// #168A55
    public static let confirmGreen = Color(red: 0.086275, green: 0.541176, blue: 0.333333)
    /// #5F646B
    public static let graphite = Color(red: 0.372549, green: 0.392157, blue: 0.419608)
    /// #111111
    public static let ink = Color(red: 0.066667, green: 0.066667, blue: 0.066667)
    /// #A7AAB0
    public static let muted = Color(red: 0.654902, green: 0.666667, blue: 0.690196)
    /// #FFFFFF
    public static let paper = Color(red: 1.000000, green: 1.000000, blue: 1.000000)
    /// #D92D20
    public static let reviewRed = Color(red: 0.850980, green: 0.176471, blue: 0.125490)
    /// #D9D9D4
    public static let rule = Color(red: 0.850980, green: 0.850980, blue: 0.831373)
    /// #FD3701
    public static let shotiqOrange = Color(red: 0.992157, green: 0.215686, blue: 0.003922)
    /// #F7F7F4
    public static let warmCanvas = Color(red: 0.968627, green: 0.968627, blue: 0.956863)
}

public enum ShotIQSpacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 24
    public static let xl: CGFloat = 32
}

public enum ShotIQRadius {
    public static let none: CGFloat = 0
    public static let control: CGFloat = 6
    public static let card: CGFloat = 8
    public static let pill: CGFloat = 999
}

public enum ShotIQTypography {
    public static let body = ShotIQTextStyle(family: "Inter", size: 16, weight: 400, lineHeight: 22, letterSpacing: 0)
    public static let brand = ShotIQTextStyle(family: "Inter", size: 28, weight: 900, lineHeight: 32, letterSpacing: 0)
    public static let button = ShotIQTextStyle(family: "Inter", size: 16, weight: 700, lineHeight: 22, letterSpacing: 0)
    public static let caption = ShotIQTextStyle(family: "Inter", size: 12, weight: 500, lineHeight: 16, letterSpacing: 0)
    public static let h1 = ShotIQTextStyle(family: "Bebas Neue", size: 64, weight: 900, lineHeight: 70, letterSpacing: 0)
    public static let h2 = ShotIQTextStyle(family: "Bebas Neue", size: 40, weight: 900, lineHeight: 46, letterSpacing: 0)
    public static let h3 = ShotIQTextStyle(family: "Bebas Neue", size: 28, weight: 800, lineHeight: 34, letterSpacing: 0)
    public static let h4 = ShotIQTextStyle(family: "Inter", size: 18, weight: 700, lineHeight: 24, letterSpacing: 0)
    public static let h5 = ShotIQTextStyle(family: "Inter", size: 14, weight: 700, lineHeight: 20, letterSpacing: 0)
    public static let label = ShotIQTextStyle(family: "Inter", size: 12, weight: 700, lineHeight: 16, letterSpacing: 0)
    public static let numeric = ShotIQTextStyle(family: "DIN Condensed", size: 40, weight: 800, lineHeight: 44, letterSpacing: 0)
}

public struct ShotIQTextStyle {
    public let family: String
    public let size: CGFloat
    public let weight: Int
    public let lineHeight: CGFloat
    public let letterSpacing: CGFloat
}

public enum ShotIQCanvas {
    public static let ios = CGSize(width: 853, height: 1844)
    public static let desktop = CGSize(width: 1440, height: 900)
}
