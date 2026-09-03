import Foundation
import Vision
import AppKit
import Quartz

guard CommandLine.arguments.count > 1 else {
    print("Usage: extract_english_158 <pdf_path>")
    exit(1)
}

let pdfPath = CommandLine.arguments[1]
let pdfURL = URL(fileURLWithPath: pdfPath)
guard let pdfDoc = PDFDocument(url: pdfURL) else {
    print("Failed to open PDF")
    exit(1)
}

let pageCount = pdfDoc.pageCount
print("Total pages: \(pageCount)")

struct ExtractedVoter: Codable {
    var serialNo: Int?
    var epicNo: String?
    var name: String?
    var relationType: String?
    var relativeName: String?
    var houseNo: String?
    var age: Int?
    var gender: String?
    var pageNo: Int
}

var allVoters: [ExtractedVoter] = []

for pageIdx in 2..<(pageCount - 1) { // 0-indexed: page 3 is index 2, up to pageCount - 2
    guard let page = pdfDoc.page(at: pageIdx) else { continue }
    let pageBounds = page.bounds(for: .mediaBox)
    
    // Render PDF page to CGImage
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let width = Int(pageBounds.width * 2.0)
    let height = Int(pageBounds.height * 2.0)
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
    
    // Sort observations: Vision coordinates have (0,0) at bottom-left
    // Sort primarily top-to-bottom (high Y to low Y), then left-to-right (low X to high X)
    let sortedObs = observations.sorted { a, b in
        let yA = a.boundingBox.midY
        let yB = b.boundingBox.midY
        if abs(yA - yB) > 0.02 {
            return yA > yB // top to bottom
        }
        return a.boundingBox.midX < b.boundingBox.midX // left to right
    }
    
    let strings = sortedObs.compactMap { $0.topCandidates(1).first?.string }
    // Group observations into voter boxes based on geometry or serial no / EPIC markers
    // For now, save raw strings per page for parsing
    print("Page \(pageIdx + 1): recognized \(strings.count) text lines")
}
