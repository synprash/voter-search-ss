import Foundation
import Vision
import AppKit
import Quartz

guard CommandLine.arguments.count > 2 else {
    print("Usage: parse_pdf_to_json <pdf_path> <output_json>")
    exit(1)
}

let pdfPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let pdfURL = URL(fileURLWithPath: pdfPath)
guard let pdfDoc = PDFDocument(url: pdfURL) else {
    print("Failed to open PDF")
    exit(1)
}

struct ParsedBox: Codable {
    var serialNo: Int?
    var epicNo: String?
    var name: String?
    var relationType: String?
    var relativeName: String?
    var houseNo: String?
    var age: Int?
    var gender: String?
    var pageNo: Int
    var rawLines: [String]
}

var allBoxes: [ParsedBox] = []

let pageCount = pdfDoc.pageCount

for pageIdx in 2..<(pageCount - 1) {
    guard let page = pdfDoc.page(at: pageIdx) else { continue }
    let pageBounds = page.bounds(for: .mediaBox)
    let width = Int(pageBounds.width * 2.0)
    let height = Int(pageBounds.height * 2.0)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { continue }
    
    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.scaleBy(x: 2.0, y: 2.0)
    page.draw(with: .mediaBox, to: context)
    guard let cgImage = context.makeImage() else { continue }
    
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try? handler.perform([request])
    
    guard let observations = request.results as? [VNRecognizedTextObservation] else { continue }
    
    // Grid: 10 rows x 3 columns
    var grid = Array(repeating: Array(repeating: [String](), count: 3), count: 10)
    
    for obs in observations {
        guard let text = obs.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines) else { continue }
        if text.isEmpty || text == "Photo" || text == "Available" { continue }
        let midX = Double(obs.boundingBox.midX)
        let midY = Double(obs.boundingBox.midY)
        
        // Skip header (> 0.968) and footer (< 0.035)
        if midY > 0.968 || midY < 0.035 { continue }
        
        let col = min(2, max(0, Int(floor((midX - 0.02) / 0.32))))
        let row = min(9, max(0, Int(floor((0.965 - midY) / 0.0915))))
        grid[row][col].append(text)
    }
    
    for r in 0..<10 {
        for c in 0..<3 {
            let lines = grid[r][c]
            if lines.isEmpty { continue }
            
            var box = ParsedBox(pageNo: pageIdx + 1, rawLines: lines)
            
            for line in lines {
                // Serial No
                if let s = Int(line), s > 0 && s < 3000 {
                    box.serialNo = s
                }
                
                // EPIC Number
                let epicRegex = try? NSRegularExpression(pattern: "^[A-Z0-9]{2,4}[0-9]{6,8}$", options: .caseInsensitive)
                if let _ = epicRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.utf16.count)) {
                    box.epicNo = line
                }
                
                // Name
                if line.lowercased().contains("name") && !line.lowercased().contains("father") && !line.lowercased().contains("husband") && !line.lowercased().contains("mother") && !line.lowercased().contains("other") && !line.lowercased().contains("constituency") && !line.lowercased().contains("section") {
                    let parts = line.split(separator: ":", maxSplits: 1)
                    if parts.count > 1 {
                        box.name = parts[1].trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
                
                // Relation
                for rel in ["husband's name", "father's name", "mother's name", "other's name"] {
                    if line.lowercased().contains(rel) {
                        box.relationType = rel.capitalized
                        let parts = line.split(separator: ":", maxSplits: 1)
                        if parts.count > 1 {
                            box.relativeName = parts[1].trimmingCharacters(in: .whitespacesAndNewlines)
                        }
                    }
                }
                
                // House No
                if line.lowercased().contains("house number") {
                    let parts = line.split(separator: ":", maxSplits: 1)
                    if parts.count > 1 {
                        box.houseNo = parts[1].trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
                
                // Age & Gender
                if line.lowercased().contains("age") || line.lowercased().contains("gender") {
                    let ageRegex = try? NSRegularExpression(pattern: "Age\\s*:\\s*(\\d+)", options: .caseInsensitive)
                    if let match = ageRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.utf16.count)) {
                        if let range = Range(match.range(at: 1), in: line) {
                            box.age = Int(line[range])
                        }
                    }
                    if line.lowercased().contains("female") {
                        box.gender = "Female"
                    } else if line.lowercased().contains("male") {
                        box.gender = "Male"
                    }
                }
            }
            
            // Only add if it has voter info
            if box.name != nil || box.epicNo != nil || box.serialNo != nil || box.gender != nil {
                allBoxes.append(box)
            }
        }
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
if let data = try? encoder.encode(allBoxes) {
    try? data.write(to: URL(fileURLWithPath: outputPath))
    print("Successfully parsed and saved \(allBoxes.count) voter boxes to \(outputPath)")
}
