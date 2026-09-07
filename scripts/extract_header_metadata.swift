import Foundation
import Quartz
import Vision

guard CommandLine.arguments.count > 1 else {
    print("{}")
    exit(0)
}

let pdfPath = CommandLine.arguments[1]

guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)), let page = doc.page(at: 0) else {
    print("{}")
    exit(0)
}

let bounds = page.bounds(for: .mediaBox)
let w = Int(bounds.width * 2)
let h = Int(bounds.height * 2)
let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
    print("{}")
    exit(0)
}
ctx.scaleBy(x: 2, y: 2)
page.draw(with: .mediaBox, to: ctx)
guard let img = ctx.makeImage() else {
    print("{}")
    exit(0)
}

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
let handler = VNImageRequestHandler(cgImage: img, options: [:])
try? handler.perform([req])

let lines = (req.results as? [VNRecognizedTextObservation])?.compactMap { $0.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines) } ?? []

var meta: [String: String] = [:]
let full = lines.joined(separator: "\n")

// Part No
if let match = full.range(of: #"(?:Part\s*No\.?|भाग\s*क्र\.?)\s*[:;]?\s*(\d+)"#, options: .regularExpression) {
    let sub = String(full[match])
    meta["part_no"] = sub.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
}

// Station Name & Address
for i in 0..<lines.count {
    let l = lines[i].lowercased()
    if l.contains("name of polling station") {
        if i + 1 < lines.count && !lines[i + 1].lowercased().contains("address") {
            meta["station_name"] = lines[i + 1]
        }
    }
    if l.contains("address of polling station") {
        var addrParts: [String] = []
        for j in (i + 1)..<min(lines.count, i + 6) {
            let nextLine = lines[j]
            if nextLine.contains("4. NUMBER OF") || nextLine.contains("Starting") || nextLine.contains("Type of Polling") {
                break
            }
            addrParts.append(nextLine)
        }
        meta["station_address"] = addrParts.joined(separator: " ").replacingOccurrences(of: "-\n", with: "").replacingOccurrences(of: "- ", with: "")
    }
    if l.contains("sections in the part") {
        if i + 1 < lines.count {
            meta["section_name"] = lines[i + 1]
        }
    }
    if l.contains("pin code") || l.contains("pincode") {
        if let match = full.range(of: #"\b(4\d{5})\b"#, options: .regularExpression) {
            meta["pincode"] = String(full[match])
        }
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
if let d = try? encoder.encode(meta), let s = String(data: d, encoding: .utf8) {
    print(s)
}
