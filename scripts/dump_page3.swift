import Foundation
import Vision
import AppKit
import Quartz

let pdfURL = URL(fileURLWithPath: "raw-files/Booth No 158-English.pdf")
guard let pdfDoc = PDFDocument(url: pdfURL), let page = pdfDoc.page(at: 2) else { exit(1) }

let pageBounds = page.bounds(for: .mediaBox)
let width = Int(pageBounds.width * 2.0)
let height = Int(pageBounds.height * 2.0)
let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { exit(1) }
context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
context.scaleBy(x: 2.0, y: 2.0)
page.draw(with: .mediaBox, to: context)
guard let cgImage = context.makeImage() else { exit(1) }

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try? handler.perform([request])
guard let observations = request.results as? [VNRecognizedTextObservation] else { exit(1) }

struct Item: Codable {
    var text: String
    var midX: Double
    var midY: Double
}

let items = observations.compactMap { obs -> Item? in
    guard let str = obs.topCandidates(1).first?.string else { return nil }
    return Item(text: str, midX: Double(obs.boundingBox.midX), midY: Double(obs.boundingBox.midY))
}.sorted { $0.midY > $1.midY }

let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
if let d = try? encoder.encode(items) {
    try? d.write(to: URL(fileURLWithPath: "scripts/page3_dump.json"))
    print("Dumped \(items.count) items to scripts/page3_dump.json")
}
