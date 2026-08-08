import Foundation
import Security

// MARK: - Keychain-backed token store (secure mobile auth per the shared contract)

enum KeychainStore {
    private static let service = "com.shotiq.auth"

    static func save(_ value: String, key: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
        var attrs = query
        attrs[kSecValueData as String] = data
        attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(attrs as CFDictionary, nil)
    }

    static func read(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var out: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess,
              let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Shared API contract (field names mirror the Next.js/Prisma backend)

struct APIUser: Codable, Equatable {
    var id: String?
    var email: String?
    var displayName: String?
    var firstName: String?
    var lastName: String?
    var profileComplete: Bool?
}

struct HistoryStats: Codable {
    var totalAnalyses: Int
    var averageScore: Double?
    var latestScore: Double?
    var overallTrend: String?
    var improvementRate: Double?
}

struct AnalysisSummary: Codable, Identifiable {
    var id: String { "\(title ?? "analysis")-\(createdAt ?? "")" }
    var title: String?
    var createdAt: String?
    var shotType: String?
    var score: Double?
}

struct EliteShooterDTO: Codable, Identifiable {
    var id: Int
    var name: String
    var team: String
    var league: String
    var era: String?
    var tier: String?
    var position: String
    var height: Int
    var weight: Int
    // Every rate below is 0-100, matching /api/shooters. `careerPct` is the
    // legacy name for 3PT%; the four that follow were added so 053 can show the
    // canonical FG% / 3P% / FT% / eFG% / TS% row. FG%, eFG% and TS% are null for
    // any shooter the server serves from the static catalog — they need
    // box-score totals — and every display site renders those as an em dash.
    var careerPct: Double?
    var careerFreeThrowPct: Double
    var careerFieldGoalPct: Double?
    var careerThreePct: Double?
    var careerEfgPct: Double?
    var careerTsPct: Double?
    var approvedFormImages: [String]?
}

struct GoalDTO: Codable, Identifiable {
    var id: String
    var title: String
    var progress: Double?
    var targetDate: String?
    var status: String?
}

struct BadgeProgressDTO: Codable, Equatable {
    var current: Double?
    var total: Double?
}

struct BadgeDTO: Codable, Equatable {
    var id: String?
    var title: String?
    var name: String?
    var description: String?
    var unlocked: Bool?
    var earnedAt: String?
    var progress: BadgeProgressDTO?
    var untracked: String?
}

struct BadgesResponseDTO: Codable, Equatable {
    var success: Bool?
    var profileId: String?
    var badges: [BadgeDTO]?
    var challenges: [BadgeDTO]?
}

struct AnalysisMetricDTO: Codable, Equatable {
    var value: Double?
    var unit: String?
    var source: String
}

struct AnalysisTextMetricDTO: Codable, Equatable {
    var value: String?
    var unit: String?
    var source: String
}

struct AnalysisMediaDTO: Codable, Equatable {
    var type: String?
    var imageUrl: String?
    var annotatedImageUrl: String?
    var displayImageUrl: String?
    var videoUrl: String?
    var localImageUrl: String?
    var localVideoUrl: String?
}

struct AnalysisScoresDTO: Codable, Equatable {
    var overall: AnalysisMetricDTO
    var form: AnalysisMetricDTO
    var balance: AnalysisMetricDTO
    var release: AnalysisMetricDTO
    var consistency: AnalysisMetricDTO
}

struct AnalysisAnglesDTO: Codable, Equatable {
    var elbow: AnalysisMetricDTO
    var knee: AnalysisMetricDTO
    var wrist: AnalysisMetricDTO
    var shoulder: AnalysisMetricDTO
    var hip: AnalysisMetricDTO
    var release: AnalysisMetricDTO
    var kneeMin: AnalysisMetricDTO
}

struct AnalysisMeasurementsDTO: Codable, Equatable {
    var releaseHeightInches: AnalysisMetricDTO
    var releaseDistanceInches: AnalysisMetricDTO
    var verticalJumpInches: AnalysisMetricDTO
    var centerlineDeviationDeg: AnalysisMetricDTO
}

struct AnalysisProvenanceDTO: Codable, Equatable {
    var measured: [String]
    var missing: [String]
    var estimated: [String]
    var demo: [String]
}

struct ShotIQAnalysisResultDTO: Codable, Identifiable, Equatable {
    var id: String
    var clientSessionId: String?
    var captureSessionId: String?
    var recordedAt: String
    var source: String
    var media: AnalysisMediaDTO
    var scores: AnalysisScoresDTO
    var angles: AnalysisAnglesDTO
    var measurements: AnalysisMeasurementsDTO
    var phase: AnalysisTextMetricDTO
    var provenance: AnalysisProvenanceDTO
}

struct LatestAnalysisResponseDTO: Codable, Equatable {
    var success: Bool
    var analysis: ShotIQAnalysisResultDTO?
    var analysisResult: ShotIQAnalysisResultDTO?

    var result: ShotIQAnalysisResultDTO? { analysisResult ?? analysis }
}

// MARK: - API client (async/await, URLSession, rotating token refresh)

actor APIClient {
    static let shared = APIClient()

    struct ShotEventRecordBody: Codable, Equatable {
        struct Event: Codable, Equatable {
            var sequence: Int
            var detected = true
            var detectedResult: String
            var confidence: Double
            var metadata: [String: String]
        }

        var events: [Event]
    }

    /// Same origin the web client talks to (the live production deploy);
    /// override with the SHOTIQ_API environment variable (Xcode scheme →
    /// Run → Arguments → Environment Variables) for local/staging servers.
    var baseURL = URL(string: ProcessInfo.processInfo.environment["SHOTIQ_API"] ?? "https://shotiq.194-146-12-139.sslip.io")!

    private var accessToken: String? { KeychainStore.read(key: "accessToken") }

    /// Double-submit CSRF token. The backend rejects every state-changing
    /// request (signin/signup included) unless the `csrf-token` cookie set by
    /// GET /api/auth/csrf is echoed back in the `x-csrf-token` header —
    /// URLSession stores the cookie automatically; this caches the header value.
    private var csrfToken: String?

    enum APIError: Error { case http(Int), decode, network }

    private func ensureCsrfToken(force: Bool = false) async throws {
        if csrfToken != nil && !force { return }
        struct Resp: Codable { var csrfToken: String }
        var req = URLRequest(url: baseURL.appending(path: "/api/auth/csrf"))
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard (resp as? HTTPURLResponse)?.statusCode == 200,
              let decoded = try? JSONDecoder().decode(Resp.self, from: data) else {
            throw APIError.network
        }
        csrfToken = decoded.csrfToken
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: Encodable? = nil, retriedCsrf: Bool = false, retriedAuth: Bool = false) async throws -> T {
        if method != "GET" { try await ensureCsrfToken() }
        var req = URLRequest(url: baseURL.appending(path: path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if method != "GET", let csrf = csrfToken {
            req.setValue(csrf, forHTTPHeaderField: "x-csrf-token")
        }
        if let token = accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.network }
        // Refresh and retry ONCE. Without the guard a server that keeps
        // answering 401 sends this into an unbounded refresh/retry loop.
        if http.statusCode == 401 && !retriedAuth {
            try await refreshTokens()
            return try await request(path, method: method, body: body,
                                     retriedCsrf: retriedCsrf, retriedAuth: true)
        }
        // A stale/expired CSRF pair comes back as 403 — fetch a fresh token once.
        if http.statusCode == 403 && method != "GET" && !retriedCsrf {
            try await ensureCsrfToken(force: true)
            return try await request(path, method: method, body: body,
                                     retriedCsrf: true, retriedAuth: retriedAuth)
        }
        guard (200..<300).contains(http.statusCode) else { throw APIError.http(http.statusCode) }
        do { return try JSONDecoder().decode(T.self, from: data) } catch { throw APIError.decode }
    }

    /// Trade a still-valid session token for a fresh one (POST /api/auth/refresh).
    ///
    /// THIS USED TO SIGN PEOPLE OUT FOR THE WRONG REASONS. It required a
    /// `refreshToken` in the Keychain, which the backend never issued, so it
    /// threw 401 before sending anything. And it wiped BOTH Keychain entries on
    /// any non-200 at all — the route itself answered 404 because it did not
    /// exist, a flaky network answers nothing, and every one of those was read
    /// as "your session is gone" and threw the player back to the sign-in screen.
    ///
    /// Now: the access token is the credential when no separate refresh token
    /// was issued (this backend mints one session JWT, not two), and the
    /// Keychain is cleared ONLY when the server explicitly says the session is
    /// dead. A 404, a 500, or no answer at all leaves the tokens alone so the
    /// next request can try again.
    private func refreshTokens() async throws {
        let credential = KeychainStore.read(key: "refreshToken")
            ?? KeychainStore.read(key: "accessToken")
        guard let credential else { throw APIError.http(401) }

        struct Refresh: Codable { var accessToken: String?; var refreshToken: String? }
        var req = URLRequest(url: baseURL.appending(path: "/api/auth/refresh"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(credential)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONEncoder().encode(["refreshToken": credential])

        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.network }

        // Only an explicit 401 means the session is over. Signing out on
        // anything else is what made one bad request look like a logout.
        if http.statusCode == 401 {
            signOut()
            throw APIError.http(401)
        }
        guard (200..<300).contains(http.statusCode),
              let tokens = try? JSONDecoder().decode(Refresh.self, from: data),
              let access = tokens.accessToken else {
            throw APIError.http(http.statusCode)
        }

        KeychainStore.save(access, key: "accessToken")
        // The backend has one token; it echoes it here so both Keychain keys
        // stay in step whether or not a separate refresh credential ever exists.
        KeychainStore.save(tokens.refreshToken ?? access, key: "refreshToken")
    }

    // MARK: endpoints (mirroring the web client)

    func signIn(email: String, password: String) async throws -> APIUser {
        struct Resp: Codable { var user: APIUser; var accessToken: String?; var refreshToken: String? }
        let r: Resp = try await request("/api/auth/signin", method: "POST",
                                        body: ["email": email, "password": password])
        // The backend returns one session token. Both Keychain keys are written
        // from it so `refreshTokens` has a credential to present — this app
        // used to save nothing here, because signin returned no token at all,
        // and every Bearer header it sent afterwards was empty.
        if let a = r.accessToken {
            KeychainStore.save(a, key: "accessToken")
            KeychainStore.save(r.refreshToken ?? a, key: "refreshToken")
        }
        return r.user
    }

    func signOut() { KeychainStore.delete(key: "accessToken"); KeychainStore.delete(key: "refreshToken") }

    func history(limit: Int = 100) async throws -> (stats: HistoryStats?, items: [AnalysisSummary]) {
        struct Resp: Codable { var success: Bool; var stats: HistoryStats?; var history: [AnalysisSummary]? }
        let r: Resp = try await request("/api/analysis-history?limit=\(limit)")
        return (r.stats, r.history ?? [])
    }

    func shooters() async throws -> [EliteShooterDTO] {
        struct Resp: Codable { var shooters: [EliteShooterDTO] }
        let r: Resp = try await request("/api/shooters")
        return r.shooters
    }

    func goals() async throws -> [GoalDTO] {
        struct Resp: Codable { var goals: [GoalDTO]? }
        let r: Resp = try await request("/api/goals")
        return r.goals ?? []
    }

    func badges() async throws -> BadgesResponseDTO {
        try await request("/api/badges")
    }

    func refreshBadges() async throws -> BadgesResponseDTO {
        struct EmptyBody: Codable {}
        return try await request("/api/badges", method: "POST", body: EmptyBody())
    }

    func latestAnalysis() async throws -> ShotIQAnalysisResultDTO? {
        let r: LatestAnalysisResponseDTO = try await request("/api/analysis/latest")
        return r.result
    }

    func recordShotEvent(drillId: String, made: Bool) async -> Bool {
        struct Empty: Codable {}
        let body = Self.shotEventRecordBody(drillId: drillId, made: made)
        do {
            _ = try await request("/api/shot-events", method: "POST", body: body) as Empty?
            return true
        } catch {
            return false
        }
    }

    static func shotEventRecordBody(drillId: String, made: Bool) -> ShotEventRecordBody {
        ShotEventRecordBody(events: [
            .init(sequence: 0,
                  detectedResult: made ? "make" : "miss",
                  confidence: 1.0,
                  metadata: ["drillId": drillId, "source": "ios-live-capture"])
        ])
    }

    // MARK: generic helpers so every screen can reach any web endpoint

    /// Typed call for arbitrary endpoints (mirrors the web client). Screens
    /// define their own Codable request/response structs.
    func call<T: Decodable>(_ path: String, method: String = "GET", body: Encodable? = nil) async throws -> T {
        try await request(path, method: method, body: body)
    }

    /// Fire-and-forget mutation where the response body doesn't matter.
    func send(_ path: String, method: String = "POST", body: Encodable? = nil) async {
        struct Anything: Codable {}
        _ = try? await request(path, method: method, body: body) as Anything?
    }

    /// Resumable-compatible video upload matching the web `/api/media-uploads`
    /// flow. Native sends every part in this foreground pass; the server keeps
    /// the same durable `clientSessionId` join used by `/api/save-analysis`.
    func uploadVideo(_ fileURL: URL,
                     filename: String,
                     contentType: String,
                     sizeBytes: Int,
                     clientSessionId: String,
                     durationSeconds: Double?) async throws -> String? {
        struct InitiateBody: Codable {
            var clientSessionId: String
            var fileName: String
            var contentType: String
            var sizeBytes: Int
        }
        struct UploadDTO: Codable {
            var id: String?
            var status: String?
            var mediaUrl: String?
        }
        struct InitiateResp: Codable {
            var success: Bool?
            var upload: UploadDTO?
        }
        struct PartBody: Codable { var partNumber: Int }
        struct PartResp: Codable {
            var success: Bool?
            var partNumber: Int?
            var url: String?
        }
        struct CompletedPart: Codable {
            var partNumber: Int
            var eTag: String
        }
        struct CompleteBody: Codable {
            var parts: [CompletedPart]
            var durationSeconds: Double?
        }
        struct CompleteResp: Codable {
            var success: Bool?
            var upload: UploadDTO?
        }

        let initiated: InitiateResp = try await request(
            "/api/media-uploads", method: "POST",
            body: InitiateBody(clientSessionId: clientSessionId,
                               fileName: filename,
                               contentType: contentType,
                               sizeBytes: sizeBytes))
        guard let upload = initiated.upload, let uploadId = upload.id else { throw APIError.decode }
        if upload.status == "complete" { return upload.mediaUrl }

        let fileData = try Data(contentsOf: fileURL)
        let partSize = 8 * 1_024 * 1_024
        var completedParts: [CompletedPart] = []
        var offset = 0
        var partNumber = 1
        while offset < fileData.count {
            let next = min(fileData.count, offset + partSize)
            let signed: PartResp = try await request(
                "/api/media-uploads/\(uploadId)/parts", method: "POST",
                body: PartBody(partNumber: partNumber))
            guard let signedURLString = signed.url, let signedURL = URL(string: signedURLString) else {
                throw APIError.decode
            }

            var put = URLRequest(url: signedURL)
            put.httpMethod = "PUT"
            put.setValue(contentType, forHTTPHeaderField: "Content-Type")
            let partData = fileData.subdata(in: offset..<next)
            let (_, response) = try await URLSession.shared.upload(for: put, from: partData)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw APIError.http((response as? HTTPURLResponse)?.statusCode ?? 0)
            }
            guard let eTag = (response as? HTTPURLResponse)?.value(forHTTPHeaderField: "ETag") else {
                throw APIError.decode
            }
            completedParts.append(CompletedPart(partNumber: partNumber, eTag: eTag))
            offset = next
            partNumber += 1
        }

        let completed: CompleteResp = try await request(
            "/api/media-uploads/\(uploadId)/complete", method: "POST",
            body: CompleteBody(parts: completedParts, durationSeconds: durationSeconds))
        return completed.upload?.mediaUrl
    }

    /// Multipart image upload matching POST /api/upload (field "image").
    func uploadImage(_ imageData: Data, filename: String = "shot.jpg",
                     uploadType: String = "user",
                     shootingAngle: String? = nil,
                     imageCategory: String? = nil,
                     capturePhase: String? = nil) async throws -> Data {
        try await ensureCsrfToken()
        var req = URLRequest(url: baseURL.appending(path: "/api/upload"))
        req.httpMethod = "POST"
        let boundary = "shotiq-\(UUID().uuidString)"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let csrf = csrfToken { req.setValue(csrf, forHTTPHeaderField: "x-csrf-token") }
        if let token = accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        var bodyData = Data()
        func field(_ name: String, _ value: String) {
            bodyData.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".data(using: .utf8)!)
        }
        field("uploadType", uploadType)
        if let shootingAngle {
            field("angle", shootingAngle)
            field("shootingAngle", shootingAngle)
        }
        if let imageCategory { field("imageCategory", imageCategory) }
        if let capturePhase { field("capturePhase", capturePhase) }
        bodyData.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"image\"; filename=\"\(filename)\"\r\nContent-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        bodyData.append(imageData)
        bodyData.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = bodyData
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.http((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return data
    }
}

/// Type-erasing encodable wrapper so the client can send dictionary bodies.
struct AnyEncodable: Encodable {
    private let encodeFn: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { encodeFn = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encodeFn(encoder) }
}
