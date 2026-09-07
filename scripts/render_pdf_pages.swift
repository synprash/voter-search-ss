import Foundation
import Quartz

guard CommandLine.arguments.count > 2 else {
    print("Usage: render_pdf_pages <pdf_path> <output_dir>")
    exit(1)
}

let pdfPath = CommandLine.arguments[1]
let outDir = CommandLine.arguments[2]

let fm = FileManager.default
try? fm.createDirectory(atPath: outDir, withIntermediateDirectories: true)

guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
    print("Failed to load PDF: \(pdfPath)")
    exit(1)
}

for p in 2..<(doc.pageCount - 1) {
    guard let page = doc.page(at: p) else { continue }
    let pageBounds = page.bounds(for: .mediaBox)
    let width = Int(pageBounds.width)
    let height = Int(pageBounds.height)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
    page.draw(with: .mediaBox, to: ctx)
    guard let cgImage = ctx.makeImage() else { continue }
    
    let outPath = "\(outDir)/page_\(p + 1).jpg"
    guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outPath) as CFURL, "public.jpeg" as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, cgImage, nil)
    CGImageDestinationFinalize(dest)
}

print("Rendered \(doc.pageCount - 3) voter pages to \(outDir)")
